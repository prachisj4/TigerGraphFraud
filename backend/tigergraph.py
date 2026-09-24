import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

TIGERGRAPH_SECRET = os.getenv("TIGERGRAPH_SECRET")
TIGERGRAPH_HOST = os.getenv("TIGERGRAPH_HOST")
GRAPH_NAME = "CustomerTransactionGraph"


def get_tigergraph_connection():
    """
    Establishes and returns a pyTigerGraph connection to CustomerTransactionGraph.
    Handles authentication via TIGERGRAPH_SECRET.
    Returns (connection_object, error_message).
    """
    if not TIGERGRAPH_HOST or "YOUR_TIGERGRAPH_DOMAIN" in TIGERGRAPH_HOST:
        return None, "TIGERGRAPH_HOST placeholder detected. Real Savanna host URL required in backend/.env"

    if not TIGERGRAPH_SECRET:
        return None, "TIGERGRAPH_SECRET missing in backend/.env"

    try:
        import pyTigerGraph as tg

        conn = tg.TigerGraphConnection(
            host=TIGERGRAPH_HOST,
            graphname=GRAPH_NAME,
            gsqlSecret=TIGERGRAPH_SECRET,
        )

        token = conn.getToken(secret=TIGERGRAPH_SECRET)
        if token:
            if isinstance(token, tuple):
                token = token[0]
            conn.apiToken = token

        return conn, None
    except Exception as e:
        return None, f"TigerGraph Connection Error: {str(e)}"


def test_connection():
    """
    Safe test function to verify TigerGraph connection.
    Tests accessibility of CustomerTransactionGraph and queries customer C12382.
    Does NOT print credentials.
    """
    conn, err = get_tigergraph_connection()
    if err or conn is None:
        return False, err or "TigerGraph connection unavailable"

    try:
        vertices = conn.getVerticesById("Customer", "C12382")
        found = bool(vertices and len(vertices) > 0)
        if found:
            return True, f"Connection successful. Customer C12382 queried in {GRAPH_NAME}"
        else:
            return True, f"Connection successful to {GRAPH_NAME}"
    except Exception as e:
        return False, f"TigerGraph Query Error: {str(e)}"


def get_graph_evidence(customer_id: str, transaction_id: str):
    """
    Retrieves REAL graph relationship evidence from TigerGraph for a given customer & transaction.
    Returns structured dict with status, summary, nodes, edges, and findings.
    If TigerGraph is unavailable, returns graceful status='unavailable'.
    """
    conn, err = get_tigergraph_connection()
    if err or conn is None:
        return {
            "status": "unavailable",
            "message": err or "TigerGraph connection unavailable",
            "nodes": [],
            "edges": [],
            "findings": [],
        }

    try:
        nodes = []
        edges = []
        findings = []
        added_node_ids = set()

        # 1. Query Customer vertex by ID
        try:
            cust_res = conn.getVerticesById("Customer", customer_id)
            if cust_res:
                nodes.append({
                    "id": customer_id,
                    "type": "Customer",
                    "label": f"Customer {customer_id}",
                    "properties": cust_res[0].get("attributes", {"customer_id": customer_id}),
                })
                added_node_ids.add(customer_id)
        except Exception:
            pass

        # 2. Query Transaction vertex by ID
        try:
            txn_res = conn.getVerticesById("Transaction", str(transaction_id))
            if txn_res:
                nodes.append({
                    "id": str(transaction_id),
                    "type": "Transaction",
                    "label": f"Txn {transaction_id}",
                    "properties": txn_res[0].get("attributes", {"transaction_id": transaction_id}),
                })
                added_node_ids.add(str(transaction_id))
        except Exception:
            pass

        # 3. Query Real Edges from Customer in TigerGraph
        try:
            cust_edges = conn.getEdges("Customer", customer_id)
            for e in cust_edges:
                e_type = e.get("e_type", "edge")
                to_id = str(e.get("to_id"))
                to_type = e.get("to_type", "Transaction")

                if to_id == str(transaction_id):
                    edges.append({
                        "source": customer_id,
                        "target": to_id,
                        "type": e_type,
                        "label": e_type,
                    })
                    findings.append(
                        f"Customer {customer_id} is connected via '{e_type}' to Flagged Transaction {to_id} in TigerGraph."
                    )
                elif len(nodes) < 10:
                    if to_id not in added_node_ids:
                        nodes.append({
                            "id": to_id,
                            "type": "Transaction" if to_type == "Transaction" else "Card",
                            "label": f"{to_type} {to_id}",
                            "properties": e.get("attributes", {}),
                        })
                        added_node_ids.add(to_id)
                    edges.append({
                        "source": customer_id,
                        "target": to_id,
                        "type": e_type,
                        "label": e_type,
                    })
        except Exception:
            pass

        return {
            "status": "completed",
            "summary": {
                "customer_id": customer_id,
                "transaction_id": transaction_id,
                "total_nodes": len(nodes),
                "total_edges": len(edges),
            },
            "nodes": nodes,
            "edges": edges,
            "findings": findings,
        }

    except Exception as e:
        return {
            "status": "unavailable",
            "message": f"TigerGraph query error: {str(e)}",
            "nodes": [],
            "edges": [],
            "findings": [],
        }
