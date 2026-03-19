import os
import json
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Callable, Awaitable
from litellm import acompletion
from app.config import get_settings


@dataclass
class StreamEvent:
    type: str
    content: str = ""
    tool_name: str = ""
    arguments: dict = None
    result: str = ""


# Type alias for tool executor function
ToolExecutor = Callable[[str, dict], Awaitable[str]]


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


async def chat_completion_stream_with_tools(
    provider: str,
    model_name: str,
    messages: list[dict],
    tools: list[dict],
    tool_executor: ToolExecutor,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    max_iterations: int = 10,
) -> AsyncGenerator[StreamEvent, None]:
    """
    Stream chat completion with tool calling support.
    This function handles the agentic loop of LLM -> tool calls -> LLM -> response.
    """
    _configure_env(provider)
    model = _build_model_string(provider, model_name)
    
    working_messages = list(messages)
    tools_used = False
    
    for iteration in range(max_iterations):
        print(f"DEBUG: Iteration {iteration}, tools_used: {tools_used}")
        # Only provide tools on the first iteration or if no tools have been used yet
        current_tools = tools if not tools_used else None
        print(f"DEBUG: Current tools: {len(current_tools) if current_tools else 0}")
        
        kwargs: dict = dict(
            model=model,
            messages=working_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        if current_tools:
            kwargs["tools"] = current_tools
            kwargs["tool_choice"] = "auto"
        if provider == "ollama":
            kwargs["api_base"] = get_settings().ollama_api_base
        
        response = await acompletion(**kwargs)
        choice = response.choices[0]
        assistant_msg = choice.message
        
        print(f"DEBUG: LLM response has tool_calls: {bool(assistant_msg.tool_calls)}")
        print(f"DEBUG: LLM response content: {assistant_msg.content[:100] if assistant_msg.content else 'None'}")
        
        # If no tool calls, this is the final response - stream it directly
        if not assistant_msg.tool_calls:
            # If the response has content, yield it in chunks for streaming effect
            if assistant_msg.content:
                content = assistant_msg.content
                # Stream in word chunks for better UX
                words = content.split(' ')
                for i, word in enumerate(words):
                    if i == 0:
                        yield StreamEvent(type="token", content=word)
                    else:
                        yield StreamEvent(type="token", content=' ' + word)
            return
        
        # Process tool calls
        working_messages.append(assistant_msg.model_dump())
        tools_used = True  # Mark that tools have been used
        
        for tool_call in assistant_msg.tool_calls:
            tool_name = tool_call.function.name
            try:
                arguments = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                arguments = {}
            
            # Emit tool call event
            yield StreamEvent(
                type="tool_call",
                tool_name=tool_name,
                arguments=arguments
            )
            
            # Execute the tool
            try:
                result_content = await tool_executor(tool_name, arguments)
            except Exception as e:
                result_content = json.dumps({"error": str(e)})
            
            # Emit tool result event
            yield StreamEvent(
                type="tool_result",
                tool_name=tool_name,
                result=result_content
            )
            
            # Add tool result to conversation
            working_messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result_content,
            })
        
        # Continue the loop to let LLM respond with the tool results
        # The next iteration will call the LLM again with the tool results included
        print(f"DEBUG: Finished processing {len(assistant_msg.tool_calls)} tool calls, continuing loop")
    
    # If we've hit max iterations, stream a final response anyway
    final_kwargs = dict(
        model=model,
        messages=working_messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    if provider == "ollama":
        final_kwargs["api_base"] = get_settings().ollama_api_base
    
    stream_response = await acompletion(**final_kwargs)
    async for chunk in stream_response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield StreamEvent(type="token", content=delta.content)
