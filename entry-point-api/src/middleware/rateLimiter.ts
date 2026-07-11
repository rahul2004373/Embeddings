import type { Request, Response, NextFunction } from "express";
import { config } from "../config";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, CLEANUP_INTERVAL);

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + config.rateLimitWindowMs };
    store.set(key, entry);
  }

  entry.count++;

  res.setHeader("X-RateLimit-Limit", config.rateLimitMax);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, config.rateLimitMax - entry.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

  if (entry.count > config.rateLimitMax) {
    res.status(429).json({
      success: false,
      error: "Too many requests — try again later",
    });
    return;
  }

  next();
}
