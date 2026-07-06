import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { CreationAttributes } from "sequelize";
import type { Auction } from "../models/Auction.ts";
import type { AuctionStatus, AuctionType } from "../enums/enums.ts";
import auctionService from "../services/auctionService.ts";

class AuctionController {
  /**
   * Creates an auction from the validated payload on `res.locals`.
   * 
   * `res.locals.auction` is the new auction to create.
   * 
   * Returns `201 Created` with the ID of the created auction.
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
   * Get auctions filtered by the validated payload on `res.locals`.
   * 
   * `res.locals.filters` is the object containing the filters applied to the search.
   * 
   * The auctions can be filtered by:
   *  - `creatorIds`: auction creators IDs;
   *  - `statuses`: auction's status (not-started, in-progress, ended);
   *  - `types`: auction's type (english, dutch, first-price, second-price).
   * 
   * Returns `200 OK` with the list of auctions.
   */
  public async getAuctions(
    _req: Request,
    res: Response<unknown, { filters: { creatorIds: string[], statuses: AuctionStatus[], types: AuctionType[] } }>
  ) {
    const auctions = await auctionService.getFilteredAuctions(res.locals.filters);
    res.status(StatusCodes.OK).json({ auctions });
  }

  /**
   * Get stats of the auctions grouped by type and filtered by the validated payload on `res.locals`.
   * 
   * `res.locals.filters` is the object containing the filters applied to the search.
   * 
   * The auctions can be filtered by:
   *  - `types`: auction's type (english, dutch, first-price, second-price);
   *  - `startDate`: auction's start date;
   *  - `endDate`: auction's end date.
   * 
   * Returns `200 OK` with the list of auctions.
   */
  public async getAuctionStats(
    _req: Request,
    res: Response<unknown, { filters: { types: AuctionType[], startDate: Date, endDate: Date } }>
  ) {
    const stats = await auctionService.getAuctionStats(res.locals.filters);
    res.status(StatusCodes.OK).json(stats);
  }

  /**
   * Update an auction reserve price from the validated payload on `res.locals`.
   * 
   * 'res.locals' must contain:
   *  - `auctionId`: is the ID of the auction to update.
   *  - `reservePrice`: is the new reservePrice.
   * 
   * Returns `200 OK`.
   */
  public async updateAuctionReservePrice(
    _req: Request,
    res: Response<unknown, { auctionId: number, reservePrice: number }>
  ) {
    await auctionService.updateAuctionReservePrice(res.locals.auctionId, res.locals.reservePrice);
    res.status(StatusCodes.OK).json({});
  }
}

const auctionController = new AuctionController();

export default auctionController;
