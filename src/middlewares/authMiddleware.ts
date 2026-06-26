import { auth, UnauthorizedError } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import env from '../config.ts';
import { createError, ErrorEnum } from '../factory/errorFactory.ts';
import logger from './logger.ts';

const AUTH0_DOMAIN = env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = env.AUTH0_AUDIENCE;

/**
 * Middleware that checks if the authenticated user has a specific permission.
 * Reads permissions from the JWT payload set by `checkJwt`.
 * 
 * @param permission - The required permission (e.g. `read:users`)
 * @throws {AppError} 403 Forbidden if the permission is missing
 */
export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = (req.auth?.payload.permissions as string[]) || [];

    if (!permissions.includes(permission)) {
      next(createError(ErrorEnum.Forbidden))
    }

    next();
  };
};

/**
 * Middleware that validates the JWT token in the Authorization header.
 * Uses Auth0 as the issuer and validates against the configured audience.
 */
export function checkJwt(req: Request, res: Response, next: NextFunction) {
  auth({
    issuerBaseURL: `https://${AUTH0_DOMAIN}`,
    audience: AUTH0_AUDIENCE,
  })(req, res, (err) => {
    if (!err) return next();
    if (err instanceof UnauthorizedError)
      return next(createError(ErrorEnum.Unauthorized, err.message));
    next(err);
  });
}
