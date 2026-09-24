from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

transactions_path = DATA_DIR / "fraud_transactions.csv"
transactions = pd.read_csv(transactions_path)



from typing import Optional, Dict, Any

def get_customer_transactions(customer_id: str) -> Dict[str, Any]:
    """
    Get baseline transaction statistics for a customer by customer_id.
    """
    customer_data = transactions[
        transactions["customer_id"] == customer_id
    ]

    if customer_data.empty:
        return {
            "customer_id": customer_id,
            "total_transactions": 0,
            "average_amount": 0.0,
            "maximum_amount": 0.0
        }

    return {
        "customer_id": customer_id,
        "total_transactions": int(len(customer_data)),
        "average_amount": round(float(customer_data["TransactionAmt"].mean()), 2),
        "maximum_amount": round(float(customer_data["TransactionAmt"].max()), 2)
    }


def get_transaction_details(transaction_id: str) -> Dict[str, Any]:
    """
    Get detailed information for a specific transaction by transaction_id.
    """
    try:
        txn_id = int(transaction_id)
    except (ValueError, TypeError):
        txn_id = transaction_id

    transaction = transactions[
        transactions["TransactionID"] == txn_id
    ]

    if transaction.empty:
        return {"error": "Transaction not found"}

    row = transaction.iloc[0]

    return {
        "transaction_id": int(row["TransactionID"]),
        "amount": float(row["TransactionAmt"]),
        "customer_id": str(row["customer_id"]),
        "channel": str(row["channel"]) if pd.notna(row["channel"]) else "unknown",
        "risk_score": float(row["risk_score"]) if pd.notna(row["risk_score"]) else None,
        "region": float(row["addr1"]) if pd.notna(row["addr1"]) else None
    }


def check_region_history(customer_id: str, region: Optional[float] = None) -> Dict[str, Any]:
    """
    Check how many times a customer has previously used a specific billing region (addr1).
    """
    customer_data = transactions[
        transactions["customer_id"] == customer_id
    ]

    if region is None or pd.isna(region):
        return {
            "region": None,
            "times_used": 0,
            "seen_before": False
        }

    region_transactions = customer_data[
        customer_data["addr1"] == region
    ]

    return {
        "region": float(region) if isinstance(region, (int, float)) else region,
        "times_used": int(len(region_transactions)),
        "seen_before": len(region_transactions) > 1
    }


def check_device_identity(transaction_id: str) -> Dict[str, Any]:
    """
    Check device type and browser info associated with a transaction.
    """
    identity_path = DATA_DIR / "identity.csv"

    try:
        txn_id = int(transaction_id)
    except (ValueError, TypeError):
        txn_id = transaction_id

    if not identity_path.exists():
        return {
            "identity_found": False,
            "message": "No identity/device record found"
        }

    identity = pd.read_csv(identity_path)

    record = identity[
        identity["TransactionID"] == txn_id
    ]

    if record.empty:
        return {
            "identity_found": False,
            "message": "No identity/device record found"
        }

    row = record.iloc[0]

    return {
        "identity_found": True,
        "device_type": str(row.get("DeviceType")) if pd.notna(row.get("DeviceType")) else None,
        "device_info": str(row.get("DeviceInfo")) if pd.notna(row.get("DeviceInfo")) else None
    }


def historical_case_analysis(customer_id: Optional[str] = None, pattern: Optional[str] = None) -> Dict[str, Any]:
    """
    Queries historical closed fraud cases to find outcomes for a customer or fraud pattern.
    """
    history_path = DATA_DIR / "closed_cases_history.csv"

    if not history_path.exists():
        return {"total_matches": 0, "cases": [], "summary": "No historical case records available"}


    df = pd.read_csv(history_path)

    filtered = df
    if customer_id:
        filtered = filtered[filtered["customer_id"] == str(customer_id)]

    if pattern and pattern != "all":
        filtered = filtered[filtered["pattern"] == str(pattern)]

    total_matches = len(filtered)
    if total_matches == 0 and customer_id:
        if pattern:
            filtered = df[df["pattern"] == str(pattern)]
            total_matches = len(filtered)

    fraud_cases = len(filtered[filtered["outcome"] == "confirmed_fraud"])
    cleared_cases = len(filtered[filtered["outcome"] == "cleared"])

    sample_cases = []
    for _, r in filtered.head(5).iterrows():
        sample_cases.append({
            "case_id": str(r["case_id"]),
            "customer_id": str(r["customer_id"]),
            "outcome": str(r["outcome"]),
            "pattern": str(r.get("pattern", "unknown")),
            "exposure_usd": float(r.get("exposure_usd", 0.0)),
            "analyst_notes": str(r.get("analyst_notes", ""))[:150] + "..." if pd.notna(r.get("analyst_notes")) else ""
        })

    return {
        "total_matches": total_matches,
        "confirmed_fraud_count": fraud_cases,
        "cleared_count": cleared_cases,
        "historical_fraud_rate": round(fraud_cases / total_matches, 2) if total_matches > 0 else 0.0,
        "sample_cases": sample_cases
    }