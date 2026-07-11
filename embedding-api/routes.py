import logging
import time
import asyncio

from fastapi import APIRouter

from models import (
    EmbedRequest,
    EmbedResponse,
    BatchEmbedRequest,
    BatchEmbedResponse,
    HealthResponse,
)
from services import embedding_service
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=HealthResponse)
async def root():
    """Root health-check endpoint."""
    return HealthResponse(
        status="running",
        model=settings.MODEL_NAME,
        device=embedding_service.device,
        vector_dimension=embedding_service.dimension,
    )


@router.get("/health", response_model=HealthResponse)
async def health():
    """Dedicated health-check endpoint."""
    return HealthResponse(
        status="running",
        model=settings.MODEL_NAME,
        device=embedding_service.device,
        vector_dimension=embedding_service.dimension,
    )


@router.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    """Embed a single text string and return its vector + dimension."""
    start = time.perf_counter()
    embedding = await asyncio.to_thread(embedding_service.embed, request.content)
    elapsed = time.perf_counter() - start
    logger.debug("Single embed processed in %.1fms", elapsed * 1000)
    return EmbedResponse(
        embedding=embedding.tolist(),
        dimension=embedding_service.dimension,
    )


@router.post("/batch-embed", response_model=BatchEmbedResponse)
async def batch_embed_texts(request: BatchEmbedRequest):
    """Embed multiple texts in a single efficient batch call."""
    start = time.perf_counter()
    embeddings = await asyncio.to_thread(embedding_service.batch_embed, request.texts)
    elapsed = time.perf_counter() - start
    logger.info(
        "Batch embed %d texts in %.1fms",
        len(request.texts),
        elapsed * 1000,
    )
    return BatchEmbedResponse(embeddings=embeddings.tolist())
