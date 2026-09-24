import pandas as pd

df = pd.read_csv("../data/fraud_transactions.csv")

graph_data = df[[
    "TransactionID",
    "TransactionAmt",
    "ProductCD",
    "card4",
    "card6",
    "addr1",
    "addr2",
    "P_emaildomain",
    "R_emaildomain",
    "customer_id",
    "ts",
    "channel",
    "risk_score"
]].copy()

graph_data.to_csv(
    "../data/graph_transactions.csv",
    index=False
)

print("Graph transaction dataset created!")

print("Rows:", len(graph_data))
print("Columns:", len(graph_data.columns))

print("\nColumns:")
print(graph_data.columns.tolist())

print("\nFirst 5 rows:")
print(graph_data.head())