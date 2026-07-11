import { Router } from "express";
import { apiClient } from "../client";
import { cacheResponse } from "../middleware/cache";
import { validateEmbed, validateBatchEmbed } from "../middleware/validate";
import type { EmbedRequest, BatchEmbedRequest } from "../types";

const router = Router();

router.post("/embed", validateEmbed, cacheResponse, async (req, res, next) => {
  try {
    const result = await apiClient.embed(req.body as EmbedRequest);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/batch-embed", validateBatchEmbed, cacheResponse, async (req, res, next) => {
  try {
    const result = await apiClient.batchEmbed(req.body as BatchEmbedRequest);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
