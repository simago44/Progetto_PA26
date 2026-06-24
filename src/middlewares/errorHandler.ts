// middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../factory/errorFactory.ts";
import logger from "./logger.ts";

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
    res.status(err.status).json({ error: err.message });
}