import type { NextFunction, Request, Response} from "express";
import { Auction } from "../models/Auction.ts";
import { ValidationError } from "sequelize";
import logger from "./logger.ts";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";

export async function validateAuctionMiddleware(req: Request, res: Response, next: NextFunction) {
  try{
    logger.debug( `creatorId: ${req.auth?.payload.sub}` )
    const auction = new Auction({ ...req.body, creatorId: req.auth?.payload.sub });
    await auction.validate();
    res.locals.auction = auction;
    next();
  } catch(err) {
    if (err instanceof ValidationError) {
      logger.info(err.message);
      next(createError(ErrorEnum.ValidationError, err.errors.map(e => `${e.path}: ${e.message}`).join(", ")));
      return;
    }
    next(err);
  }
}