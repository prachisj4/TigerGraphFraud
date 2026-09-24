import pandas as pd

cases = pd.read_csv("../data/case_pack.csv")

print("Total cases:", len(cases))
print("Unique customers:", cases["customer_id"].nunique())
print("Unique cards:", cases["card_id"].nunique())

print("\nCustomer and Card IDs:")
print(
    cases[
        ["case_id", "customer_id", "card_id", "flagged_txn_id"]
    ]
)