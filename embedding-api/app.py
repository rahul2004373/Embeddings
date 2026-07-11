import logging
import time

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from starlette.middleware.base import BaseHTTPMiddleware

from config import settings
from services import embedding_service
from routes import router
from utils import setup_logging, generate_request_id, request_id_var

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique request ID to every request for traceability."""

    async def dispatch(self, request: Request, call_next):
        rid = generate_request_id()
        request_id_var.set(rid)
        request.state.request_id = rid
        start = time.perf_counter()
        try:
            response = await call_next(request)
            elapsed = time.perf_counter() - start
            logger.info(
                "%s %s -> %d in %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                elapsed * 1000,
            )
            response.headers["X-Request-ID"] = rid
            return response
        except Exception:
            elapsed = time.perf_counter() - start
            logger.exception(
                "%s %s -> 500 in %.1fms",
                request.method,
                request.url.path,
                elapsed * 1000,
            )
            return JSONResponse(
                status_code=500,
                content={"success": False, "error": "Internal server error"},
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Starting Embedding API ...")
    try:
        embedding_service.load_model()
        embedding_service.warm_up()
    except Exception:
        logger.exception("Failed to initialise model — shutting down")
        raise
    logger.info("Embedding API ready")
    yield
    logger.info("Shutting down Embedding API ...")
    embedding_service.unload_model()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Embedding API",
    description="Production-grade text embedding service powered by Sentence Transformers",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestIDMiddleware)

app.include_router(router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0]["msg"] if errors else "Validation error"
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": first_error},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )
