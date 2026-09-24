import pandas as pd

df = pd.read_csv(
    "../data/transactions.csv",
    usecols=[
        "TransactionID",
        "TransactionAmt",
        "customer_id",
        "ts",
        "channel",
        "risk_score"
    ]
)

# Small sample for initial TigerGraph setup
sample = df.head(1000)

sample.to_csv("../data/transactions_sample.csv", index=False)

print("Created transactions_sample.csv")
print("Rows:", len(sample))