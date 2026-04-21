# backend/app/core/config.py
from pathlib import Path
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8")

    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"


settings = Settings()
