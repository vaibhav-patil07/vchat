from pydantic import BaseModel, Field
from datetime import datetime


class UserCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    bot_limit: int = Field(5, ge=1, le=100)


class UserUpdate(BaseModel):
    bot_limit: int = Field(..., ge=1, le=100)


class UserResponse(BaseModel):
    id: str
    email: str
    bot_limit: int
    created_at: datetime

    model_config = {"from_attributes": True}
