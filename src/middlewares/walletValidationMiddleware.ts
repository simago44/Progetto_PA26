import type { Request, Response, NextFunction } from 'express';
import { Errors, createZodError } from '../factory/errorFactory.ts';
import z from 'zod';

export function resolveUserIdParam(req: Request, _res: Response, next: NextFunction) {
  if (!req.params.userId) throw new Errors.MalformedPayloadError();
  // Should not be necessary, because auth should always be checked before that!
  if (!req.auth?.payload.sub) throw new Errors.UnauthorizedError();
  if (req.params.userId == "self") req.params.userId = req.auth.payload.sub;

  next();
};

/** Zod schema for validating login request body. */
export const topUpWalletSchema = z.object({
  tokens: z.number().positive()
});

export function validateTopUpWallet(req: Request, res: Response, next: NextFunction) {
  const result = topUpWalletSchema.safeParse(req.body);

  if (!result.success) throw createZodError(result.error, "validateTopUpWallet");

  // Overwrite req.body with the safely parsed/sanitized fields
  req.body = result.data;

  next();
}