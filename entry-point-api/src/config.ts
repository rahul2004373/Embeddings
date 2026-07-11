import "dotenv/config";

export const config = {
  embeddingApiUrl: process.env.EMBEDDING_API_URL || "http://localhost:8000",
  port: parseInt(process.env.BFF_PORT || "3001", 10),
  host: process.env.BFF_HOST || "0.0.0.0",
  corsOrigins: (process.env.CORS_ORIGINS || "*").split(","),
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || "30000", 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || "300", 10),
  logLevel: process.env.LOG_LEVEL || "info",
};
