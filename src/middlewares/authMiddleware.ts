import { auth, UnauthorizedError } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import env from '../core/config.ts';
import { Errors } from '../factory/errorFactory.ts';

const checkJwt = auth({
  issuerBaseURL: `https://${env.AUTH0_DOMAIN}`,
  audience: env.AUTH0_AUDIENCE,
});

/**
 * Middleware that checks if the authenticated user has a specific permission.
 * Reads permissions from the JWT payload set by `checkJwt`.
 * 
 * @param permission - The required permission (e.g. `read:users`)
 * @throws {AppError} 403 Forbidden if the permission is missing
 */
export function checkPermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const permissions = req.auth?.payload.permissions;
    if (!Array.isArray(permissions) || !permissions.includes(permission)) {
      throw new Errors.ForbiddenError();
    }
    next();
  };
}

export function checkSelfOrAllPermission(selfPermission: string, allPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = (req.auth?.payload.permissions as string[]) ?? [];
    if (permissions.includes(allPermission)) return next();

    const isSelf = res.locals.userId === res.locals.authId;
    if (!permissions.includes(selfPermission) || !isSelf) throw new Errors.ForbiddenError();

    next();
  };
}

/**
 * Middleware that validates the JWT token in the Authorization header.
 * Uses Auth0 as the issuer and validates against the configured audience.
 */
export function checkJwtAuthorization(req: Request, res: Response, next: NextFunction) {
  checkJwt(req, res, (err) => {
    if (err instanceof UnauthorizedError) return next(new Errors.UnauthorizedError());
    if (err) return next(err);
    res.locals.authId = req.auth?.payload.sub;
    next();
  });
}
