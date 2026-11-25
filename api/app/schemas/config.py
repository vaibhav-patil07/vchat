from pydantic import BaseModel, Field, field_validator


DEFAULT_MODEL_PROVIDERS = [
    {
        "value": "ollama",
        "label": "Ollama (Local)",
        "models": ["llama3.2:3b", "llama3.2:1b", "phi3.5", "gemma2:2b", "mistral"],
        "upcoming": True,
    },
    {
        "value": "groq",
        "label": "Groq (Cloud)",
        "models": ["openai/gpt-oss-120b"],
        "upcoming": False,
    },
    {
        "value": "together",
        "label": "Together AI (Cloud)",
        "models": [
            "meta-llama/Llama-3.2-3B-Instruct-Turbo",
            "Qwen/Qwen2.5-7B-Instruct-Turbo",
        ],
        "upcoming": True,
    },
]

BOT_MODELS_CONFIG_KEY = "bot_models"


class ProviderModelConfig(BaseModel):
    value: str = Field(..., min_length=1, max_length=50)
    label: str = Field(..., min_length=1, max_length=100)
    models: list[str] = Field(default_factory=list)
    upcoming: bool = False

    @field_validator("value", "label")
    @classmethod
    def _strip_text(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Value cannot be empty")
        return stripped

    @field_validator("models")
    @classmethod
    def _clean_models(cls, v: list[str]) -> list[str]:
        seen: set[str] = set()
        cleaned: list[str] = []
        for item in v:
            m = item.strip()
            if m and m not in seen:
                seen.add(m)
                cleaned.append(m)
        return cleaned


class BotModelsConfig(BaseModel):
    providers: list[ProviderModelConfig] = Field(..., min_length=1)

    @field_validator("providers")
    @classmethod
    def _validate_providers(cls, v: list[ProviderModelConfig]) -> list[ProviderModelConfig]:
        seen: set[str] = set()
        for p in v:
            if p.value in seen:
                raise ValueError(f"Duplicate provider '{p.value}'")
            seen.add(p.value)
            if not p.upcoming and not p.models:
                raise ValueError(f"Enabled provider '{p.label}' must have at least one model")
        return v
