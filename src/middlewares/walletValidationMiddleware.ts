import type { Request, Response, NextFunction } from 'express';
import { Errors, createZodError } from '../factory/errorFactory.ts';
import z from 'zod';

export function resolveUserIdParam(req: Request, res: Response, next: NextFunction) {
  if (!req.params.userId) throw new Errors.MalformedPayloadError();

  const userId = req.params.userId == "self" ? res.locals.authId : req.params.userId;
  res.locals.userId = userId;

  next();
};

/** Zod schema for validating login request body. */
export const topUpWalletSchema = z.object({
  tokens: z.number().positive()
});

export function validateTopUpWallet(req: Request, res: Response, next: NextFunction) {
  res.locals.userId = req.params.userId;
  const tokens = req.body.tokens

  const result = topUpWalletSchema.safeParse({ tokens });

  if (!result.success) throw createZodError(result.error, "validateTopUpWallet");

  res.locals.tokens = result.data.tokens;

  next();
}