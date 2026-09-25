import os
import json
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

from google import genai
from google.genai import types

from agent_tools import (
    get_transaction_details,
    get_customer_transactions,
    check_region_history,
    check_device_identity,
    historical_case_analysis
)
from tigergraph import get_graph_evidence

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.8-flash"
]


def run_gemini_investigation(case: dict) -> dict:
    """
    Executes a multi-turn, tool-calling agentic investigation using Gemini.
    Enforces native tool calling via function_calling_config mode='ANY'.
    Maintains an observable trace of public tool execution activity.
    Strictly excludes internal thoughts, system prompts, or hidden reasoning.
    Includes multi-model failover for high resilience against transient API rate/capacity limits.
    """
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "status": "error",
            "message": "GEMINI_API_KEY not configured in backend/.env",
            "agent_trace": [],
            "assessment": None
        }

    client = genai.Client(api_key=api_key)

    tools_map = {
        "get_transaction_details": get_transaction_details,
        "get_customer_transactions": get_customer_transactions,
        "check_region_history": check_region_history,
        "check_device_identity": check_device_identity,
        "get_graph_evidence": get_graph_evidence,
        "historical_case_analysis": historical_case_analysis
    }

    python_tools = [
        get_transaction_details,
        get_customer_transactions,
        check_region_history,
        check_device_identity,
        get_graph_evidence,
        historical_case_analysis
    ]

    case_id = case.get("case_id", "UNKNOWN")
    customer_id = str(case.get("customer_id", ""))
    transaction_id = str(case.get("transaction_id", ""))
    amount = float(case.get("amount") or 0.0)
    risk_score = float(case.get("risk_score") or 0.0)
    channel = str(case.get("channel", "unknown"))
    region = case.get("region", None)

    initial_prompt = f"""
You are an expert Autonomous Fraud Investigation Agent analyzing Case ID: {case_id}.
Initial Case Summary:
- Customer ID: {customer_id}
- Transaction ID: {transaction_id}
- Transaction Amount: ${amount}
- Model Risk Score: {risk_score}
- Channel: {channel}
- Billing Region (addr1): {region}

INVESTIGATION OBJECTIVES:
Select and execute tools dynamically to gather empirical evidence for this case.
Available tools:
- `get_transaction_details`
- `get_customer_transactions`
- `check_region_history`
- `check_device_identity`
- `get_graph_evidence`
- `historical_case_analysis`
"""

    system_instruction = """
You are an elite Fraud Operations AI Investigator. You must investigate fraud cases systematically using tools.
Select tools autonomously based on initial findings. Synthesize empirical evidence from tool outputs into a final structured analysis.
"""

    last_error = None

    for model_id in CANDIDATE_MODELS:
        agent_trace = []
        step_counter = 1
        tools_used = set()

        try:
            # Force tool calling on initial message via tool_config mode='ANY'
            chat = client.chats.create(
                model=model_id,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=python_tools,
                    tool_config=types.ToolConfig(
                        function_calling_config=types.FunctionCallingConfig(mode="ANY")
                    ),
                    temperature=0.1
                )
            )

            response = None
            for send_attempt in range(1, 4):
                try:
                    response = chat.send_message(initial_prompt)
                    break
                except Exception as send_err:
                    err_str = str(send_err)
                    if ("503" in err_str or "UNAVAILABLE" in err_str or "429" in err_str or "RESOURCE_EXHAUSTED" in err_str) and send_attempt < 3:
                        time.sleep(2 * send_attempt)
                        continue
                    raise send_err

            max_turns = 10
            turn = 0

            while turn < max_turns:
                turn += 1

                function_calls = response.function_calls
                if not function_calls:
                    break

                for call in function_calls:
                    tool_name = call.name
                    tool_args = dict(call.args) if call.args else {}

                    tools_used.add(tool_name)

                    func = tools_map.get(tool_name)
                    if func:
                        try:
                            res = func(**tool_args)
                            exec_status = "completed"
                            summary_text = f"Successfully executed tool '{tool_name}'."
                        except Exception as exc:
                            res = {"error": f"Tool execution error: {str(exc)}"}
                            exec_status = "failed"
                            summary_text = f"Tool execution for '{tool_name}' failed."
                    else:
                        res = {"error": f"Tool '{tool_name}' not found"}
                        exec_status = "failed"
                        summary_text = f"Tool '{tool_name}' not found."

                    agent_trace.append({
                        "step": step_counter,
                        "tool": tool_name,
                        "status": exec_status,
                        "summary": summary_text,
                        "input": tool_args,
                        "output": res,
                        "timestamp": datetime.now().isoformat()
                    })
                    step_counter += 1

                    # Send tool execution result back to chat (mode='AUTO' allows agent to finish tools)
                    response = chat.send_message(
                        types.Part.from_function_response(
                            name=tool_name,
                            response={"result": res}
                        ),
                        config=types.GenerateContentConfig(
                            tool_config=types.ToolConfig(
                                function_calling_config=types.FunctionCallingConfig(mode="AUTO")
                            )
                        )
                    )

            final_assessment_prompt = """
Based on all the evidence gathered in this investigation trace, generate the final structured Fraud Assessment in JSON format.
Return ONLY valid JSON matching this schema:
{
  "recommendation": "CLEAR" | "REVIEW" | "ESCALATE",
  "confidence": 0.95,
  "summary": "Detailed executive summary of the investigation",
  "risk_factors": ["Factor 1", "Factor 2"],
  "supporting_evidence": ["Evidence item 1", "Evidence item 2"],
  "contradicting_evidence": ["Contradicting point 1 if any"],
  "graph_findings": ["TigerGraph relationship findings"],
  "historical_findings": ["Historical case pattern findings"],
  "suggested_action": "Recommended immediate operational action",
  "limitations": ["Any unknown or missing variables"],
  "tools_used": ["List of tool names executed"]
}
"""
            assessment_response = chat.send_message(
                final_assessment_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )

            raw_json = assessment_response.text or "{}"
            try:
                assessment_data = json.loads(raw_json)
            except Exception:
                assessment_data = {
                    "recommendation": "REVIEW",
                    "confidence": 0.5,
                    "summary": raw_json,
                    "risk_factors": [],
                    "supporting_evidence": [],
                    "contradicting_evidence": [],
                    "graph_findings": [],
                    "historical_findings": [],
                    "suggested_action": "Manual analyst review required",
                    "limitations": ["Failed to parse model structured JSON"],
                    "tools_used": list(tools_used)
                }

            # Enforce recommendation values strictly
            rec = str(assessment_data.get("recommendation", "")).upper()
            if rec not in ["CLEAR", "REVIEW", "ESCALATE"]:
                rec = "REVIEW"
            assessment_data["recommendation"] = rec

            # Enforce confidence range strictly 0.0 - 1.0
            try:
                conf = float(assessment_data.get("confidence", 0.8))
                conf = max(0.0, min(1.0, conf))
            except Exception:
                conf = 0.8
            assessment_data["confidence"] = conf

            assessment_data["tools_used"] = list(tools_used)

            return {
                "status": "success",
                "case_id": case_id,
                "agent_trace": agent_trace,
                "assessment": assessment_data,
                "model_used": model_id
            }

        except Exception as err:
            last_error = err
            print(f"Model {model_id} failed: {err}. Trying next candidate model...", flush=True)
            time.sleep(2)
            continue

    return {
        "status": "error",
        "message": str(last_error) if last_error else "All candidate models failed",
        "agent_trace": [],
        "assessment": None
    }
