import { type NextFunction, type Request, type Response } from 'express';
import { AppError, createError, ErrorEnum, getErrorHTTPStatus, getErrorName } from '../factory/errorFactory.ts';
import { z } from "zod";

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
function validateCredentials(zodObject: z.ZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = zodObject.safeParse(req.body);

    if (!result.success) {
      // YOUR EXACT ERROR LOGIC UNCHANGED
      const errorMessages = Object.values(z.treeifyError(result.error).properties ?? {})
        .map(property => property?.errors?.[0])
        .filter(Boolean);

      const errorString = `Validation error: ${errorMessages.join("; ")}`;

      return next(new AppError(
        getErrorHTTPStatus(ErrorEnum.MalformedPayload),
        errorString,
        getErrorName(ErrorEnum.MalformedPayload)
      ));
    }

    // Overwrite req.body with the safely parsed/sanitized fields
    req.body = result.data;

    next();
  };
}

/** Middleware that validates and sanitizes the signup request body. */
export const validateSignup = validateCredentials(signupSchema);

/** Middleware that validates and sanitizes the login request body. */
export const validateLogin = validateCredentials(loginSchema);