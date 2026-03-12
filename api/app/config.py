from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    default_provider: str = "ollama"
    default_model: str = "llama3.2:3b"

    ollama_api_base: str = "http://localhost:11434"
    groq_api_key: str = ""
    together_api_key: str = ""

    embedding_provider: str = "sentence-transformers"
    embedding_model: str = "all-MiniLM-L6-v2"

    database_url: str = "sqlite+aiosqlite:///./vchat.db"
    chroma_persist_dir: str = "./chroma_data"

    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    admin_email: str = ""
    google_client_id: str = ""
    secret_key: str = "change-me-in-production"
    guest_bot_limit: int = 3

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
