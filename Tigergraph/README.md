# TigerGraph Schema & Architecture Documentation

This directory contains the schema definitions, architecture details, and data loading specifications for the **CustomerTransactionGraph** graph database hosted on TigerGraph Savanna.

---

## 1. Graph Schema Overview

The graph model represents financial entities, cardholder behaviors, device fingerprints, and fraud case linkages.

```
                  +--------------+
                  |  Customer    |
                  +-------+------+
                          |
             +------------+------------+
             |                         |
      (made_transaction)            (Owns)
             |                         |
             v                         v
      +--------------+          +--------------+
      | Transaction  |---+=====>|    Card      |
      +------+-------+  (Made)  +--------------+
             |
             |--(FROM_DEVICE)---> [ DeviceProfile ]
             |--(BILLED_IN)-----> [ BillingRegion ]
             |--(PURCHASER_EMAIL)-> [ EmailDomain ]
             \--(FLAGS)---------> [ FraudCase ]
```

---

## 2. Vertex Definitions

| Vertex Type | Primary ID | Key Attributes | Purpose |
|---|---|---|---|
| `Customer` | `customer_id` (STRING) | `fraud_flag` (BOOL) | Represents cardholder accounts |
| `Transaction` | `transaction_id` (INT) | `transaction_amt`, `ts`, `channel`, `risk_score` | Financial transaction events |
| `Card` | `card_id` (STRING) | `card_type`, `issue_country` | Payment instruments used |
| `DeviceProfile` | `device_id` (STRING) | `device_type`, `os_info` | Physical/digital hardware fingerprints |
| `BillingRegion` | `region_id` (STRING) | `region_name` | Geographic location / postal zone |
| `EmailDomain` | `domain_name` (STRING) | N/A | Purchaser email domain |
| `FraudCase` | `case_id` (STRING) | `opened_at`, `trigger_type`, `risk_score` | High-level fraud investigation cases |

---

## 3. Edge Definitions

| Edge Name | Source Vertex | Target Vertex | Direction | Purpose |
|---|---|---|---|---|
| `made_transaction` | `Customer` | `Transaction` | Directed | Links customer to executed transactions |
| `Owns` | `Customer` | `Card` | Undirected | Links customer to registered payment cards |
| `Made` | `Transaction` | `Card` | Directed | Identifies card used for a transaction |
| `FROM_DEVICE` | `Transaction` | `DeviceProfile` | Directed | Links transaction to device fingerprint |
| `BILLED_IN` | `Transaction` | `BillingRegion` | Directed | Links transaction to billing region |
| `PURCHASER_EMAIL` | `Transaction` | `EmailDomain` | Directed | Links transaction to purchaser email domain |
| `FLAGS` | `Transaction` | `FraudCase` | Directed | Connects flagged transaction to fraud case |

---

## 4. Data Loading Pipeline

All graph data is upserted into TigerGraph Savanna via pyTigerGraph using:
`python backend/load_all_graph_data.py`

- **Vertices**: `Customer`, `Transaction`, `Card`, `DeviceProfile`, `BillingRegion`, `EmailDomain`, `FraudCase`
- **Edges**: `made_transaction`, `Owns`, `Made`, `FROM_DEVICE`, `BILLED_IN`, `PURCHASER_EMAIL`, `FLAGS`
