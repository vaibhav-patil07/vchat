from pydantic import BaseModel
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    bot_id: str
    filename: str
    content_type: str
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
