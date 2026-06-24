// middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../factory/errorFactory.ts";

/**
 * Global Express error handler middleware.
 * Responds with the HTTP status and message from the `AppError`.
 * 
 * @see AppError
 */
export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
    res.status(err.status).json({ error: err.message });
}