import os
import json
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load backend environment variables securely
BACKEND_DIR = Path(__file__).resolve().parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

from app import load_cases_df, case_row_to_dict
from agent_tools import (
    get_customer_transactions,
    get_transaction_details,
    check_region_history,
    check_device_identity,
    historical_case_analysis,
)
from tigergraph import get_graph_evidence
from fraud_agent import run_gemini_investigation

ROOT_DIR = BACKEND_DIR.parent
CASES_DIR = ROOT_DIR / "cases"

# Credentials/Secrets patterns to scrub recursively
SECRET_KEYS = {
    "TIGERGRAPH_SECRET", "GEMINI_API_KEY", "TIGERGRAPH_HOST", "API_KEY",
    "SECRET", "PASSWORD", "AUTH_HEADER", "AUTHORIZATION", "TOKEN", "BEARER"
}

def sanitize_data(data):
    """
    Recursively sanitize objects to prevent secret leakage and clean invalid float types (NaN, Infinity).
    """
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            k_str = str(k).upper()
            if any(sec in k_str for sec in SECRET_KEYS):
                continue
            cleaned[k] = sanitize_data(v)
        return cleaned
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, float):
        import math
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    elif isinstance(data, str):
        if "bearer " in data.lower() or "secret" in data.lower() and len(data) > 30:
            return "[REDACTED_SECRET]"
        return data
    return data

class QuotaExhaustedException(Exception):
    """Raised when Gemini returns a 429 RESOURCE_EXHAUSTED quota error."""
    pass

def run_case_investigation(row):
    """
    Runs full investigation pipeline for a single case row from case_pack.csv.
    """
    case_info = case_row_to_dict(row)
    customer_id = case_info["customer_id"]
    flagged_txn_id = case_info["flagged_txn_id"]

    # Gather evidence using existing backend modules
    txn_details = get_transaction_details(flagged_txn_id)
    customer_behavior = get_customer_transactions(customer_id)

    region = txn_details.get("region") if isinstance(txn_details, dict) else None
    region_history = check_region_history(customer_id, region)
    device_identity = check_device_identity(flagged_txn_id)
    graph_evidence = get_graph_evidence(customer_id, flagged_txn_id)
    history_findings = historical_case_analysis(customer_id=customer_id)

    # Prepare case payload for Gemini agent
    case_payload = {
        "case_id": case_info["case_id"],
        "customer_id": customer_id,
        "transaction_id": flagged_txn_id,
        "amount": txn_details.get("amount", 0.0) if isinstance(txn_details, dict) else 0.0,
        "risk_score": case_info.get("risk_score", 0.0),
        "channel": txn_details.get("channel", "unknown") if isinstance(txn_details, dict) else "unknown",
        "region": region
    }

    agent_result = run_gemini_investigation(case_payload)

    # Check for quota exhaustion failure
    if agent_result.get("status") == "error":
        msg = str(agent_result.get("message", ""))
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            raise QuotaExhaustedException(f"Gemini API quota exhausted for {case_info['case_id']}: {msg}")

    full_output = {
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

    return sanitize_data(full_output)


def is_file_valid_and_completed(fpath: Path, expected_case_id: str) -> bool:
    """Checks if an existing JSON case file has valid structure and completed assessment."""
    if not fpath.exists() or fpath.stat().st_size == 0:
        return False
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("case", {}).get("case_id", "").upper() != expected_case_id.upper():
            return False
        assessment = data.get("agent_assessment")
        if not assessment or not isinstance(assessment, dict):
            return False
        if not assessment.get("recommendation") or not assessment.get("suggested_action"):
            return False
        return True
    except Exception:
        return False


def validate_all_submission_files():
    """Validates all 20 HHG-001 through HHG-020 case JSON files against submission quality rules."""
    print("==================================================")
    print("VALIDATING ALL SUBMISSION CASE OUTPUTS (HHG-001 - HHG-020)")
    print("==================================================", flush=True)

    df = load_cases_df()
    expected_case_ids = [str(r["case_id"]).strip().upper() for _, r in df.iterrows()]

    validation_errors = []
    validated_cases = 0

    for expected_id in expected_case_ids:
        fpath = CASES_DIR / f"{expected_id}.json"

        if not fpath.exists():
            validation_errors.append(f"Missing file: {fpath.name}")
            continue

        if fpath.stat().st_size == 0:
            validation_errors.append(f"Empty file: {fpath.name}")
            continue

        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)

            json_case_id = data.get("case", {}).get("case_id", "").upper()
            if json_case_id != expected_id:
                validation_errors.append(f"{fpath.name}: Case ID mismatch (found '{json_case_id}', expected '{expected_id}')")

            # Check Secret leakage
            raw_str = json.dumps(data)
            if any(sec in raw_str for sec in ["TIGERGRAPH_SECRET", "GEMINI_API_KEY", "TIGERGRAPH_HOST"]):
                validation_errors.append(f"{fpath.name}: Contains potential secret reference!")

            # Check Graph evidence status
            g_status = data.get("graph_evidence", {}).get("status")
            if g_status != "completed":
                validation_errors.append(f"{fpath.name}: Graph evidence status is '{g_status}' (expected 'completed')")

            # Check Agent Assessment completeness
            assessment = data.get("agent_assessment")
            if not assessment or not isinstance(assessment, dict):
                validation_errors.append(f"{fpath.name}: Missing agent_assessment")
            else:
                rec = assessment.get("recommendation")
                if rec not in ["CLEAR", "REVIEW", "ESCALATE"]:
                    validation_errors.append(f"{fpath.name}: Invalid recommendation '{rec}'")
                if not assessment.get("confidence"):
                    validation_errors.append(f"{fpath.name}: Missing confidence score")
                if not assessment.get("suggested_action"):
                    validation_errors.append(f"{fpath.name}: Missing suggested_action")

            validated_cases += 1

        except Exception as e:
            validation_errors.append(f"{fpath.name}: JSON parse error: {e}")

    print(f"\nTotal cases inspected: {len(expected_case_ids)}")
    print(f"Valid submission outputs: {validated_cases}/{len(expected_case_ids)}")

    if validation_errors:
        print("\nVALIDATION ISSUES DETECTED:")
        for err in validation_errors:
            print(f" - {err}")
        return False
    else:
        print("\nSUCCESS: All 20 submission case outputs are complete, valid, and submission-ready!")
        return True


def refresh_top_level_graph_evidence():
    """
    NON-LLM repair function:
    Reads existing JSON files in cases/, queries live TigerGraph evidence for each customer_id & flagged_txn_id,
    and updates ONLY the top-level 'graph_evidence' key in place.
    Makes ZERO Gemini calls and preserves all other keys.
    """
    print("==================================================")
    print("REFRESHING LIVE TIGERGRAPH EVIDENCE (NON-LLM)")
    print("==================================================", flush=True)

    df = load_cases_df()
    total_cases = len(df)
    completed_count = 0
    failed_cases = []

    for idx, row in df.iterrows():
        case_id = str(row["case_id"]).strip().upper()
        customer_id = str(row["customer_id"])
        txn_id = str(row["flagged_txn_id"])
        fpath = CASES_DIR / f"{case_id}.json"

        if not fpath.exists():
            print(f"File cases/{case_id}.json does not exist. Skipping.", flush=True)
            failed_cases.append((case_id, "File missing"))
            continue

        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Query live TigerGraph evidence directly
            live_graph_evidence = get_graph_evidence(customer_id, txn_id)
            data["graph_evidence"] = sanitize_data(live_graph_evidence)

            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            status = live_graph_evidence.get("status")
            nodes_cnt = len(live_graph_evidence.get("nodes", []))
            edges_cnt = len(live_graph_evidence.get("edges", []))

            if status == "completed":
                completed_count += 1
                print(f"[{idx+1}/{total_cases}] {case_id}: Top-level graph_evidence refreshed -> {status} ({nodes_cnt} nodes, {edges_cnt} edges)", flush=True)
            else:
                msg = live_graph_evidence.get("message", "Unknown error")
                failed_cases.append((case_id, msg))
                print(f"[{idx+1}/{total_cases}] {case_id}: Top-level graph_evidence refreshed -> {status} ({msg})", flush=True)

        except Exception as e:
            failed_cases.append((case_id, str(e)))
            print(f"[{idx+1}/{total_cases}] {case_id}: ERROR updating JSON: {e}", flush=True)

    print("\n==================================================")
    print("GRAPH EVIDENCE REFRESH REPORT")
    print("==================================================", flush=True)
    print(f"Total Cases: {total_cases}")
    print(f"Cases with graph_evidence.status == 'completed': {completed_count}/{total_cases}")

    if failed_cases:
        print("\nCases with Graph Errors/Failures:")
        for cid, err in failed_cases:
            print(f" - {cid}: {err}")
    else:
        print("\nSUCCESS: All 20 cases successfully updated with live TigerGraph evidence!")


def main():
    parser = argparse.ArgumentParser(description="TigerGraph Fraud Submission Case Generator")
    parser.add_argument("--case", type=str, help="Generate a specific case ID (e.g. HHG-001)")
    parser.add_argument("--start", type=int, help="Start case index (1-based, e.g. 1)")
    parser.add_argument("--end", type=int, help="End case index (1-based, e.g. 5)")
    parser.add_argument("--force", action="store_true", help="Force overwrite of existing valid case files")
    parser.add_argument("--validate", action="store_true", help="Run full submission validation across all 20 case files")
    parser.add_argument("--refresh-graph", action="store_true", help="Non-LLM refresh of top-level graph_evidence across existing 20 case JSON files")

    args = parser.parse_args()

    if args.refresh_graph:
        refresh_top_level_graph_evidence()
        sys.exit(0)

    if args.validate:
        sys.exit(0 if validate_all_submission_files() else 1)

    CASES_DIR.mkdir(parents=True, exist_ok=True)
    df = load_cases_df()
    total_df = len(df)

    if args.case:
        target_id = args.case.strip().upper()
        matched = df[df["case_id"].str.upper() == target_id]
        if matched.empty:
            print(f"ERROR: Case ID '{target_id}' not found in case_pack.csv.")
            sys.exit(1)
        selected_rows = list(matched.iterrows())
    elif args.start is not None or args.end is not None:
        start_idx = (args.start - 1) if args.start and args.start > 0 else 0
        end_idx = args.end if args.end and args.end <= total_df else total_df
        selected_rows = list(df.iloc[start_idx:end_idx].iterrows())
    else:
        selected_rows = list(df.iterrows())

    print("==================================================")
    print(f"SUBMISSION CASE GENERATOR ({len(selected_rows)} cases selected)")
    print("==================================================", flush=True)

    completed_in_run = 0
    skipped_count = 0

    for idx_tuple in selected_rows:
        row = idx_tuple[1]
        case_id = str(row["case_id"]).strip().upper()
        target_path = CASES_DIR / f"{case_id}.json"

        if not args.force and is_file_valid_and_completed(target_path, case_id):
            print(f"Skipping {case_id} (valid completed file already exists). Use --force to overwrite.", flush=True)
            skipped_count += 1
            continue

        print(f"Investigating {case_id}...", flush=True)

        try:
            investigation_json = run_case_investigation(row)
            with open(target_path, "w", encoding="utf-8") as f:
                json.dump(investigation_json, f, indent=2, ensure_ascii=False)
            print(f"Saved cases/{case_id}.json", flush=True)
            completed_in_run += 1
        except QuotaExhaustedException as qe:
            print(f"\nSTOPPING GENERATION: {qe}", flush=True)
            print("Completed case files have been safely preserved. Re-run after quota reset to resume.", flush=True)
            sys.exit(1)
        except Exception as err:
            print(f"FAILED {case_id}: {err}", flush=True)

    print("\n==================================================")
    print(f"RUN SUMMARY: {completed_in_run} generated, {skipped_count} skipped.")
    print("==================================================", flush=True)


if __name__ == "__main__":
    main()
