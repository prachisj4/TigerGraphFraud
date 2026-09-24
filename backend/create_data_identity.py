import pandas as pd

# Load identity data
identity = pd.read_csv("../data/identity.csv")

# Load our fraud-case transactions
transactions = pd.read_csv("../data/fraud_transactions.csv")

# Keep identity records for our transactions
matched = identity[
    identity["TransactionID"].isin(transactions["TransactionID"])
].copy()

# Keep useful device fields
device_data = matched[[
    "TransactionID",
    "id_15",
    "id_23",
    "id_30",
    "id_31",
    "id_33",
    "DeviceType",
    "DeviceInfo"
]]

# Save
device_data.to_csv(
    "../data/graph_identity.csv",
    index=False
)

print("Graph identity dataset created!")
print("Rows:", len(device_data))
print("Columns:", len(device_data.columns))

print("\nColumns:")
print(device_data.columns.tolist())

print("\nFirst 5 rows:")
print(device_data.head())