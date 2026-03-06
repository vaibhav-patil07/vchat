from pydantic import BaseModel, Field
from datetime import datetime


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: str | None = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    context_chunks: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    bot_id: str
    title: str
    created_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ConversationListItem(BaseModel):
    id: str
    bot_id: str
    title: str
    created_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}
