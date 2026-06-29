import type { Request, Response, NextFunction } from "express";
import logger from "./logger.ts";
import { Bid } from "../models/Bid.ts";
import { ValidationError } from "sequelize";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";

/** Middleware which validates the bid in the request body */
export async function validateBidMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const bid = new Bid({
      ...req.body,
      userId: req.auth?.payload.sub,
      createdAt: new Date(),
    });
    await bid.validate();
    res.locals.bid = bid;
    next();
  } catch (err) {
    if (err instanceof ValidationError) {
      logger.info(err.message);
      next(
        createError(
          ErrorEnum.ValidationError,
          err.errors.map((e) => `${e.path}: ${e.message}`).join(", "),
        ),
      );
      return;
    }
    next(err);
  }
}
