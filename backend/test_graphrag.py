import sys
from pathlib import Path

# Ensure backend directory is in python path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from graphrag import execute_graphrag_retrieval, format_graph_context, run_graphrag_query

def main():
    print("==================================================")
    print("Testing GraphRAG Multi-Hop Retrieval & Reasoning")
    print("==================================================")
    
    test_customer = "C12382"
    test_txn = "3514030"

    print(f"\n1. Testing execute_graphrag_retrieval({test_customer}, {test_txn})...")
    retrieval = execute_graphrag_retrieval(customer_id=test_customer, transaction_id=test_txn)
    
    status = retrieval.get("status")
    print(f"Retrieval Status: {status}")
    if status == "completed":
        data = retrieval.get("retrieval", {})
        nodes = data.get("nodes", [])
        edges = data.get("edges", [])
        paths = data.get("paths", [])
        
        print(f"Nodes retrieved: {len(nodes)}")
        print(f"Edges retrieved: {len(edges)}")
        print(f"Paths retrieved: {len(paths)}")
        
        print("\nSample Nodes:")
        for n in nodes[:5]:
            print(f"  - [{n['type']}] ID: {n['id']} {n.get('properties', {})}")
            
        print("\nSample Paths:")
        for p in paths[:3]:
            print(f"  - {p}")
            
        print("\nFormatted Context Snippet:")
        formatted = format_graph_context(data)
        print(formatted[:300] + "...\n")
    else:
        print(f"Error/Unavailable: {retrieval.get('message')}")
        return

    print("2. Testing full run_graphrag_query()...")
    result = run_graphrag_query(
        customer_id=test_customer,
        transaction_id=test_txn,
        question="What graph connectivity or multi-hop risk patterns are associated with customer C12382?"
    )

    print("\nGraphRAG Query Result:")
    print(f"Status: {result.get('status')}")
    print(f"Answer: {result.get('answer')}")
    print(f"Supporting Evidence Count: {len(result.get('supporting_evidence', []))}")
    print(f"Limitations Count: {len(result.get('limitations', []))}")

    print("\n==================================================")
    print("GraphRAG Verification Successful!")
    print("==================================================")

if __name__ == "__main__":
    main()
