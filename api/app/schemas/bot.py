from pydantic import BaseModel, Field
from datetime import datetime


class BotCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    system_prompt: str = "You are a helpful assistant."
    provider: str = "ollama"
    model_name: str = "llama3.2:3b"
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(1024, ge=1, le=8192)


class BotUpdate(BaseModel):
    name: str | None = None
    system_prompt: str | None = None
    provider: str | None = None
    model_name: str | None = None
    temperature: float | None = Field(None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(None, ge=1, le=8192)


class BotResponse(BaseModel):
    id: str
    name: str
    system_prompt: str
    provider: str
    model_name: str
    temperature: float
    max_tokens: int
    created_at: datetime
    document_count: int = 0
    conversation_count: int = 0

    model_config = {"from_attributes": True}
