import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.bot import Bot
from app.models.conversation import Conversation, Message
from app.schemas.chat import ChatRequest
from app.services.llm_provider import chat_completion_stream, chat_completion_stream_with_tools
from app.services.rag import retrieve_context

router = APIRouter(tags=["chat"])


@router.post("/bots/{bot_id}/chat")
async def chat(bot_id: str, data: ChatRequest, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(404, "Bot not found")

    if data.conversation_id:
        conversation = await db.get(Conversation, data.conversation_id)
        if not conversation or conversation.bot_id != bot_id:
            raise HTTPException(404, "Conversation not found")
    else:
        title = data.message[:80] if len(data.message) > 0 else "New Conversation"
        conversation = Conversation(bot_id=bot_id, title=title)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=data.message,
    )
    db.add(user_msg)
    await db.commit()

    await db.refresh(conversation, ["messages"])
    history = [
        {"role": m.role, "content": m.content}
        for m in conversation.messages[:-1]  # exclude the message we just added
    ]

    context_chunks = retrieve_context(bot_id, data.message)

    # Check if bot has MCP servers configured for tool calling
    mcp_servers = None
    if bot.mcp_servers:
        try:
            from app.schemas.bot import McpServerConfig
            mcp_servers = [McpServerConfig(**s) for s in json.loads(bot.mcp_servers)]
        except (json.JSONDecodeError, TypeError):
            mcp_servers = None

    # Enhanced system prompt when tools are available
    system_prompt = bot.system_prompt
    if mcp_servers:
        system_prompt += "\n\nYou have access to tools that can help users. When using tools:\n\n1. Be conversational and natural - ask for required information in a friendly way\n2. Use tools when appropriate - don't just describe what they do\n3. If you need parameters for a tool, ask for them naturally in context\n4. Execute tools as soon as you have the required information\n5. After using a tool, explain what happened based on the result\n6. Be helpful and proactive in offering to use tools when they can solve user problems"
    
    messages_for_llm: list[dict] = [{"role": "system", "content": system_prompt}]
    if context_chunks:
        context_block = "\n\n---\n\n".join(context_chunks)
        messages_for_llm.append({
            "role": "system",
            "content": (
                "Use the following knowledge base context to answer the user's question. "
                "If the context doesn't contain relevant information, say so and answer "
                "based on your general knowledge.\n\nContext:\n" + context_block
            ),
        })
    messages_for_llm.extend(history)
    messages_for_llm.append({"role": "user", "content": data.message})

    async def event_stream():
        full_response = []
        conv_id_sent = False
        try:
            # Use tool-enabled streaming if MCP servers are configured
            if mcp_servers:
                from app.services.mcp_client import discover_tools, execute_tool_call
                
                # Discover available tools
                server_configs = [s.model_dump() for s in mcp_servers]
                toolkit = await discover_tools(server_configs, bot.mcp_token)
                
                
                if toolkit.tools:
                    # Create tool executor function
                    async def tool_executor(tool_name: str, arguments: dict) -> str:
                        server_url = toolkit.find_server_url(tool_name)
                        if not server_url:
                            return json.dumps({"error": f"Tool '{tool_name}' not found"})
                        
                        return await execute_tool_call(
                            server_url=server_url,
                            mcp_token=bot.mcp_token,
                            tool_name=tool_name,
                            arguments=arguments
                        )
                    
                    # Use tool-enabled streaming
                    async for event in chat_completion_stream_with_tools(
                        provider=bot.provider,
                        model_name=bot.model_name,
                        messages=messages_for_llm,
                        temperature=bot.temperature,
                        max_tokens=bot.max_tokens,
                        tools=toolkit.to_litellm_tools(),
                        tool_executor=tool_executor,
                    ):
                        if event.type == "token":
                            full_response.append(event.content)
                            payload: dict = {"token": event.content}
                            if not conv_id_sent:
                                payload["conversation_id"] = conversation.id
                                payload["context_chunks"] = context_chunks
                                conv_id_sent = True
                            yield f"data: {json.dumps(payload)}\n\n"
                        elif event.type == "tool_call":
                            payload = {
                                "tool_call": {
                                    "name": event.tool_name,
                                    "arguments": event.arguments
                                }
                            }
                            if not conv_id_sent:
                                payload["conversation_id"] = conversation.id
                                payload["context_chunks"] = context_chunks
                                conv_id_sent = True
                            yield f"data: {json.dumps(payload)}\n\n"
                        elif event.type == "tool_result":
                            payload = {
                                "tool_result": {
                                    "name": event.tool_name,
                                    "result": event.result
                                }
                            }
                            yield f"data: {json.dumps(payload)}\n\n"
                    return
            
            # Fall back to regular streaming if no tools
            async for token in chat_completion_stream(
                provider=bot.provider,
                model_name=bot.model_name,
                messages=messages_for_llm,
                temperature=bot.temperature,
                max_tokens=bot.max_tokens,
            ):
                full_response.append(token)
                payload: dict = {"token": token}
                if not conv_id_sent:
                    payload["conversation_id"] = conversation.id
                    payload["context_chunks"] = context_chunks
                    conv_id_sent = True
                yield f"data: {json.dumps(payload)}\n\n"
        except Exception as e:
            err_msg = str(e)
            if "Connection" in err_msg or "refused" in err_msg or "connect" in err_msg.lower():
                err_msg = f"Cannot connect to LLM provider '{bot.provider}'. Is it running? Original error: {err_msg}"
            elif "AuthenticationError" in err_msg or "API key" in err_msg.lower():
                err_msg = f"Invalid API key for provider '{bot.provider}'. Check your .env file."
            yield f"data: {json.dumps({'error': err_msg})}\n\n"

        complete_text = "".join(full_response)
        if complete_text:
            assistant_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=complete_text,
                context_chunks=json.dumps(context_chunks) if context_chunks else None,
            )
            db.add(assistant_msg)
            await db.commit()

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
