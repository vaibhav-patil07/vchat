import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.bot import Bot
from app.models.conversation import Conversation, Message
from app.schemas.chat import ChatRequest
from app.services.llm_provider import chat_completion_stream
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

    messages_for_llm: list[dict] = [{"role": "system", "content": bot.system_prompt}]
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
