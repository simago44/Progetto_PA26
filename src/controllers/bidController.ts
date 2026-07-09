import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { CreationAttributes } from "sequelize";
import type { Bid } from "../models/Bid.ts";
import type BidService from "../services/bidService.ts";

interface BidControllerDeps {
  bidService: BidService;
}

class BidController {
  private bidService: BidControllerDeps["bidService"];

  constructor({ bidService }: BidControllerDeps) {
    this.bidService = bidService;
  }
  
  /**
   * Creates an bid from the validated payload on `res.locals`.
   * 
   * `res.locals.bid` is the new bid to create.
   * 
   * Returns `201 Created` with the ID of the created bid.
   */
  public createBid = async (
    _req: Request,
    res: Response<unknown, { bid: CreationAttributes<Bid> }>
  ) => {
    const createdBid = await this.bidService.createBid(res.locals.bid);
    res.status(StatusCodes.CREATED).json({ id: createdBid.id });
  }

  /**
   * Get all bids for the auction specified in the validated payload on `res.locals`.
   * 
   * `res.locals.auctionId` is ID of the auction whose bids are being retrieved.
   * 
   * Returns `200 OK` with the list of auction's bids.
   */
  public getAuctionBids = async (
    _req: Request,
    res: Response<unknown, { auctionId: number }>
  ) => {
    const bids = await this.bidService.getAuctionBids(res.locals.auctionId);
    res.status(StatusCodes.OK).json({ bids });
  }
}

export default BidController;