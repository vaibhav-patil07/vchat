import json
from collections.abc import AsyncGenerator
from app.services.llm_provider import chat_completion_stream
from app.services.rag import retrieve_context


def _build_messages(
    system_prompt: str,
    context_chunks: list[str],
    conversation_history: list[dict],
    user_message: str,
) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    if context_chunks:
        context_block = "\n\n---\n\n".join(context_chunks)
        messages.append({
            "role": "system",
            "content": (
                "Use the following knowledge base context to answer the user's question. "
                "If the context doesn't contain relevant information, say so and answer "
                "based on your general knowledge.\n\n"
                f"Context:\n{context_block}"
            ),
        })

    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})
    return messages


async def generate_response(
    provider: str,
    model_name: str,
    system_prompt: str,
    bot_id: str,
    user_message: str,
    conversation_history: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> AsyncGenerator[tuple[str, list[str]], None]:
    """
    Stream chat response tokens. Yields (token, context_chunks) tuples.
    context_chunks is populated only on the first yield.
    """
    context_chunks = retrieve_context(bot_id, user_message)
    messages = _build_messages(system_prompt, context_chunks, conversation_history, user_message)

    first = True
    async for token in chat_completion_stream(
        provider=provider,
        model_name=model_name,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    ):
        if first:
            yield token, context_chunks
            first = True
        yield token, []

    if first:
        yield "", context_chunks
