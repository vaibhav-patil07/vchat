import json
import logging
from dataclasses import dataclass, field

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

logger = logging.getLogger(__name__)

TOKEN_HEADER = "X-VChat-Bot-Token"


@dataclass
class McpTool:
    name: str
    description: str
    parameters: dict
    server_url: str


@dataclass
class McpToolkit:
    tools: list[McpTool] = field(default_factory=list)

    def to_litellm_tools(self) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.parameters,
                },
            }
            for tool in self.tools
        ]

    def find_server_url(self, tool_name: str) -> str | None:
        for tool in self.tools:
            if tool.name == tool_name:
                return tool.server_url
        return None


def _build_headers(mcp_token: str | None, extra_headers: dict[str, str] | None = None) -> dict[str, str]:
    headers: dict[str, str] = {}
    if mcp_token:
        headers[TOKEN_HEADER] = mcp_token
    if extra_headers:
        headers.update(extra_headers)
    return headers


async def discover_tools(
    mcp_servers: list[dict],
    mcp_token: str | None,
) -> McpToolkit:
    """Connect to each MCP server and discover available tools."""
    toolkit = McpToolkit()

    for server_cfg in mcp_servers:
        name = server_cfg.get("name", "unknown")
        url = server_cfg.get("url", "")
        extra_headers = server_cfg.get("headers", {})

        if not url:
            logger.warning("Skipping MCP server '%s' with empty URL", name)
            continue

        headers = _build_headers(mcp_token, extra_headers)

        try:
            async with streamablehttp_client(url, headers=headers) as (read_stream, write_stream, _):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    tools_result = await session.list_tools()

                    for tool in tools_result.tools:
                        mcp_tool = McpTool(
                            name=tool.name,
                            description=tool.description or "",
                            parameters=tool.inputSchema or {},
                            server_url=url,
                        )
                        toolkit.tools.append(mcp_tool)

        except Exception as e:
            logger.warning("Failed to discover tools from MCP server '%s' at %s", name, url, exc_info=True)
            continue

    return toolkit


async def discover_tools_with_status(
    mcp_servers: list[dict],
    mcp_token: str | None,
) -> tuple[McpToolkit, list[dict]]:
    """
    Connect to each MCP server and return both tools and per-server status.
    Returns (toolkit, server_statuses) where server_statuses contains detailed info per server.
    """
    toolkit = McpToolkit()
    server_statuses = []

    for server_cfg in mcp_servers:
        name = server_cfg.get("name", "unknown")
        url = server_cfg.get("url", "")
        extra_headers = server_cfg.get("headers", {})

        status = {
            "name": name,
            "url": url,
            "status": "error",
            "error": None,
            "tools": []
        }

        if not url:
            logger.warning("Skipping MCP server '%s' with empty URL", name)
            status["error"] = "Empty URL"
            server_statuses.append(status)
            continue

        headers = _build_headers(mcp_token, extra_headers)

        try:
            async with streamablehttp_client(url, headers=headers) as (read_stream, write_stream, _):
                async with ClientSession(read_stream, write_stream) as session:
                    await session.initialize()
                    tools_result = await session.list_tools()

                    server_tools = []
                    for tool in tools_result.tools:
                        mcp_tool = McpTool(
                            name=tool.name,
                            description=tool.description or "",
                            parameters=tool.inputSchema or {},
                            server_url=url,
                        )
                        toolkit.tools.append(mcp_tool)
                        
                        # Add to server status
                        server_tools.append({
                            "name": tool.name,
                            "description": tool.description or ""
                        })

                    status["status"] = "success"
                    status["tools"] = server_tools

        except Exception as e:
            logger.warning("Failed to discover tools from MCP server '%s' at %s", name, url, exc_info=True)
            status["status"] = "error"
            status["error"] = str(e)

        server_statuses.append(status)

    return toolkit, server_statuses


async def execute_tool_call(
    server_url: str,
    mcp_token: str | None,
    tool_name: str,
    arguments: dict,
    extra_headers: dict[str, str] | None = None,
) -> str:
    """Execute a single tool call against the MCP server that owns it."""
    headers = _build_headers(mcp_token, extra_headers)

    try:
        async with streamablehttp_client(server_url, headers=headers) as (
            read_stream,
            write_stream,
            _,
        ):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments=arguments)

                parts = []
                for content in result.content:
                    if hasattr(content, "text"):
                        parts.append(content.text)
                    else:
                        parts.append(str(content))
                return "\n".join(parts) if parts else ""
    except Exception as e:
        logger.error("MCP tool call '%s' failed: %s", tool_name, e, exc_info=True)
        return json.dumps({"error": f"Tool call failed: {e}"})