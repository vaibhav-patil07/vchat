import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.config import AppConfig
from app.models.user import AllowedUser
from app.schemas.config import (
    BOT_MODELS_CONFIG_KEY,
    DEFAULT_MODEL_PROVIDERS,
    BotModelsConfig,
)
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.auth import AuthUser, require_auth

router = APIRouter(tags=["admin"])


def _require_admin(user: AuthUser = Depends(require_auth)) -> AuthUser:
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user


@router.get("/admin/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: AuthUser = Depends(_require_admin),
):
    result = await db.execute(
        select(AllowedUser).order_by(AllowedUser.created_at.asc())
    )
    return [UserResponse.model_validate(u) for u in result.scalars().all()]


@router.post("/admin/users", response_model=UserResponse, status_code=201)
async def add_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: AuthUser = Depends(_require_admin),
):
    email = data.email.strip().lower()
    existing = await db.execute(
        select(AllowedUser).where(AllowedUser.email == email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "User already exists")

    user = AllowedUser(email=email, bot_limit=data.bot_limit)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: AuthUser = Depends(_require_admin),
):
    user = await db.get(AllowedUser, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.bot_limit = data.bot_limit
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/admin/users/{user_id}", status_code=204)
async def remove_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: AuthUser = Depends(_require_admin),
):
    user = await db.get(AllowedUser, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.email == "guest":
        raise HTTPException(400, "Cannot delete the Guest user")
    await db.delete(user)
    await db.commit()


@router.get("/models", response_model=BotModelsConfig)
async def get_bot_models(
    db: AsyncSession = Depends(get_db),
    _: AuthUser = Depends(require_auth),
):
    config = await db.get(AppConfig, BOT_MODELS_CONFIG_KEY)
    if not config:
        return BotModelsConfig(providers=DEFAULT_MODEL_PROVIDERS)
    try:
        providers = json.loads(config.value)
        return BotModelsConfig(providers=providers)
    except (json.JSONDecodeError, TypeError, ValueError):
        return BotModelsConfig(providers=DEFAULT_MODEL_PROVIDERS)


@router.put("/admin/models", response_model=BotModelsConfig)
async def update_bot_models(
    data: BotModelsConfig,
    db: AsyncSession = Depends(get_db),
    _: AuthUser = Depends(_require_admin),
):
    serialized = json.dumps([p.model_dump() for p in data.providers])
    config = await db.get(AppConfig, BOT_MODELS_CONFIG_KEY)
    if config:
        config.value = serialized
    else:
        config = AppConfig(key=BOT_MODELS_CONFIG_KEY, value=serialized)
        db.add(config)
    await db.commit()
    return data
