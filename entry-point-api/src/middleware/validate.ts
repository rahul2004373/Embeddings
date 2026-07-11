import type { Request, Response, NextFunction } from "express";

export function validateEmbed(req: Request, res: Response, next: NextFunction): void {
  const { content } = req.body;

  if (content === undefined || content === null) {
    res.status(422).json({ success: false, error: "content is required" });
    return;
  }

  if (typeof content !== "string") {
    res.status(422).json({ success: false, error: "content must be a string" });
    return;
  }

  if (!content.trim()) {
    res.status(422).json({ success: false, error: "content must not be empty" });
    return;
  }

  if (content.length > 8192) {
    res.status(422).json({ success: false, error: "content exceeds 8192 characters" });
    return;
  }

  next();
}

export function validateBatchEmbed(req: Request, res: Response, next: NextFunction): void {
  const { texts } = req.body;

  if (!Array.isArray(texts)) {
    res.status(422).json({ success: false, error: "texts must be an array" });
    return;
  }

  if (texts.length === 0) {
    res.status(422).json({ success: false, error: "texts must not be empty" });
    return;
  }

  for (let i = 0; i < texts.length; i++) {
    if (typeof texts[i] !== "string") {
      res.status(422).json({ success: false, error: `texts[${i}] must be a string` });
      return;
    }
    if (!texts[i].trim()) {
      res.status(422).json({ success: false, error: `texts[${i}] must not be empty` });
      return;
    }
    if (texts[i].length > 8192) {
      res.status(422).json({ success: false, error: `texts[${i}] exceeds 8192 characters` });
      return;
    }
  }

  next();
}
