import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.bot import Bot
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.user import AllowedUser
from app.schemas.bot import BotCreate, BotUpdate, BotResponse, McpServerConfig, ToolConfig
from app.services.rag import delete_collection
from app.auth import AuthUser, require_auth

router = APIRouter(tags=["bots"], dependencies=[Depends(require_auth)])


def _deserialize_mcp_servers(raw: str | None) -> list[McpServerConfig] | None:
    if not raw:
        return None
    try:
        return [McpServerConfig(**s) for s in json.loads(raw)]
    except (json.JSONDecodeError, TypeError):
        return None


def _serialize_mcp_servers(servers: list[McpServerConfig] | None) -> str | None:
    if not servers:
        return None
    return json.dumps([s.model_dump() for s in servers])


def _deserialize_tool_config(raw: str | None) -> ToolConfig | None:
    if not raw:
        return None
    try:
        return ToolConfig(**json.loads(raw))
    except (json.JSONDecodeError, TypeError):
        return None


def _serialize_tool_config(config: ToolConfig | None) -> str | None:
    if not config:
        return None
    return json.dumps(config.model_dump())


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
    bot_data = data.model_dump()
    
    # Serialize MCP data
    if bot_data.get('mcp_servers'):
        bot_data['mcp_servers'] = _serialize_mcp_servers(data.mcp_servers)
    if bot_data.get('tool_config'):
        bot_data['tool_config'] = _serialize_tool_config(data.tool_config)
    
    bot = Bot(**bot_data, created_by=owner)
    db.add(bot)
    await db.commit()
    await db.refresh(bot)
    return await _bot_response(bot, db)


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
    update_data = data.model_dump(exclude_unset=True)
    
    # Serialize MCP data if present
    if 'mcp_servers' in update_data and update_data['mcp_servers'] is not None:
        update_data['mcp_servers'] = _serialize_mcp_servers(data.mcp_servers)
    if 'tool_config' in update_data and update_data['tool_config'] is not None:
        update_data['tool_config'] = _serialize_tool_config(data.tool_config)
    
    for field, value in update_data.items():
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


@router.post("/bots/{bot_id}/regenerate-token", response_model=BotResponse)
async def regenerate_bot_token(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth),
):
    """Regenerate the MCP token for a bot."""
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    if user.role == "user" and bot.created_by != user.email:
        raise HTTPException(403, "Access denied")
    if user.role == "guest" and bot.created_by != "guest":
        raise HTTPException(403, "Access denied")
    
    import uuid
    bot.mcp_token = str(uuid.uuid4())
    await db.commit()
    await db.refresh(bot)
    return await _bot_response(bot, db)


@router.post("/bots/{bot_id}/test-mcp")
async def test_mcp_connection(
    bot_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthUser = Depends(require_auth),
):
    """Test MCP server connections and discover tools."""
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    if user.role == "user" and bot.created_by != user.email:
        raise HTTPException(403, "Access denied")
    if user.role == "guest" and bot.created_by != "guest":
        raise HTTPException(403, "Access denied")
    
    from app.schemas.bot import McpServerConfig
    import json
    
    def _deserialize_mcp_servers(raw: str | None) -> list[McpServerConfig] | None:
        if not raw:
            return None
        try:
            return [McpServerConfig(**s) for s in json.loads(raw)]
        except (json.JSONDecodeError, TypeError):
            return None
    
    mcp_servers = _deserialize_mcp_servers(bot.mcp_servers)
    if not mcp_servers:
        return {"servers": []}
    
    try:
        from app.services.mcp_client import discover_tools_with_status
        server_configs = [s.model_dump() for s in mcp_servers]
        toolkit, server_statuses = await discover_tools_with_status(server_configs, bot.mcp_token)
        
        return {"servers": server_statuses}
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error("Failed to test MCP connections: %s", e, exc_info=True)
        raise HTTPException(500, f"MCP test failed: {str(e)}")


# Public router for unauthenticated endpoints
public_router = APIRouter(tags=["bots"])


@public_router.get("/bots/{bot_id}/tools")
async def get_bot_tools(bot_id: str, db: AsyncSession = Depends(get_db)):
    """Get available tools for a bot (public endpoint for SDK)."""
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")
    
    from app.schemas.bot import McpServerConfig, ToolConfig
    import json
    
    def _deserialize_mcp_servers(raw: str | None) -> list[McpServerConfig] | None:
        if not raw:
            return None
        try:
            return [McpServerConfig(**s) for s in json.loads(raw)]
        except (json.JSONDecodeError, TypeError):
            return None
    
    def _deserialize_tool_config(raw: str | None) -> ToolConfig | None:
        if not raw:
            return None
        try:
            return ToolConfig(**json.loads(raw))
        except (json.JSONDecodeError, TypeError):
            return None
    
    mcp_servers = _deserialize_mcp_servers(bot.mcp_servers)
    if not mcp_servers:
        return {"tools": [], "tool_config": None}
    
    try:
        from app.services.mcp_client import discover_tools
        server_configs = [s.model_dump() for s in mcp_servers]
        toolkit = await discover_tools(server_configs, bot.mcp_token)
        
        tools = [
            {
                "name": tool.name,
                "description": tool.description,
                "server_url": tool.server_url,
                "parameters": tool.parameters
            }
            for tool in toolkit.tools
        ]
        
        tool_config = _deserialize_tool_config(bot.tool_config)
        
        return {
            "tools": tools,
            "tool_config": tool_config.model_dump() if tool_config else None
        }
        
    except Exception:
        return {"tools": [], "tool_config": None}
