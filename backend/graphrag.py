import os
import json
from pathlib import Path
from dotenv import load_dotenv

from google import genai
from google.genai import types

from tigergraph import get_tigergraph_connection

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.8-flash"
]


def execute_graphrag_retrieval(customer_id: str = None, transaction_id: str = None, max_depth: int = 2, max_nodes: int = 25):
    """
    Performs multi-hop graph retrieval from live TigerGraph Savanna.
    Expands paths starting from Customer and/or Transaction vertices.
    Surfaces connected Cards, Devices, Billing Regions, Email Domains, and Fraud Cases.
    """
    conn, err = get_tigergraph_connection()
    if err or conn is None:
        return {
            "status": "unavailable",
            "message": err or "TigerGraph connection unavailable",
            "nodes": [],
            "edges": [],
            "paths": []
        }

    nodes = []
    edges = []
    paths = []
    added_node_ids = set()
    added_edge_keys = set()

    def add_node(n_id, n_type, label, props=None):
        n_id_str = str(n_id)
        if n_id_str not in added_node_ids and len(nodes) < max_nodes:
            added_node_ids.add(n_id_str)
            nodes.append({
                "id": n_id_str,
                "type": n_type,
                "label": label,
                "properties": props or {}
            })

    def add_edge(src, tgt, e_type, label=None):
        src_str = str(src)
        tgt_str = str(tgt)
        edge_key = (src_str, tgt_str, e_type)
        if edge_key not in added_edge_keys:
            added_edge_keys.add(edge_key)
            edges.append({
                "source": src_str,
                "target": tgt_str,
                "type": e_type,
                "label": label or e_type
            })

    # 1. Fetch Root Customer Vertex
    cust_id_str = str(customer_id).strip() if customer_id else None
    if cust_id_str:
        try:
            cust_res = conn.getVerticesById("Customer", cust_id_str)
            if cust_res:
                add_node(cust_id_str, "Customer", f"Customer {cust_id_str}", cust_res[0].get("attributes", {}))
        except Exception:
            add_node(cust_id_str, "Customer", f"Customer {cust_id_str}")

    # 2. Fetch Root Transaction Vertex
    txn_id_str = str(transaction_id).strip() if transaction_id else None
    if txn_id_str:
        try:
            txn_res = conn.getVerticesById("Transaction", txn_id_str)
            if txn_res:
                attrs = txn_res[0].get("attributes", {})
                add_node(txn_id_str, "Transaction", f"Transaction {txn_id_str}", attrs)
                if not cust_id_str and attrs.get("customer_id"):
                    cust_id_str = str(attrs.get("customer_id"))
                    add_node(cust_id_str, "Customer", f"Customer {cust_id_str}")
        except Exception:
            add_node(txn_id_str, "Transaction", f"Transaction {txn_id_str}")

    # 3. Traversal from Customer -> 1-hop & 2-hop edges
    if cust_id_str:
        try:
            c_edges = conn.getEdges("Customer", cust_id_str)
            for e in c_edges:
                e_type = e.get("e_type", "made_transaction")
                to_id = str(e.get("to_id"))
                to_type = e.get("to_type", "Transaction")

                add_node(to_id, to_type, f"{to_type} {to_id}", e.get("attributes", {}))
                add_edge(cust_id_str, to_id, e_type)
                paths.append(f"Customer({cust_id_str}) --[{e_type}]--> {to_type}({to_id})")

                # 2-hop expansion from secondary transaction or card
                if max_depth >= 2 and len(nodes) < max_nodes:
                    try:
                        sub_edges = conn.getEdges(to_type, to_id)
                        for se in sub_edges[:5]:
                            se_type = se.get("e_type", "edge")
                            s_to_id = str(se.get("to_id"))
                            s_to_type = se.get("to_type", "Entity")
                            if s_to_id != cust_id_str:
                                add_node(s_to_id, s_to_type, f"{s_to_type} {s_to_id}", se.get("attributes", {}))
                                add_edge(to_id, s_to_id, se_type)
                                paths.append(f"Customer({cust_id_str}) --[{e_type}]--> {to_type}({to_id}) --[{se_type}]--> {s_to_type}({s_to_id})")
                    except Exception:
                        pass
        except Exception:
            pass

    # 4. Traversal directly from Transaction -> connected entities (Card, DeviceProfile, BillingRegion, FraudCase)
    if txn_id_str:
        try:
            t_edges = conn.getEdges("Transaction", txn_id_str)
            for e in t_edges:
                e_type = e.get("e_type", "connected_to")
                to_id = str(e.get("to_id"))
                to_type = e.get("to_type", "Entity")

                add_node(to_id, to_type, f"{to_type} {to_id}", e.get("attributes", {}))
                add_edge(txn_id_str, to_id, e_type)
                paths.append(f"Transaction({txn_id_str}) --[{e_type}]--> {to_type}({to_id})")
        except Exception:
            pass

    return {
        "status": "completed",
        "retrieval": {
            "nodes": nodes,
            "edges": edges,
            "paths": list(dict.fromkeys(paths))[:15]
        }
    }


def format_graph_context(retrieval_data: dict) -> str:
    """
    Converts graph node and edge objects into compact textual context for LLM reasoning.
    """
    nodes = retrieval_data.get("nodes", [])
    edges = retrieval_data.get("edges", [])
    paths = retrieval_data.get("paths", [])

    if not nodes:
        return "No graph evidence found in TigerGraph Savanna for the given query."

    context_lines = [
        "RETRIEVED TIGERGRAPH GRAPH EVIDENCE:",
        f"- Total Entities (Nodes): {len(nodes)}",
        f"- Total Relationships (Edges): {len(edges)}",
        "\nKEY ENTITIES:"
    ]

    for n in nodes:
        props = n.get("properties", {})
        props_str = f" ({props})" if props else ""
        context_lines.append(f"  * {n['type']} ID: {n['id']}{props_str}")

    if paths:
        context_lines.append("\nGRAPH TRAVERSAL PATHS:")
        for p in paths:
            context_lines.append(f"  * {p}")

    return "\n".join(context_lines)


def run_graphrag_query(customer_id: str = None, transaction_id: str = None, question: str = "Analyze graph relationships for potential fraud risks.") -> dict:
    """
    Executes the full GraphRAG workflow:
    1. Live Graph Retrieval from TigerGraph Savanna
    2. Context Formatting
    3. Gemini Reasoning & Synthesis
    """
    retrieval_res = execute_graphrag_retrieval(customer_id=customer_id, transaction_id=transaction_id)
    g_status = retrieval_res.get("status", "unavailable")

    if g_status != "completed":
        return {
            "status": "unavailable",
            "question": question,
            "retrieval": retrieval_res.get("retrieval", {"nodes": [], "edges": [], "paths": []}),
            "graph_context": "TigerGraph Savanna graph context unavailable.",
            "answer": "GraphRAG reasoning unavailable because TigerGraph database could not be queried.",
            "supporting_evidence": [],
            "limitations": [retrieval_res.get("message", "TigerGraph connection failed")]
        }

    graph_context = format_graph_context(retrieval_res["retrieval"])

    # If Gemini API key is missing, return grounded graph evidence without LLM synthesis
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "status": "completed",
            "question": question,
            "retrieval": retrieval_res["retrieval"],
            "graph_context": graph_context,
            "answer": f"Retrieved {len(retrieval_res['retrieval']['nodes'])} nodes and {len(retrieval_res['retrieval']['edges'])} edges from TigerGraph Savanna. LLM synthesis skipped (GEMINI_API_KEY unconfigured).",
            "supporting_evidence": retrieval_res["retrieval"]["paths"][:5],
            "limitations": ["GEMINI_API_KEY missing in backend/.env"]
        }

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are an expert GraphRAG AI Fraud Analyst.
Analyze the following retrieved TigerGraph graph context to answer the user's question.

USER QUESTION:
{question}

{graph_context}

INSTRUCTIONS:
1. Base your answer STRICTLY on the retrieved graph evidence above.
2. Clearly distinguish:
   - Observed Graph Evidence (facts directly in graph)
   - Logical Inferences (potential risk patterns)
   - Unavailable Evidence (missing node types or unconnected attributes)
3. Return ONLY valid JSON matching this schema:
{{
  "answer": "Concise executive summary answering the question",
  "supporting_evidence": ["Evidence point 1", "Evidence point 2"],
  "limitations": ["Unknowns or unobserved relationships"]
}}
"""

    last_err = None
    for model_id in CANDIDATE_MODELS:
        try:
            response = client.models.generate_content(
                model=model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )

            raw_text = response.text or "{}"
            parsed = json.loads(raw_text)

            return {
                "status": "completed",
                "question": question,
                "retrieval": retrieval_res["retrieval"],
                "graph_context": graph_context,
                "answer": parsed.get("answer", raw_text),
                "supporting_evidence": parsed.get("supporting_evidence", []),
                "limitations": parsed.get("limitations", []),
                "model_used": model_id
            }

        except Exception as err:
            last_err = str(err)
            continue

    # Graceful fallback if Gemini API calls are rate-limited or fail
    return {
        "status": "completed",
        "question": question,
        "retrieval": retrieval_res["retrieval"],
        "graph_context": graph_context,
        "answer": f"Successfully retrieved {len(retrieval_res['retrieval']['nodes'])} graph nodes and {len(retrieval_res['retrieval']['edges'])} edges from TigerGraph Savanna. (LLM synthesis rate-limited: {last_err})",
        "supporting_evidence": retrieval_res["retrieval"]["paths"][:5],
        "limitations": [f"Gemini LLM call failed: {last_err}"]
    }
