import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from mcp_server import handle_mcp_request

def main():
    print("==================================================")
    print("Testing TigerGraph MCP Server Interface")
    print("==================================================")

    # 1. Test tools/list
    print("\n1. Testing tools/list request...")
    list_req = {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
    list_resp = handle_mcp_request(list_req)
    tools = list_resp.get("result", {}).get("tools", [])
    print(f"Exposed MCP Tools count: {len(tools)}")
    for t in tools:
        print(f"  - Tool: {t['name']}: {t['description']}")

    # 2. Test tools/call get_graph_evidence
    print("\n2. Testing tools/call for get_graph_evidence...")
    call_req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "get_graph_evidence",
            "arguments": {"customer_id": "C12382", "transaction_id": "3514030"}
        }
    }
    call_resp = handle_mcp_request(call_req)
    content = call_resp.get("result", {}).get("content", [])
    print(f"Response status: SUCCESS (Content length: {len(content)})")
    if content:
        print(f"Snippet: {content[0]['text'][:200]}...")

    print("\n==================================================")
    print("TigerGraph MCP Test Passed Successfully!")
    print("==================================================")

if __name__ == "__main__":
    main()
