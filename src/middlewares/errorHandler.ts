// middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { AppError, createError, ErrorEnum } from "../factory/errorFactory.ts";
import logger from "./logger.ts";

/**
 * Global Express error handler middleware.
 * Responds with the HTTP status and message from the `Error`.
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  const error = err instanceof AppError ? err : createError(ErrorEnum.InternalServer)

  if (!(err instanceof AppError)) {
    logger.error("Unhandled error:", err); // logga l'errore originale
  }
  
  const responseObject: { name: string, error: string, detail?: string } = {
    name: error.name,
    error: error.message
  }
  if ( error.detail) responseObject.detail = error.detail;

  res.status(error.status).json(responseObject)
}