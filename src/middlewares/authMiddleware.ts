import { auth, UnauthorizedError } from 'express-oauth2-jwt-bearer';
import type { Request, Response, NextFunction } from 'express';
import env from '../core/config.ts';
import { createZodError, Errors } from '../factory/errorFactory.ts';
import z from 'zod';

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

/** Zod schema for validating signup request body. */
export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username too short")
    .max(15, "Username too long")
    .regex(/^[a-zA-Z0-9@^$_.!`\-#+'~]+$/, "Username contains non valid characters")
    .refine(val => !z.email().safeParse(val).success, "Username can't be an email address")
    .transform(val => val.toLowerCase()),

  password: z
    .string()
    .nonempty("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[!@#$%^&*]/, "Password must contain a special character (!@#$%^&*)")
});

/** Zod schema for validating login request body. */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Invalid username or password")
    .max(255, "Invalid username or password")
    .transform(val => val.toLowerCase()),

  password: z
    .string()
    .min(1, "Invalid username or password")
    .max(1000, "Invalid username or password")
});

/**
 * Creates a validation middleware for the given Zod schema.
 * On success, overwrites `req.body` with the sanitized and transformed data.
 * On failure, passes a `MalformedPayload` AppError to `next()`.
 * 
 * @param zodObject - The Zod schema to validate against
 */
function validateCredentials(zodObject: z.ZodObject, form: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = zodObject.safeParse(req.body);
    if (!result.success) throw createZodError(result.error, form);

    // Overwrite req.body with the safely parsed/sanitized fields
    res.locals.username = result.data.username;
    res.locals.password = result.data.password;

    next();
  };
}

/** Middleware that validates and sanitizes the signup request body. */
export const validateSignup = validateCredentials(signupSchema, "signup");

/** Middleware that validates and sanitizes the login request body. */
export const validateLogin = validateCredentials(loginSchema, "login");