from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import AllowedUser
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
