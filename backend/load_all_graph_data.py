import os
import math
from pathlib import Path
import pandas as pd
from tigergraph import get_tigergraph_connection, get_graph_evidence, GRAPH_NAME

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def p(msg):
    print(msg, flush=True)


def clean_val(val):
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    if s.lower() in ("nan", "none", "null", "unknown", ""):
        return None
    return s


def load_all_data():
    conn, err = get_tigergraph_connection()
    if err or conn is None:
        p(f"FAILED to connect to TigerGraph: {err}")
        return False

    p("=== Starting Full TigerGraph Data Load ===")
    p(f"Connected to Graph: {GRAPH_NAME}")

    # Paths
    case_pack_path = DATA_DIR / "case_pack.csv"
    graph_txns_path = DATA_DIR / "graph_transactions.csv"
    identity_path = DATA_DIR / "identity.csv"

    case_df = pd.read_csv(case_pack_path)
    txn_df = pd.read_csv(graph_txns_path)

    identity_df = None
    if identity_path.exists():
        identity_df = pd.read_csv(identity_path)

    p(f"Loaded case_pack.csv: {len(case_df)} cases")
    p(f"Loaded graph_transactions.csv: {len(txn_df)} transaction rows")
    if identity_df is not None:
        p(f"Loaded identity.csv: {len(identity_df)} identity rows")

    # 1. Load All Case Customers & Cards & FraudCases
    p("\n[1/5] Upserting Customers, Cards, & FraudCases from case_pack.csv...")
    customer_vertices = []
    card_vertices = []
    case_vertices = []
    owns_edges = []
    flags_edges = []
    made_card_edges = []

    seen_custs = set()
    seen_cards = set()
    seen_cases = set()

    for _, row in case_df.iterrows():
        c_id = clean_val(row["customer_id"])
        card_id = clean_val(row["card_id"])
        case_id = clean_val(row["case_id"])
        flagged_txn_id = int(row["flagged_txn_id"])

        if c_id and c_id not in seen_custs:
            customer_vertices.append((c_id, {}))
            seen_custs.add(c_id)

        if card_id and card_id not in seen_cards:
            card_vertices.append((card_id, {}))
            seen_cards.add(card_id)

        if case_id and case_id not in seen_cases:
            case_vertices.append((case_id, {}))
            seen_cases.add(case_id)

        if c_id and card_id:
            owns_edges.append((c_id, card_id, {}))

        if flagged_txn_id and case_id:
            flags_edges.append((flagged_txn_id, case_id, {}))

        if flagged_txn_id and card_id:
            made_card_edges.append((flagged_txn_id, card_id, {}))

    if customer_vertices:
        conn.upsertVertices("Customer", customer_vertices)
    if card_vertices:
        conn.upsertVertices("Card", card_vertices)
    if case_vertices:
        conn.upsertVertices("FraudCase", case_vertices)
    if owns_edges:
        conn.upsertEdges("Customer", "Owns", "Card", owns_edges)
    if flags_edges:
        conn.upsertEdges("Transaction", "FLAGS", "FraudCase", flags_edges)
    if made_card_edges:
        conn.upsertEdges("Transaction", "Made", "Card", made_card_edges)

    p(f"  Upserted {len(seen_custs)} Case Customers")
    p(f"  Upserted {len(seen_cards)} Case Cards")
    p(f"  Upserted {len(seen_cases)} FraudCases")

    # 2. Load Transactions & Relationships from graph_transactions.csv
    p("\n[2/5] Batch Upserting Transactions & Relationships from graph_transactions.csv...")

    chunk_size = 3000
    total_txns = len(txn_df)
    num_chunks = math.ceil(total_txns / chunk_size)

    device_map = {}
    if identity_df is not None and not identity_df.empty:
        for _, row in identity_df.iterrows():
            t_id = row.get("TransactionID")
            if pd.notna(t_id):
                try:
                    t_id_int = int(t_id)
                except ValueError:
                    continue
                dev_info = clean_val(row.get("DeviceInfo"))
                dev_type = clean_val(row.get("DeviceType"))
                dev_val = dev_info or dev_type
                if dev_val:
                    device_map[t_id_int] = dev_val

    for i in range(num_chunks):
        chunk = txn_df.iloc[i * chunk_size : (i + 1) * chunk_size]

        cust_batch = []
        txn_batch = []
        made_txn_edges = []
        billed_in_edges = []
        email_edges = []
        device_edges = []

        region_vertices = set()
        email_vertices = set()
        device_vertices = set()

        for _, row in chunk.iterrows():
            try:
                txn_id = int(row["TransactionID"])
            except (ValueError, TypeError):
                continue

            c_id = clean_val(row.get("customer_id"))
            if c_id and c_id not in seen_custs:
                cust_batch.append((c_id, {}))
                seen_custs.add(c_id)

            amt = float(row["TransactionAmt"]) if pd.notna(row.get("TransactionAmt")) else 0.0
            ts_str = clean_val(row.get("ts")) or ""
            ch_str = clean_val(row.get("channel")) or ""
            risk_val = float(row["risk_score"]) if pd.notna(row.get("risk_score")) else 0.0

            txn_attrs = {
                "transaction_amt": amt,
                "ts": ts_str,
                "channel": ch_str,
                "risk_score": risk_val,
            }

            txn_batch.append((txn_id, txn_attrs))

            if c_id:
                made_txn_edges.append((c_id, txn_id, {}))

            # Billing Region (addr1)
            region_raw = row.get("addr1")
            if pd.notna(region_raw):
                try:
                    region_str = str(int(float(region_raw)))
                    region_vertices.add(region_str)
                    billed_in_edges.append((txn_id, region_str, {}))
                except (ValueError, TypeError):
                    pass

            # Email Domain (P_emaildomain)
            email_str = clean_val(row.get("P_emaildomain"))
            if email_str:
                email_vertices.add(email_str)
                email_edges.append((txn_id, email_str, {}))

            # Device Profile (from identity.csv)
            dev_val = device_map.get(txn_id)
            if dev_val:
                device_vertices.add(dev_val)
                device_edges.append((txn_id, dev_val, {}))

        # Perform Batch Upserts
        if cust_batch:
            conn.upsertVertices("Customer", cust_batch)
        if txn_batch:
            conn.upsertVertices("Transaction", txn_batch)
        if region_vertices:
            conn.upsertVertices("BillingRegion", [(r, {}) for r in region_vertices])
        if email_vertices:
            conn.upsertVertices("EmailDomain", [(e, {}) for e in email_vertices])
        if device_vertices:
            conn.upsertVertices("DeviceProfile", [(d, {}) for d in device_vertices])

        if made_txn_edges:
            conn.upsertEdges("Customer", "made_transaction", "Transaction", made_txn_edges)
        if billed_in_edges:
            conn.upsertEdges("Transaction", "BILLED_IN", "BillingRegion", billed_in_edges)
        if email_edges:
            conn.upsertEdges("Transaction", "PURCHASER_EMAIL", "EmailDomain", email_edges)
        if device_edges:
            conn.upsertEdges("Transaction", "FROM_DEVICE", "DeviceProfile", device_edges)

        p(f"  Chunk {i+1}/{num_chunks} processed ({len(txn_batch)} transactions)")

    p("\n[3/5] Verifying TigerGraph Vertices and Edges Summary...")
    v_types = ["Customer", "Transaction", "Card", "DeviceProfile", "BillingRegion", "EmailDomain", "FraudCase"]
    e_types = [
        ("Customer", "made_transaction", "Transaction"),
        ("Customer", "Owns", "Card"),
        ("Transaction", "Made", "Card"),
        ("Transaction", "FROM_DEVICE", "DeviceProfile"),
        ("Transaction", "BILLED_IN", "BillingRegion"),
        ("Transaction", "PURCHASER_EMAIL", "EmailDomain"),
        ("Transaction", "FLAGS", "FraudCase"),
    ]

    v_counts = {}
    for vt in v_types:
        try:
            cnt = conn.getVertexCount(vt)
            v_counts[vt] = cnt
        except Exception as e:
            v_counts[vt] = f"Error: {e}"

    e_counts = {}
    for src, et, tgt in e_types:
        try:
            cnt = conn.getEdgeCount(et, sourceVertexType=src, targetVertexType=tgt)
            e_counts[et] = cnt
        except Exception:
            try:
                cnt = conn.getEdgeCount(et)
                e_counts[et] = cnt
            except Exception as e:
                e_counts[et] = f"Error: {e}"

    p("\n=== Real TigerGraph Vertex Counts ===")
    for vt, cnt in v_counts.items():
        p(f"  {vt}: {cnt}")

    p("\n=== Real TigerGraph Edge Counts ===")
    for et, cnt in e_counts.items():
        p(f"  {et}: {cnt}")

    # 4. Verify Coverage for All 20 Cases
    p("\n[4/5] Verifying 20/20 Cases Coverage...")
    customers_found = 0
    flagged_txns_found = 0
    cases_found = 0
    txns_with_edges = 0

    evidence_success_count = 0

    for _, row in case_df.iterrows():
        c_id = str(row["customer_id"])
        case_id = str(row["case_id"])
        txn_id = str(row["flagged_txn_id"])

        c_v = conn.getVerticesById("Customer", c_id)
        t_v = conn.getVerticesById("Transaction", txn_id)
        case_v = conn.getVerticesById("FraudCase", case_id)

        if c_v:
            customers_found += 1
        if t_v:
            flagged_txns_found += 1
        if case_v:
            cases_found += 1

        c_edges = conn.getEdges("Customer", c_id)
        if c_edges:
            txns_with_edges += 1

        # Test get_graph_evidence for this case
        ev = get_graph_evidence(c_id, txn_id)
        if ev and ev.get("status") == "completed":
            evidence_success_count += 1

    p("\n=== 20 Cases Verification Report ===")
    p(f"Total Cases: {len(case_df)}")
    p(f"Customers Found: {customers_found}/{len(case_df)}")
    p(f"Flagged Transactions Found: {flagged_txns_found}/{len(case_df)}")
    p(f"FraudCase Vertices Found: {cases_found}/{len(case_df)}")
    p(f"Customers with Graph Edges: {txns_with_edges}/{len(case_df)}")
    p(f"get_graph_evidence API Success: {evidence_success_count}/{len(case_df)}")

    return True


if __name__ == "__main__":
    load_all_data()
