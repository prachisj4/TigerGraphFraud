from agent_tools import (
    get_customer_transactions,
    get_transaction_details,
    check_region_history,
    check_device_identity
)
import pandas as pd

cases = pd.read_csv("../data/case_pack.csv")


def fraud_agent(case_id):

    print("\n=== FRAUD INVESTIGATION AGENT ===")
    print("Agent received case:", case_id)

    matched_case = cases[cases["case_id"] == case_id]

    if matched_case.empty:
        print("Case not found.")
        return

    case = matched_case.iloc[0]

    customer_id = case["customer_id"]

    print("\nAgent identified customer:", customer_id)

    print("\nAgent choosing tool...")
    print("Tool selected: get_customer_transactions")

    result = get_customer_transactions(customer_id)

    print("\n=== TOOL RESULT ===")
    print(result)

    transaction_id = case["flagged_txn_id"]

    print("\nAgent choosing next tool...")
    print("Tool selected: get_transaction_details")

    transaction_result = get_transaction_details(transaction_id)

    print("\n=== FLAGGED TRANSACTION RESULT ===")
    print(transaction_result)

    print("\nAgent choosing next tool...")
    print("Tool selected: check_region_history")

    region_result = check_region_history(
        customer_id,
        transaction_result["region"]
    )

    print("\n=== REGION HISTORY RESULT ===")
    print(region_result)

    print("\nAgent choosing next tool...")
    print("Tool selected: check_device_identity")

    device_result = check_device_identity(
        transaction_result["transaction_id"]
    )

    print("\n=== DEVICE / IDENTITY RESULT ===")
    print(device_result)

case_id = input("Enter Case ID: ").strip().upper()

fraud_agent(case_id)