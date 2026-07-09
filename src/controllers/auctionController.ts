import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { CreationAttributes } from "sequelize";
import type { Auction } from "../models/Auction.ts";
import type { AuctionStatus, AuctionType } from "../enums/enums.ts";
import type AuctionService from "../services/auctionService.ts";

interface AuctionControllerDeps {
  auctionService: AuctionService;
}

class AuctionController {
  private auctionService: AuctionControllerDeps["auctionService"];

  constructor({ auctionService }: AuctionControllerDeps) {
    this.auctionService = auctionService;
  }

  /**
   * Creates an auction from the validated payload on `res.locals`.
   * 
   * `res.locals.auction` is the new auction to create.
   * 
   * Returns `201 Created` with the ID of the created auction.
   */
  public createAuction = async (
    _req: Request,
    res: Response<unknown, { auction: CreationAttributes<Auction> }>
  ) => {
    // No validation necessary. The creatorId is guaranteed to exists thanks to validation
    // The other fields are validated in middleware
    const auction = await this.auctionService.createAuction(res.locals.auction);
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
  public getAuctions = async (
    _req: Request,
    res: Response<unknown, { filters: { creatorIds: string[], statuses: AuctionStatus[], types: AuctionType[] } }>
  )  => {
    const auctions = await this.auctionService.getFilteredAuctions(res.locals.filters);
    res.status(StatusCodes.OK).json({ auctions });
  }

  /**
   * Get stats of the auctions grouped by type and filtered by the validated payload on `res.locals`.
   * 
   * `res.locals.filters` is the object containing the filters applied to the search.
   * 
   * The auctions can be filtered by:
   *  - `types`: auction's type (english, dutch, first-price, second-price);
   *  - `fromDate`: auction's start date;
   *  - `toDate`: auction's end date.
   * 
   * Returns `200 OK` with the list of auctions.
   */
  public getAuctionStats = async (
    _req: Request,
    res: Response<unknown, { filters: { types: AuctionType[], fromDate: Date, toDate: Date } }>
  ) => {
    const stats = await this.auctionService.getAuctionStats(res.locals.filters);
    res.status(StatusCodes.OK).json(stats);
  }

  /**
   * Update an auction reserve price from the validated payload on `res.locals`.
   * 
   * 'res.locals' must contain:
   *  - `auctionId`: is the ID of the auction to update.
   *  - `userId`: is the ID of the logged user.
   *  - `reservePrice`: is the new reservePrice.
   * 
   * Returns `200 OK`.
   */
  public updateAuctionReservePrice = async (
    _req: Request,
    res: Response<unknown, { auctionId: number, authId: string, reservePrice: number }>
  ) => {
    await this.auctionService.updateAuctionReservePrice(res.locals.auctionId, res.locals.authId, res.locals.reservePrice);
    res.status(StatusCodes.OK).json({});
  }
}

export default AuctionController;
