from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.bot import Bot
from app.models.document import Document
from app.models.conversation import Conversation
from app.schemas.bot import BotCreate, BotUpdate, BotResponse
from app.services.rag import delete_collection

router = APIRouter(tags=["bots"])


@router.post("/bots", response_model=BotResponse, status_code=201)
async def create_bot(data: BotCreate, db: AsyncSession = Depends(get_db)):
    bot = Bot(**data.model_dump())
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    resp = BotResponse.model_validate(bot)
    resp.document_count = 0
    resp.conversation_count = 0
    return resp


@router.get("/bots", response_model=list[BotResponse])
async def list_bots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bot).order_by(Bot.created_at.desc()))
    bots = result.scalars().all()
    responses = []
    for bot in bots:
        doc_count = (await db.execute(
            select(func.count(Document.id)).where(Document.bot_id == bot.id)
        )).scalar() or 0
        conv_count = (await db.execute(
            select(func.count(Conversation.id)).where(Conversation.bot_id == bot.id)
        )).scalar() or 0
        r = BotResponse.model_validate(bot)
        r.document_count = doc_count
        r.conversation_count = conv_count
        responses.append(r)
    return responses


@router.get("/bots/{bot_id}", response_model=BotResponse)
async def get_bot(bot_id: str, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    doc_count = (await db.execute(
        select(func.count(Document.id)).where(Document.bot_id == bot.id)
    )).scalar() or 0
    conv_count = (await db.execute(
        select(func.count(Conversation.id)).where(Conversation.bot_id == bot.id)
    )).scalar() or 0
    r = BotResponse.model_validate(bot)
    r.document_count = doc_count
    r.conversation_count = conv_count
    return r


@router.patch("/bots/{bot_id}", response_model=BotResponse)
async def update_bot(bot_id: str, data: BotUpdate, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bot, field, value)
    await db.commit()
    await db.refresh(bot)
    return BotResponse.model_validate(bot)


@router.delete("/bots/{bot_id}", status_code=204)
async def delete_bot(bot_id: str, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    delete_collection(bot_id)
    await db.delete(bot)
    await db.commit()
