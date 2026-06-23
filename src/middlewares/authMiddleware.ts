import { auth } from 'express-oauth2-jwt-bearer';
import { type Request, type Response } from 'express';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN as string;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE as string;

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
