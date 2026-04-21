# backend/app/core/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    class Config:
        env_file = ".env"


settings = Settings()
