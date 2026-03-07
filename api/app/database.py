from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(get_settings().database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def init_db():
    from app.models import bot, conversation, document, user  # noqa: F401
    from app.models.user import AllowedUser

    settings = get_settings()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        for migration in [
            "ALTER TABLE bots ADD COLUMN created_by VARCHAR(50) DEFAULT 'admin'",
            "ALTER TABLE allowed_users ADD COLUMN bot_limit INTEGER DEFAULT 5",
        ]:
            try:
                await conn.execute(text(migration))
            except Exception:
                pass

    async with async_session() as session:
        from sqlalchemy import select

        result = await session.execute(
            select(AllowedUser).where(AllowedUser.email == "guest")
        )
        if not result.scalar_one_or_none():
            session.add(AllowedUser(
                email="guest",
                bot_limit=settings.guest_bot_limit,
            ))
            await session.commit()
