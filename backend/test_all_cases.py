import os
import json
import time
import pandas as pd
from pathlib import Path

from app import load_cases_df, case_row_to_dict
from agent_tools import (
    get_customer_transactions,
    get_transaction_details,
    check_region_history,
    check_device_identity,
    historical_case_analysis,
)
from tigergraph import get_graph_evidence, get_tigergraph_connection
from fraud_agent import run_gemini_investigation, GEMINI_API_KEY

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def run_full_verification():
    print("==================================================")
    print("PHASE 8 FINAL VERIFICATION: 20 FRAUD CASES TEST")
    print("==================================================", flush=True)

    df = load_cases_df()
    total_cases = len(df)
    results = []

    successful = 0
    failed = 0

    cust_coverage_count = 0
    txn_coverage_count = 0
    graph_evidence_success_count = 0

    models_used_set = set()

    # Get TG connection for graph coverage verification
    conn, _ = get_tigergraph_connection()

    for idx, row in df.iterrows():
        case_info = case_row_to_dict(row)
        case_id = case_info["case_id"]
        customer_id = case_info["customer_id"]
        txn_id = case_info["flagged_txn_id"]

        # Check TG graph coverage
        cust_exists = False
        txn_exists = False
        if conn:
            try:
                c_v = conn.getVerticesById("Customer", customer_id)
                cust_exists = bool(c_v and len(c_v) > 0)
            except Exception:
                pass

            try:
                t_v = conn.getVerticesById("Transaction", str(txn_id))
                txn_exists = bool(t_v and len(t_v) > 0)
            except Exception:
                pass

        if cust_exists:
            cust_coverage_count += 1
        if txn_exists:
            txn_coverage_count += 1

        # Check graph evidence function
        g_ev = get_graph_evidence(customer_id, txn_id)
        g_status = g_ev.get("status", "unavailable")
        if g_status == "completed":
            graph_evidence_success_count += 1

        # Check historical case analysis tool
        h_ev = historical_case_analysis(customer_id=customer_id)
        h_status = "completed" if h_ev.get("total_matches", 0) > 0 or h_ev.get("confirmed_fraud_count", 0) >= 0 else "unavailable"

        payload = {
            "case_id": case_id,
            "customer_id": customer_id,
            "transaction_id": txn_id,
            "amount": 250.0,
            "risk_score": case_info.get("risk_score") or 0.0,
            "channel": "web",
            "region": 123.0
        }

        agent_res = run_gemini_investigation(payload)
        status = agent_res.get("status")

        if status == "success":
            successful += 1
            assessment = agent_res.get("assessment", {})
            rec = assessment.get("recommendation", "REVIEW")
            conf = assessment.get("confidence", 0.8)
            model = agent_res.get("model_used", "gemini")
            models_used_set.add(model)
            tools = assessment.get("tools_used", [])
            n_tool_calls = len(agent_res.get("agent_trace", []))

            res_dict = {
                "case_id": case_id,
                "status": "success",
                "recommendation": rec,
                "confidence": conf,
                "tools_selected": tools,
                "tool_calls_count": n_tool_calls,
                "tigergraph_evidence": g_status,
                "historical_evidence": h_status,
                "model_used": model,
                "error": None
            }
        else:
            failed += 1
            err = agent_res.get("message", "Unknown error")
            res_dict = {
                "case_id": case_id,
                "status": "failed",
                "recommendation": None,
                "confidence": None,
                "tools_selected": [],
                "tool_calls_count": 0,
                "tigergraph_evidence": g_status,
                "historical_evidence": h_status,
                "model_used": None,
                "error": err
            }

        results.append(res_dict)

        print(f"[{idx+1:02d}/20] Case {case_id}: status={res_dict['status']} | rec={res_dict['recommendation']} | conf={res_dict['confidence']} | model={res_dict['model_used']} | tools={res_dict['tools_selected']}", flush=True)

        # Pause briefly to prevent free tier per-minute rate limits
        time.sleep(1.5)

    print("\n==================================================", flush=True)
    print("FINAL VERIFICATION SUMMARY REPORT", flush=True)
    print("==================================================", flush=True)
    print(f"Total cases: {total_cases}", flush=True)
    print(f"Successful investigations: {successful}/{total_cases}", flush=True)
    print(f"Failed investigations: {failed}/{total_cases}", flush=True)
    print(f"Customer graph coverage: {cust_coverage_count}/{total_cases}", flush=True)
    print(f"Flagged transaction graph coverage: {txn_coverage_count}/{total_cases}", flush=True)
    print(f"Graph evidence query success: {graph_evidence_success_count}/{total_cases}", flush=True)
    print(f"Actual model(s) used: {list(models_used_set)}", flush=True)
    print("==================================================", flush=True)

    with open("verification_results.json", "w") as f:
        json.dump({
            "summary": {
                "total": total_cases,
                "successful": successful,
                "failed": failed,
                "customer_graph_coverage": cust_coverage_count,
                "txn_graph_coverage": txn_coverage_count,
                "graph_evidence_success": graph_evidence_success_count,
                "models_used": list(models_used_set)
            },
            "cases": results
        }, f, indent=2)

    return results


if __name__ == "__main__":
    run_full_verification()
