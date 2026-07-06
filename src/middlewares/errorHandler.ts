// middleware/errorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { AppError, Errors } from "../factory/errorFactory.ts";
import logger from "../core/logger.ts";
import { StatusCodes } from "http-status-codes";

/**
 * Global Express error handler middleware.
 * Responds with the HTTP status and message from the `Error`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Catch json parsing errors
  if (err instanceof SyntaxError && 'status' in err &&
      err.status === StatusCodes.BAD_REQUEST && 'body' in err
  ) {
    err = new AppError(err.status, err.message, err.name);
  }

  const error = err instanceof AppError ? err : new Errors.InternalServerError();

  if (!(err instanceof AppError)) {
    logger.error(`${err.stack}`); // log original error stack
  } else {
    logger.debug(`[${error.name}(${error.status})] ${error.message}`);
  }
  
  const responseObject: { name: string, error: string, details?: unknown } = {
    name: error.name,
    error: error.message
  };
  
  if (error.details) responseObject.details = error.details;

  res.status(error.status).json(responseObject)
}