import pandas as pd

identity = pd.read_csv("../data/identity.csv")

print("Total identity records:", len(identity))
print("Total columns:", len(identity.columns))

print("\nColumns:")
print(identity.columns.tolist())

print("\nFirst 5 rows:")
print(identity.head())