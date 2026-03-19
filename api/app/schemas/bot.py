import json
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class McpServerConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1)
    headers: dict[str, str] = Field(default_factory=dict)


class ToolConfig(BaseModel):
    display_names: dict[str, str] = Field(default_factory=dict)
    hidden_tools: list[str] = Field(default_factory=list)
    custom_order: list[str] = Field(default_factory=list)


class BotCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    system_prompt: str = "You are a helpful assistant."
    provider: str = "ollama"
    model_name: str = "llama3.2:3b"
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(1024, ge=1, le=8192)
    mcp_servers: list[McpServerConfig] | None = None
    tool_config: ToolConfig | None = None


class BotUpdate(BaseModel):
    name: str | None = None
    system_prompt: str | None = None
    provider: str | None = None
    model_name: str | None = None
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=1, le=8192)
    mcp_servers: list[McpServerConfig] | None = None
    tool_config: ToolConfig | None = None


class BotResponse(BaseModel):
    id: str
    name: str
    system_prompt: str
    provider: str
    model_name: str
    temperature: float
    max_tokens: int
    mcp_servers: list[McpServerConfig] | None = None
    mcp_token: str | None = None
    tool_config: ToolConfig | None = None
    created_by: str = "admin"
    created_at: datetime
    document_count: int = 0
    conversation_count: int = 0

    @field_validator("mcp_servers", mode="before")
    @classmethod
    def _parse_mcp_servers(cls, v: object) -> list[dict] | None:
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    @field_validator("tool_config", mode="before")
    @classmethod
    def _parse_tool_config(cls, v: object) -> dict | None:
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v

    model_config = {"from_attributes": True}
