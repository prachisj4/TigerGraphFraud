from tigergraph import get_tigergraph_connection, GRAPH_NAME


def main():
    conn, err = get_tigergraph_connection()
    if err or conn is None:
        print("TigerGraph connection: FAILED")
        print(f"Reason: {err or 'Connection initialization failed'}")
        return

    try:
        vertices = conn.getVerticesById("Customer", "C12382")
        found = bool(vertices and len(vertices) > 0)
        print("TigerGraph connection: SUCCESS")
        print(f"Graph: {GRAPH_NAME}")
        print(f"Customer C12382 found: {found}")
    except Exception as e:
        print("TigerGraph connection: FAILED")
        print(f"Reason: {str(e)}")


if __name__ == "__main__":
    main()