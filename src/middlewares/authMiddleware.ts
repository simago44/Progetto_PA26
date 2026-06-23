import { auth } from 'express-oauth2-jwt-bearer';
import { type Request, type Response } from 'express';
import { env } from '../config.ts';

const AUTH0_DOMAIN = env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = env.AUTH0_AUDIENCE;

export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: Function) => {
    const permissions = (req.auth?.payload.permissions as string[]) || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
};

// Configure JWT validation middleware
export const checkJwt = auth({
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  audience: AUTH0_AUDIENCE,
});
