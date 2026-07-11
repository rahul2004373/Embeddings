import express from "express";
import cors from "cors";
import { config } from "./config";
import { apiClient } from "./client";
import embeddingRouter from "./routes/embedding";
import { cacheResponse } from "./middleware/cache";
import { requestLogger } from "./middleware/requestLogger";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import type { BffHealthResponse } from "./types";

const app = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);
app.use(rateLimiter);

app.get("/", cacheResponse, async (_req, res, next) => {
  try {
    const upstream = await apiClient.health();
    const body: BffHealthResponse = {
      status: "running",
      upstream: config.embeddingApiUrl,
      upstream_status: upstream.status,
      model: upstream.model,
      device: upstream.device,
      vector_dimension: upstream.vector_dimension,
    };
    res.json(body);
  } catch (err) {
    const body: BffHealthResponse = {
      status: "degraded",
      upstream: config.embeddingApiUrl,
      upstream_status: "unreachable",
      model: "unknown",
      device: "unknown",
      vector_dimension: 0,
    };
    res.status(503).json(body);
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "running" });
});

app.use("/api", embeddingRouter);

app.use(errorHandler);

app.listen(config.port, config.host, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║   BFF Server ready                        ║
  ║   http://${config.host}:${config.port}             ║
  ║   Upstream: ${config.embeddingApiUrl}  ║
  ╚════════════════════════════════════════════╝
  `);
});

export default app;
