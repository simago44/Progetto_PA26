import type { Request, Response, NextFunction } from 'express';
import { createError, ErrorEnum } from '../factory/errorFactory.ts';

export function resolveUserIdParam(req: Request, res: Response, next: NextFunction) {
  if (!req.params.id) return next(createError(ErrorEnum.MalformedPayload));
  // Should not be necessary, because auth should always be checked before that!
  if (!req.auth?.payload.sub) return next(createError(ErrorEnum.Unauthorized));
  if (req.params.id == "self") req.params.id = req.auth.payload.sub;

  next();
};
