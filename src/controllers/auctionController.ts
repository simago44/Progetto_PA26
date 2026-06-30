import type { NextFunction, Request, Response } from "express";
import auctionRepository from "../repositories/auctionRepository.ts";
import { BaseError, ValidationError } from "sequelize";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";
import logger from "../middlewares/logger.ts";
import { Auction, AuctionStatus } from "../models/Auction.ts";
import * as Messages from "../factory/messageStrings.ts";
import { StatusCodes } from "http-status-codes";

export class AuctionController {
  /** Gets the auctions filtered by status
   * If the status code is not present in query params it returns all the auctions
   * Example URL: /auctions?status=0
   */
  public async getAuctions(req: Request, res: Response, next: NextFunction) {
    const statusValue =
      req.query.status !== undefined ? Number(req.query.status) : undefined;

    if (
      //invalid auction status
      statusValue !== undefined &&
      !Object.values(AuctionStatus).includes(statusValue as AuctionStatus)
    ) {
      next(
        createError(
          ErrorEnum.BadRequest,
          Messages.invalidAuctionStatus_message,
        ),
      );
      return;
    }

    const status = statusValue as AuctionStatus | undefined;

    const options = {
      ...(status !== undefined && { status }), //add status if status is not undefined
    };

    const auctions: Auction[] = await auctionRepository.getFiltered(options);

    res.status(StatusCodes.OK).json({ auctions });
  }

  /** Creates an auction and passes to the repository to save on db
   * @params req, res to be a route handler
   * @params next to pass the exceptions
   * @returns void
   */
  public async createAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const auction = Auction.build({ ...req.body });

      await auctionRepository.save(auction);
      res.status(StatusCodes.CREATED).json({ id: auction.id });
    } catch (err) {
      if (err instanceof ValidationError) {
        const errorString: string = `${err.message}: ${err.errors.map((e) => `${e.path}: ${e.message}`).join(`, `)}`;

        logger.info(errorString);
        next(createError(ErrorEnum.ValidationError, errorString));
        return;
      }
      if (err instanceof BaseError) {
        next(createError(ErrorEnum.DatabaseError, err.message));
      }
      next(err);
    }
  }
}
