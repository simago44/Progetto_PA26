import type { Request, Response, NextFunction } from 'express';
import { AppError, createError, ErrorEnum, getErrorHTTPStatus, getErrorName } from '../factory/errorFactory.ts';
import z from 'zod';

export function resolveUserIdParam(req: Request, _res: Response, next: NextFunction) {
  if (!req.params.id) return next(createError(ErrorEnum.MalformedPayload));
  // Should not be necessary, because auth should always be checked before that!
  if (!req.auth?.payload.sub) return next(createError(ErrorEnum.Unauthorized));
  if (req.params.id == "self") req.params.id = req.auth.payload.sub;

  next();
};

/** Zod schema for validating login request body. */
export const topUpWalletSchema = z.object({
  tokens: z.number().positive()
});

export function validateTopUpWallet(req: Request, res: Response, next: NextFunction) {
  const result = topUpWalletSchema.safeParse(req.body);

  if (!result.success) {
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
}