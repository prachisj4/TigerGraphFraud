import asyncio
import os

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    server = StdioServerParameters(
        command=os.path.expandvars(
            r"%APPDATA%\Python\Python313\Scripts\tigergraph-mcp.exe"
        ),
        args=["--env-file", ".env"]
    )

    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write) as session:

            await session.initialize()

            print("\nOFFICIAL TIGERGRAPH MCP CONNECTED ✅")

            # Read-only call to TigerGraph Savanna
            result = await session.call_tool(
                "tigergraph__list_graphs",
                {}
            )

            print("\nGRAPHS RETURNED THROUGH OFFICIAL MCP:")
            for item in result.content:
                if hasattr(item, "text"):
                    print(item.text)


if __name__ == "__main__":
    asyncio.run(main())