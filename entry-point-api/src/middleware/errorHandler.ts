import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${err.message}`);

  const statusCode =
    err.message.includes("Upstream")
      ? 502
      : err.message.includes("abort")
        ? 504
        : 500;

  res.status(statusCode).json({
    success: false,
    error:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  });
}
