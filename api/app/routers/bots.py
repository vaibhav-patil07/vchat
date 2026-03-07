from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.bot import Bot
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.user import AllowedUser
from app.schemas.bot import BotCreate, BotUpdate, BotResponse
from app.services.rag import delete_collection
from app.auth import AuthUser, require_auth

router = APIRouter(tags=["bots"], dependencies=[Depends(require_auth)])


async def _bot_response(bot: Bot, db: AsyncSession) -> BotResponse:
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


async def _check_bot_limit(user: AuthUser, db: AsyncSession):
    """Raise 400 if the user has reached their bot limit. Admin is unlimited."""
    if user.role == "admin":
        return

    owner = "guest" if user.role == "guest" else user.email

    result = await db.execute(
        select(AllowedUser).where(AllowedUser.email == owner)
    )
    entry = result.scalar_one_or_none()
    limit = entry.bot_limit if entry else 5

    bot_count = (await db.execute(
        select(func.count(Bot.id)).where(Bot.created_by == owner)
    )).scalar() or 0

    if bot_count >= limit:
        raise HTTPException(400, f"Bot limit reached ({limit})")


@router.post("/bots", response_model=BotResponse, status_code=201)
async def create_bot(
    data: BotCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth),
):
    await _check_bot_limit(user, db)

    owner = "guest" if user.role == "guest" else user.email
    bot = Bot(**data.model_dump(), created_by=owner)
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    resp = BotResponse.model_validate(bot)
    resp.document_count = 0
    resp.conversation_count = 0
    return resp


@router.get("/bots", response_model=list[BotResponse])
async def list_bots(
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth),
    owner: str | None = Query(None, description="Filter by owner email (admin only)"),
):
    query = select(Bot).order_by(Bot.created_at.desc())

    if user.role == "admin":
        if owner:
            query = query.where(Bot.created_by == owner)
    elif user.role == "guest":
        query = query.where(Bot.created_by == "guest")
    else:
        query = query.where(Bot.created_by == user.email)

    result = await db.execute(query)
    return [await _bot_response(bot, db) for bot in result.scalars().all()]


@router.get("/bots/{bot_id}", response_model=BotResponse)
async def get_bot(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth),
):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    if user.role == "user" and bot.created_by != user.email:
        raise HTTPException(403, "Access denied")
    if user.role == "guest" and bot.created_by != "guest":
        raise HTTPException(403, "Access denied")
    return await _bot_response(bot, db)


@router.patch("/bots/{bot_id}", response_model=BotResponse)
async def update_bot(
    bot_id: str,
    data: BotUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth),
):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    if user.role == "user" and bot.created_by != user.email:
        raise HTTPException(403, "Access denied")
    if user.role == "guest" and bot.created_by != "guest":
        raise HTTPException(403, "Access denied")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bot, field, value)
    await db.commit()
    await db.refresh(bot)
    return await _bot_response(bot, db)


@router.delete("/bots/{bot_id}", status_code=204)
async def delete_bot(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth),
):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    if user.role == "user" and bot.created_by != user.email:
        raise HTTPException(403, "Access denied")
    if user.role == "guest" and bot.created_by != "guest":
        raise HTTPException(403, "Access denied")
    delete_collection(bot_id)
    await db.delete(bot)
    await db.commit()
