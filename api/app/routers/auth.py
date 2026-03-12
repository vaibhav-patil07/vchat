import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import AuthUser, require_auth, create_guest_token
from app.config import get_settings
from app.database import get_db
from app.models.user import AllowedUser

router = APIRouter(tags=["auth"])


class AccessRequest(BaseModel):
    email: EmailStr
    description: str


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


@router.post("/auth/request-access")
async def request_access(body: AccessRequest):
    settings = get_settings()

    if not settings.smtp_host or not settings.admin_email:
        raise HTTPException(status_code=503, detail="Email service is not configured.")

    subject = f"VChat Access Request from {body.email}"
    html = f"""\
<h2>New Access Request</h2>
<p><strong>Email:</strong> {body.email}</p>
<p><strong>Description:</strong></p>
<p>{body.description}</p>
"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email or settings.smtp_user
    msg["To"] = settings.admin_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(msg["From"], settings.admin_email, msg.as_string())
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to send email. Please try again later.")

    return {"message": "Access request sent successfully."}
