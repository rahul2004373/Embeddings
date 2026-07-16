from pydantic import BaseModel, Field, field_validator
from typing import List


class EmbedRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=8192)

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("content must not be empty or whitespace-only")
        return v


class EmbedResponse(BaseModel):
    embedding: List[float]
    dimension: int


class BatchEmbedRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, v: List[str]) -> List[str]:
        for i, text in enumerate(v):
            if not text.strip():
                raise ValueError(f"texts[{i}] must not be empty")
            if len(text) > 8192:
                raise ValueError(f"texts[{i}] exceeds maximum length of 8192 characters")
        return v


class BatchEmbedResponse(BaseModel):
    embeddings: List[List[float]]


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str
    vector_dimension: int


class SystemHealthResponse(BaseModel):
    status: str
    cpu_percent: float
    memory_usage_mb: float
    uptime_seconds: float


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
