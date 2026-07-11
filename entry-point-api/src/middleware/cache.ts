import type { Request, Response, NextFunction } from "express";
import { config } from "../config";

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore) {
    if (entry.expiresAt <= now) cacheStore.delete(key);
  }
}, CLEANUP_INTERVAL);

export function cacheResponse(req: Request, res: Response, next: NextFunction): void {
  const cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}`;
  const cached = cacheStore.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    res.setHeader("X-Cache", "HIT");
    res.json(cached.data);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    if (res.statusCode < 400) {
      cacheStore.set(cacheKey, {
        data: body,
        expiresAt: Date.now() + config.cacheTtlSeconds * 1000,
      });
      res.setHeader("X-Cache", "MISS");
    }
    return originalJson(body);
  };

  next();
}
