// middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { AppError, createError, ErrorEnum } from "../factory/errorFactory.ts";
import logger from "./logger.ts";

/**
 * Global Express error handler middleware.
 * Responds with the HTTP status and message from the `Error`.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const error = err instanceof AppError ? err : createError(ErrorEnum.InternalServer)

  if (!(err instanceof AppError)) {
    logger.error(`[${error.name}] ${error.message}`); // logga l'errore originale
  }
  
  const responseObject: { name: string, error: string, detail?: string } = {
    name: error.name,
    error: error.message
  };
  
  if (error.detail) responseObject.detail = error.detail;

  logger.debug(`[${error.name}(${error.status})] ${error.message}`);

  res.status(error.status).json(responseObject)
}