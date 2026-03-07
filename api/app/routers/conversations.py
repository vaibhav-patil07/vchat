from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.bot import Bot
from app.models.conversation import Conversation, Message
from app.schemas.chat import ConversationResponse, ConversationListItem, MessageResponse
from app.auth import require_auth

router = APIRouter(tags=["conversations"], dependencies=[Depends(require_auth)])


@router.get("/bots/{bot_id}/conversations", response_model=list[ConversationListItem])
async def list_conversations(bot_id: str, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    result = await db.execute(
        select(Conversation)
        .where(Conversation.bot_id == bot_id)
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().all()
    items = []
    for conv in conversations:
        msg_count = (await db.execute(
            select(func.count(Message.id)).where(Message.conversation_id == conv.id)
        )).scalar() or 0
        item = ConversationListItem.model_validate(conv)
        item.message_count = msg_count
        items.append(item)
    return items


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(404, "Conversation not found")
    await db.refresh(conversation, ["messages"])
    return ConversationResponse(
        id=conversation.id,
        bot_id=conversation.bot_id,
        title=conversation.title,
        created_at=conversation.created_at,
        messages=[MessageResponse.model_validate(m) for m in conversation.messages],
    )
