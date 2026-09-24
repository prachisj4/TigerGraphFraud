import pandas as pd

df = pd.read_csv("../data/fraud_transactions.csv")
cases = pd.read_csv("../data/case_pack.csv")

print("Total extracted transactions:", len(df))
print("Customers found:", df["customer_id"].nunique())

# Check flagged transactions
flagged = cases["flagged_txn_id"].dropna()
found = df[df["TransactionID"].isin(flagged)]

print("Flagged transactions expected:", len(flagged))
print("Flagged transactions found:", len(found))

print("\nFound flagged transactions:")
print(found[[
    "TransactionID",
    "TransactionAmt",
    "customer_id",
    "ts",
    "channel",
    "risk_score"
]])