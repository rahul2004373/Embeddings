import os
from typing import List


class Settings:
    MODEL_NAME: str = os.getenv("MODEL_NAME", "BAAI/bge-small-en-v1.5")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_CONTENT_LENGTH", "8192"))
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "32"))
    NORMALIZE_EMBEDDINGS: bool = os.getenv("NORMALIZE_EMBEDDINGS", "true").lower() == "true"


settings = Settings()
