import type { NextFunction, Request, Response } from "express";
import { validateAuction } from "../services/auctionValidationService.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import { BaseError, ValidationError } from "sequelize";
import { AppError, createError, ErrorEnum } from "../factory/errorFactory.ts";
import logger from "../middlewares/logger.ts";
import type { Auction } from "../models/Auction.ts";

export class AuctionController {
  /** Creates an auction and passes to the repository to save on db
   * @params req, res to be a route handler
   * @params next to pass the exceptions
   * @returns void
   */
  public async createAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const auction: Auction = res.locals.auction;

      validateAuction(auction);

      await auctionRepository.save(auction);

      res.status(201).json(auction);
    } catch (err) {
      logger.debug(typeof err);
      if (err instanceof ValidationError) {
        const errorString: string = `${err.message}: ${err.errors.map((e) => `${e.path}: ${e.message}`).join(`, `)}`;

        logger.info(errorString);
        next(createError(ErrorEnum.ValidationError, errorString));
        return;
      }
      if (err instanceof BaseError) {
        next(createError(ErrorEnum.DatabaseError, err.message));
      }
      logger.error(err);
      next(err);
    }
  }
}
