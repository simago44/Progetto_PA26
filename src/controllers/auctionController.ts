import type { Request, Response } from "express";
import auctionService from "../services/auctionService.ts";
import { StatusCodes } from "http-status-codes";
import { SuccessMesages } from "../factory/messageStrings.ts";
import type { CreationAttributes } from "sequelize";
import type { Auction } from "../models/Auction.ts";
import type { AuctionStatus, AuctionType } from "../enums/enums.ts";

class AuctionController {
  /**
   * Update an auction reserve price from the validated payload on `res.locals`.
   * 
   * `res.locals.auctionId` must be a validated `number`
   * 
   * `res.locals.reservePrice` must be a validated `number`
   * 
   * Returns `200 OK` with the list of auctions
   * 
   * @param _req Unused request object.
   * @param res Response object.
   */
  public async getAuctions(
    _req: Request,
    res: Response<unknown, { creatorIds: string[], statuses: AuctionStatus[], types: AuctionType[] }>
  ) {
    const auctions = await auctionService.getAuctions(res.locals);

    res.status(StatusCodes.OK).json({ auctions: await auctionService.formatAuctions(auctions) });
  }

  /**
   * Creates an auction from the validated payload on `res.locals`.
   * 
   * `res.locals.auction` is the new auction to create
   * 
   * Returns `201 Created` with the ID of the created auction.
   * 
   * @param _req Unused request object.
   * @param res Response object.
   */
  public async createAuction(
    _req: Request,
    res: Response<unknown, { auction: CreationAttributes<Auction> }>
  ) {
    // No validation necessary. The creatorId is guaranteed to exists thanks to validation
    // The other fields are validated in middleware
    const auction = await auctionService.createAuction(res.locals.auction);
    res.status(StatusCodes.CREATED).json({ id: auction.id });
  }

  /**
   * Update an auction reserve price from the validated payload on `res.locals`.
   * 
   * `res.locals.auctionId` is the ID of the auction to update
   * 
   * `res.locals.reservePrice` is the new reservePrice
   * 
   * Returns `200 OK`.
   * 
   * @param _req Unused request object.
   * @param res Response object.
   */
  public async updateAuctionReservePrice(
    _req: Request,
    res: Response<unknown, { auctionId: number, reservePrice: number }>
  ) {
    const auctionId = res.locals.auctionId;
    const reservePrice = res.locals.reservePrice;

    await auctionService.updateAuctionReservePrice(auctionId, reservePrice);

    res.status(StatusCodes.OK).json({ message: SuccessMesages.ReservePriceUpdatedSuccessfully });
  }

  public async getAuctionStats(_req: Request, res: Response) {
    const stats = await auctionService.getAuctionStats(res.locals.filters);
    res.status(StatusCodes.OK).json(stats);
  }
}

const auctionController = new AuctionController();

export default auctionController;
