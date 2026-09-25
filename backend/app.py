from pathlib import Path
import os
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

from pydantic import BaseModel
from typing import Optional

from agent_tools import (
    get_customer_transactions,
    get_transaction_details,
    check_region_history,
    check_device_identity,
    historical_case_analysis,
)
from tigergraph import test_connection as test_tg_connection, get_graph_evidence
from fraud_agent import run_gemini_investigation, GEMINI_API_KEY
from graphrag import run_graphrag_query

# Robust project-relative path resolution
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

cases_path = DATA_DIR / "case_pack.csv"

app = FastAPI(
    title="Fraud Investigation Agent API",
    description="Backend API for AI + Graph Intelligence Fraud Investigation System",
    version="1.0.0",
)

# Dynamic CORS Configuration for Production & Local Development
frontend_url = os.getenv("FRONTEND_URL")
allowed_origins = [
    "https://tigergraphfraud-frontend.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]
if frontend_url:
    allowed_origins.append(frontend_url)
    if frontend_url.endswith("/"):
        allowed_origins.append(frontend_url[:-1])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if (frontend_url or True) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def load_cases_df():
    if not cases_path.exists():
        raise RuntimeError(f"case_pack.csv not found at {cases_path}")
    df = pd.read_csv(cases_path)
    return df


def case_row_to_dict(row):
    return {
        "case_id": str(row["case_id"]),
        "opened_at": str(row["opened_at"]),
        "trigger_type": str(row["trigger_type"]),
        "trigger_text": str(row["trigger_text"]),
        "flagged_txn_id": str(row["flagged_txn_id"]),
        "card_id": str(row["card_id"]),
        "customer_id": str(row["customer_id"]),
        "risk_score": float(row["risk_score"]) if pd.notna(row["risk_score"]) else None,
    }


@app.get("/api/health")
def get_health():
    dataset_status = "available" if cases_path.exists() else "unavailable"
    tg_ok, _ = test_tg_connection()
    tigergraph_status = "connected" if tg_ok else "integration_pending"
    agent_status = "connected" if GEMINI_API_KEY else "not_connected"

    return {
        "status": "ok",
        "backend": "connected",
        "dataset": dataset_status,
        "agent": agent_status,
        "tigergraph": tigergraph_status,
    }


@app.get("/api/cases")
def get_all_cases():
    try:
        df = load_cases_df()
        cases = [case_row_to_dict(row) for _, row in df.iterrows()]
        return {"cases": cases, "total": len(cases)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cases/{case_id}")
def get_single_case(case_id: str):
    df = load_cases_df()
    matched = df[df["case_id"].str.upper() == case_id.upper()]

    if matched.empty:
        raise HTTPException(
            status_code=404, detail=f"Case ID '{case_id}' not found."
        )

    row = matched.iloc[0]
    return case_row_to_dict(row)


@app.post("/api/investigate/{case_id}")
def run_investigation(case_id: str):
    df = load_cases_df()
    matched = df[df["case_id"].str.upper() == case_id.upper()]

    if matched.empty:
        raise HTTPException(
            status_code=404, detail=f"Case ID '{case_id}' not found."
        )

    case_info = case_row_to_dict(matched.iloc[0])

    customer_id = case_info["customer_id"]
    flagged_txn_id = case_info["flagged_txn_id"]

    # Call CSV tools for base response context
    txn_details = get_transaction_details(flagged_txn_id)
    customer_behavior = get_customer_transactions(customer_id)

    region = txn_details.get("region") if isinstance(txn_details, dict) else None
    region_history = check_region_history(customer_id, region)
    device_identity = check_device_identity(flagged_txn_id)
    graph_evidence = get_graph_evidence(customer_id, flagged_txn_id)
    history_findings = historical_case_analysis(customer_id=customer_id)

    # Run Autonomous Gemini Agent Investigation
    case_payload = {
        "case_id": case_info["case_id"],
        "customer_id": customer_id,
        "transaction_id": flagged_txn_id,
        "amount": txn_details.get("amount", 0.0) if isinstance(txn_details, dict) else 0.0,
        "risk_score": case_info.get("risk_score", 0.0),
        "channel": txn_details.get("channel", "unknown") if isinstance(txn_details, dict) else "unknown",
        "region": region
    }

    try:
        agent_result = run_gemini_investigation(case_payload)
    except Exception as exc:
        agent_result = {
            "status": "error",
            "message": str(exc),
            "agent_trace": [],
            "assessment": None
        }

    return {
        "case": case_info,
        "transaction": txn_details,
        "customer_behavior": customer_behavior,
        "region_history": region_history,
        "device_identity": device_identity,
        "graph_evidence": graph_evidence,
        "historical_case_analysis": history_findings,
        "agent_trace": agent_result.get("agent_trace", []),
        "agent_assessment": agent_result.get("assessment"),
        "model_used": agent_result.get("model_used")
    }


class GraphRAGQueryRequest(BaseModel):
    customer_id: Optional[str] = None
    transaction_id: Optional[str] = None
    question: Optional[str] = "Analyze graph relationships for potential fraud risks."


@app.post("/api/graphrag/query")
def graphrag_query_endpoint(req: GraphRAGQueryRequest):
    try:
        res = run_graphrag_query(
            customer_id=req.customer_id,
            transaction_id=req.transaction_id,
            question=req.question or "Analyze graph relationships for potential fraud risks."
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

