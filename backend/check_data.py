import pandas as pd

transactions = pd.read_csv(
    "../data/transactions.csv",
    usecols=[
        "TransactionID",
        "TransactionAmt",
        "addr1",
        "customer_id",
        "ts",
        "channel",
        "risk_score"
    ]
)

transactions["ts"] = pd.to_datetime(transactions["ts"])

# Customer C12382
customer = transactions[
    transactions["customer_id"] == "C12382"
]

# Only region 444 transactions
region_444 = customer[
    customer["addr1"] == 444
]

region_444 = region_444.sort_values("ts")

print(region_444.to_string(index=False))

print("\nTotal transactions in region 444:", len(region_444))