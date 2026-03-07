from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import AuthUser, require_auth, create_guest_token
from app.database import get_db
from app.models.user import AllowedUser

router = APIRouter(tags=["auth"])


@router.get("/auth/me")
async def me(
    user: AuthUser = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    owner = "guest" if user.role == "guest" else user.email
    result = await db.execute(
        select(AllowedUser).where(AllowedUser.email == owner)
    )
    entry = result.scalar_one_or_none()
    bot_limit = None if user.role == "admin" else (entry.bot_limit if entry else 5)
    return {"email": user.email, "role": user.role, "bot_limit": bot_limit}


@router.post("/auth/guest")
async def guest_login():
    return {"token": create_guest_token(), "role": "guest"}
