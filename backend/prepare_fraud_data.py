import pandas as pd

# Load 20 fraud cases
cases = pd.read_csv("../data/case_pack.csv")

# Get customers involved in these cases
customers = cases["customer_id"].dropna().unique()

print("Customers to investigate:", len(customers))

# Read huge transaction file in small chunks
matched = []

for chunk in pd.read_csv("../data/transactions.csv", chunksize=100000):

    result = chunk[chunk["customer_id"].isin(customers)]

    if len(result) > 0:
        matched.append(result)

# Combine all matching transactions
transactions = pd.concat(matched, ignore_index=True)

# Save smaller dataset
transactions.to_csv(
    "../data/fraud_transactions.csv",
    index=False
)

print("Done!")
print("Matching transactions:", len(transactions))
print("Customers found:", transactions["customer_id"].nunique())
print("\nColumns:")
print(transactions.columns.tolist())