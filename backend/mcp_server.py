"""
TigerGraph Model Context Protocol (MCP) Server Implementation.
Exposes TigerGraph Savanna graph retrieval tools via MCP JSON-RPC protocol interfaces.
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from tigergraph import get_graph_evidence, test_connection
from graphrag import execute_graphrag_retrieval

# MCP Tool Definitions Schema
MCP_TOOLS = [
    {
        "name": "get_graph_evidence",
        "description": "Fetch 1-hop and 2-hop graph evidence for a specific customer and transaction from TigerGraph Savanna.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Customer ID (e.g., C12382)"},
                "transaction_id": {"type": "string", "description": "Flagged Transaction ID (e.g., 3514030)"}
            },
            "required": ["customer_id", "transaction_id"]
        }
    },
    {
        "name": "execute_graphrag_retrieval",
        "description": "Perform multi-hop graph retrieval expanding connected paths, devices, cards, regions, and fraud cases.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Customer ID"},
                "transaction_id": {"type": "string", "description": "Transaction ID"},
                "max_depth": {"type": "integer", "default": 2},
                "max_nodes": {"type": "integer", "default": 25}
            }
        }
    }
]


def handle_mcp_request(request: dict) -> dict:
    """
    Handles incoming JSON-RPC MCP requests.
    """
    req_id = request.get("id", 1)
    method = request.get("method")
    params = request.get("params", {})

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": MCP_TOOLS}
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        if tool_name == "get_graph_evidence":
            res = get_graph_evidence(
                customer_id=arguments.get("customer_id", ""),
                transaction_id=arguments.get("transaction_id", "")
            )
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": json.dumps(res)}]}
            }

        elif tool_name == "execute_graphrag_retrieval":
            res = execute_graphrag_retrieval(
                customer_id=arguments.get("customer_id"),
                transaction_id=arguments.get("transaction_id"),
                max_depth=arguments.get("max_depth", 2),
                max_nodes=arguments.get("max_nodes", 25)
            )
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": json.dumps(res)}]}
            }
        else:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Tool '{tool_name}' not found."}
            }

    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method '{method}' not supported."}
        }
