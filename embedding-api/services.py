import time
import logging
import gc

import numpy as np
from sentence_transformers import SentenceTransformer

from config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Manages the Sentence Transformer model lifecycle and inference."""

    def __init__(self) -> None:
        self.model: SentenceTransformer | None = None
        self.device: str = "cpu"
        self.dimension: int = 0

    def load_model(self) -> None:
        """Load the model from HuggingFace hub or cache, detect device, log metadata."""
        start = time.perf_counter()
        logger.info("Loading model %s ...", settings.MODEL_NAME)
        self.model = SentenceTransformer(settings.MODEL_NAME)
        self.device = str(self.model.device)
        self.dimension = self.model.get_sentence_embedding_dimension()
        elapsed = time.perf_counter() - start
        logger.info(
            "Model loaded on %s | dimension=%d | time=%.2fs",
            self.device,
            self.dimension,
            elapsed,
        )

    def warm_up(self) -> None:
        """Run a dummy inference to trigger one-time GPU/CPU warm-up."""
        logger.info("Warming up model ...")
        self.model.encode(
            "warm-up inference",
            normalize_embeddings=settings.NORMALIZE_EMBEDDINGS,
        )
        logger.info("Warm-up complete")

    def embed(self, text: str) -> np.ndarray:
        """Return a single normalized embedding vector."""
        return self.model.encode(
            text,
            normalize_embeddings=settings.NORMALIZE_EMBEDDINGS,
        )

    def batch_embed(self, texts: list[str]) -> np.ndarray:
        """Return normalized embeddings for a batch of texts (efficient batched inference)."""
        return self.model.encode(
            texts,
            normalize_embeddings=settings.NORMALIZE_EMBEDDINGS,
            batch_size=settings.BATCH_SIZE,
            show_progress_bar=False,
        )

    def unload_model(self) -> None:
        """Release model reference and hint garbage collection."""
        logger.info("Unloading model ...")
        self.model = None
        gc.collect()
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                logger.info("CUDA cache cleared")
        except ImportError:
            pass


embedding_service = EmbeddingService()
