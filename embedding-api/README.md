# Embedding API

Production-grade text embedding service using Sentence Transformers (`BAAI/bge-small-en-v1.5`).

## Features

- Single & batch text embedding
- Efficient batched inference (configurable batch size)
- Automatic GPU detection (CUDA if available, CPU otherwise)
- Model warm-up on startup
- Request tracing via unique IDs in logs and response headers
- Request timing via middleware
- Configurable CORS origins
- OpenAPI documentation (`/docs`, `/redoc`)
- Graceful shutdown
- Structured JSON error responses (no stack traces exposed)

## Quick Start

```bash
# Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker build -t embedding-api .
docker run -p 8000:8000 embedding-api
```

## Configuration

All configuration is via environment variables:

| Variable               | Default                  | Description                     |
|------------------------|--------------------------|---------------------------------|
| `MODEL_NAME`           | `BAAI/bge-small-en-v1.5` | HuggingFace model ID            |
| `HOST`                 | `0.0.0.0`                | Server bind address             |
| `PORT`                 | `8000`                   | Server port                     |
| `LOG_LEVEL`            | `INFO`                   | Python log level                |
| `CORS_ORIGINS`         | `*`                      | Comma-separated allowed origins |
| `MAX_CONTENT_LENGTH`   | `8192`                   | Max input characters            |
| `BATCH_SIZE`           | `32`                     | Inference batch size            |
| `NORMALIZE_EMBEDDINGS` | `true`                   | L2-normalize output vectors     |

## API

### `GET /`

Health check.

```json
{
  "status": "running",
  "model": "BAAI/bge-small-en-v1.5",
  "device": "cpu",
  "vector_dimension": 384
}
```

### `GET /health`

Same as root — dedicated health endpoint.

### `POST /embed`

Embed a single text.

```bash
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"content": "Artificial Intelligence is amazing."}'
```

Response:

```json
{
  "embedding": [0.0123, -0.0456, ...],
  "dimension": 384
}
```

### `POST /batch-embed`

Embed multiple texts in a single batched call.

```bash
curl -X POST http://localhost:8000/batch-embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["hello", "how are you", "AI"]}'
```

Response:

```json
{
  "embeddings": [
    [0.0123, -0.0456, ...],
    [0.0789, 0.0123, ...],
    [-0.0321, 0.0567, ...]
  ]
}
```

## Validation Rules

- Empty strings → **422**
- Whitespace-only strings → **422**
- Null/missing required fields → **422**
- Content > 8192 characters → **422**
- Unexpected errors → **500** with `{"success": false, "error": "..."}`

## Error Format

All errors return:

```json
{
  "success": false,
  "error": "Human-readable message"
}
```

## OpenAPI Docs

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Project Structure

```
embedding-api/
├── app.py          # FastAPI app, middleware, lifespan, exception handlers
├── config.py       # Environment-based configuration
├── models.py       # Pydantic request/response schemas
├── services.py     # Model loading, inference, warm-up
├── routes.py       # API route definitions
├── utils.py        # Logging setup, request ID generation
├── requirements.txt
├── Dockerfile
├── .gitignore
└── README.md
```

## Design Decisions

- **Lifespan events** — model loads once on startup, not per-request.
- **`asyncio.to_thread`** — runs CPU-bound `model.encode()` off the event loop, keeping endpoints responsive.
- **Pydantic v2** — request validation, rejection of empty/null/overlong inputs with proper 422 status.
- **Efficient batches** — `model.encode(texts, batch_size=...)` uses Sentence Transformers' internal batching rather than a Python loop.
- **NumPy → list** — `.tolist()` converts once at the boundary; avoids unnecessary copies.
- **Request IDs** — per-request UUID logged and returned as `X-Request-ID` header for traceability.
- **No stack traces in responses** — errors are logged server-side; clients receive sanitised JSON.
- **Graceful shutdown** — model reference released, GC hints, CUDA cache cleared.
- **Multi-stage Docker** — builder stage compiles/installs; final stage is minimal.

## Troubleshooting

| Problem                        | Solution                                                    |
|--------------------------------|-------------------------------------------------------------|
| Model download slow            | First run caches locally; subsequent startups are instant.  |
| Out of memory                  | Lower `BATCH_SIZE` env var.                                 |
| CUDA not detected              | Sentence Transformers uses CUDA automatically if available. |
| CORS errors in browser         | Set `CORS_ORIGINS=http://localhost:3000` (your frontend).   |
| Transformers library warnings  | Suppressed via `logging.WARNING` on noisy loggers.          |
