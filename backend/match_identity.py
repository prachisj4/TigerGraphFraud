import pandas as pd

# Our 20 customers' transactions
transactions = pd.read_csv("../data/fraud_transactions.csv")

# Identity/device data
identity = pd.read_csv("../data/identity.csv")

# Find identity records belonging to our transactions
matched = identity[
    identity["TransactionID"].isin(transactions["TransactionID"])
]

print("Fraud-case transactions:", len(transactions))
print("Matched identity records:", len(matched))

print("\nDevice types:")
print(matched["DeviceType"].value_counts(dropna=False))

print("\nSample devices:")
print(
    matched[
        ["TransactionID", "DeviceType", "DeviceInfo"]
    ].head(10)
)