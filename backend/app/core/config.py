from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    app_name: str = "Plexe ML Model Service"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    models_storage_path: str = "./storage/models"
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    allowed_extensions: list[str] = [".pkl", ".joblib"]
    
    # AI Provider Configuration (litellm format)
    default_ai_provider: str = "openai/gpt-4o-mini"
    fallback_ai_provider: Optional[str] = "anthropic/claude-3-haiku-20240307"
    
    # Provider API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    ollama_base_url: Optional[str] = "http://localhost:11434"
    
    # AI Model Configuration
    ai_max_tokens: int = 4096
    ai_temperature: float = 0.1
    ai_timeout: int = 30
    
    # WebSocket Configuration
    websocket_timeout: int = 30
    websocket_max_connections: int = 100
    websocket_ping_interval: int = 30
    
    # Chat Configuration
    chat_context_window: int = 50
    chat_max_history: int = 1000
    chat_rate_limit: int = 60  # messages per minute
    
    class Config:
        env_file = ".env"


# Create storage directory if it doesn't exist
settings = Settings()
os.makedirs(settings.models_storage_path, exist_ok=True) 