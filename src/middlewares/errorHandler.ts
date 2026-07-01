// middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { AppError, Errors } from "../factory/errorFactory.ts";
import logger from "./logger.ts";
import { StatusCodes } from "http-status-codes";

/**
 * Global Express error handler middleware.
 * Responds with the HTTP status and message from the `Error`.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Catch json parsing errors
  if (err instanceof SyntaxError && 'status' in err &&
      err.status === StatusCodes.BAD_REQUEST && 'body' in err
  ) {
    err = new AppError(err.status, err.message, err.name);
  }

  const error = err instanceof AppError ? err : new Errors.InternalServerError();

  if (!(err instanceof AppError)) {
    logger.error(`[${error.name}] ${error.message}`); // logga l'errore originale
  }
  
  const responseObject: { name: string, error: string, details?: unknown } = {
    name: error.name,
    error: error.message
  };
  
  if (error.details) responseObject.details = error.details;

  logger.debug(`[${error.name}(${error.status})] ${error.message}`);

  res.status(error.status).json(responseObject)
}