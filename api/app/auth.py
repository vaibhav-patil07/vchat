from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.database import get_db

_bearer = HTTPBearer()


@dataclass
class AuthUser:
    email: str
    role: str  # "admin" | "user" | "guest"


def create_guest_token() -> str:
    settings = get_settings()
    return jwt.encode({"role": "guest"}, settings.secret_key, algorithm="HS256")


def _verify_guest_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, get_settings().secret_key, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> AuthUser:
    from app.models.user import AllowedUser

    settings = get_settings()
    token = credentials.credentials

    if settings.google_client_id:
        try:
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), settings.google_client_id,
            )
            email = idinfo.get("email", "")

            if settings.admin_email and email.lower() == settings.admin_email.lower():
                return AuthUser(email=email, role="admin")

            result = await db.execute(
                select(AllowedUser).where(AllowedUser.email == email.lower())
            )
            if result.scalar_one_or_none():
                return AuthUser(email=email, role="user")

            raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")
        except ValueError:
            pass

    payload = _verify_guest_token(token)
    if payload and payload.get("role") == "guest":
        return AuthUser(email="guest", role="guest")

    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
