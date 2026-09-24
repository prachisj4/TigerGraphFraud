import pandas as pd

# Load data
cases = pd.read_csv("../data/case_pack.csv")
transactions = pd.read_csv("../data/fraud_transactions.csv")

# Investigate first case
case_id = input("Enter Case ID (example HHG-001): ").strip()

matched_case = cases[cases["case_id"] == case_id]

if matched_case.empty:
    print("Case ID not found. Example: HHG-001")
    exit()

case = matched_case.iloc[0]

customer_id = case["customer_id"]
flagged_txn = case["flagged_txn_id"]

print("=== FRAUD INVESTIGATION ===")
print("Case:", case_id)
print("Customer:", customer_id)
print("Flagged Transaction:", flagged_txn)
print("Risk Score:", case["risk_score"])

# Customer's transaction history
history = transactions[
    transactions["customer_id"] == customer_id
]

print("Customer Transactions:", len(history))

# Flagged transaction details
flagged = transactions[
    transactions["TransactionID"] == flagged_txn
]

print("\nFLAGGED TRANSACTION:")
print(flagged[[
    "TransactionID",
    "TransactionAmt",
    "ts",
    "channel",
    "risk_score",
    "addr1"
]])

# Compare flagged transaction with customer's normal spending

average_amount = history["TransactionAmt"].mean()
max_amount = history["TransactionAmt"].max()

flagged_amount = flagged["TransactionAmt"].iloc[0]

print("\n=== BEHAVIOR ANALYSIS ===")

print("Average transaction amount:", round(average_amount, 2))
print("Maximum transaction amount:", round(max_amount, 2))
print("Flagged transaction amount:", flagged_amount)

if flagged_amount > average_amount * 2:
    print("Finding: Transaction amount is unusually high.")
else:
    print("Finding: Transaction amount is within normal spending range.")

# Check billing region behavior

flagged_region = flagged["addr1"].iloc[0]

same_region = history[
    history["addr1"] == flagged_region
]

print("\n=== REGION ANALYSIS ===")
print("Flagged region:", flagged_region)
print("Transactions from this region:", len(same_region))
print("Total customer transactions:", len(history))

if len(same_region) <= 5:
    print("Finding: This is an unusual billing region.")
else:
    print("Finding: Customer has used this billing region before.")

# Evidence scoring

evidence_score = 0
reasons = []

# Risk score evidence
risk_score = flagged["risk_score"].iloc[0]
if risk_score >= 0.7:
    evidence_score += 2
    reasons.append("High model risk score")
elif risk_score >= 0.5:
    evidence_score += 1
    reasons.append("Moderate model risk score")

# Amount evidence
if flagged_amount > average_amount * 2:
    evidence_score += 1
    reasons.append("Unusually high transaction amount")

# Region evidence
if len(same_region) <= 5:
    evidence_score += 1
    reasons.append("Unusual billing region")

print("\n=== INVESTIGATION SUMMARY ===")
print("Evidence Score:", evidence_score)

print("Reasons:")
for reason in reasons:
    print("-", reason)

# Identity / Device analysis

identity = pd.read_csv("../data/identity.csv")

flagged_identity = identity[
    identity["TransactionID"] == flagged_txn
]

print("\n=== DEVICE / IDENTITY ANALYSIS ===")

if len(flagged_identity) > 0:
    print("Identity record found!")

    if "DeviceType" in flagged_identity.columns:
        print("Device Type:", flagged_identity["DeviceType"].iloc[0])

    if "DeviceInfo" in flagged_identity.columns:
        print("Device Info:", flagged_identity["DeviceInfo"].iloc[0])

else:
    print("No identity/device record available for this transaction.")

# Final recommendation

print("\n=== FINAL RECOMMENDATION ===")

if evidence_score >= 3:
    decision = "ESCALATE"
    explanation = "Multiple suspicious signals were detected."

elif evidence_score >= 1:
    decision = "REVIEW"
    explanation = "Some risk exists, but current evidence is not strong enough to confirm fraud."

else:
    decision = "LOW RISK"
    explanation = "No strong suspicious behavior was detected."

print("Decision:", decision)
print("Explanation:", explanation)