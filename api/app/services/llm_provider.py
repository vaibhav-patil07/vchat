import os
from collections.abc import AsyncGenerator
from litellm import acompletion
from app.config import get_settings


def _configure_env(provider: str):
    """Set environment variables LiteLLM needs for the given provider."""
    settings = get_settings()
    if provider == "groq" and settings.groq_api_key:
        os.environ["GROQ_API_KEY"] = settings.groq_api_key
    elif provider == "together" and settings.together_api_key:
        os.environ.setdefault("TOGETHER_AI_API_KEY", settings.together_api_key)


def _build_model_string(provider: str, model_name: str) -> str:
    """Map provider + model_name into a LiteLLM model identifier."""
    if provider == "ollama":
        return f"ollama/{model_name}"
    if provider == "groq":
        return f"groq/{model_name}"
    if provider == "together":
        return f"together_ai/{model_name}"
    return model_name


async def chat_completion(
    provider: str,
    model_name: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    _configure_env(provider)
    model = _build_model_string(provider, model_name)
    kwargs: dict = dict(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if provider == "ollama":
        kwargs["api_base"] = get_settings().ollama_api_base
    response = await acompletion(**kwargs)
    return response.choices[0].message.content


async def chat_completion_stream(
    provider: str,
    model_name: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> AsyncGenerator[str, None]:
    _configure_env(provider)
    model = _build_model_string(provider, model_name)
    kwargs: dict = dict(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    if provider == "ollama":
        kwargs["api_base"] = get_settings().ollama_api_base
    response = await acompletion(**kwargs)
    async for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
