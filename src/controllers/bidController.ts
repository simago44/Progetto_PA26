import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import bidService from "../services/bidService.ts";
import type { CreationAttributes } from "sequelize";
import type { Bid } from "../models/Bid.ts";

class BidController {
  /**
   * Creates an bid from the validated payload on `res.locals`.
   * 
   * `res.locals.bid` is the new bid to create.
   * 
   * Returns `201 Created` with the ID of the created bid.
   */
  public async createBid(
    _req: Request,
    res: Response<unknown, { bid: CreationAttributes<Bid> }>
  ) {
    const createdBid = await bidService.createBid(res.locals.bid);
    res.status(StatusCodes.CREATED).json({ id: createdBid.id });
  }

  /**
   * Get all bids for the auction specified in the validated payload on `res.locals`.
   * 
   * `res.locals.auctionId` is ID of the auction whose bids are being retrieved.
   * 
   * Returns `200 OK` with the list of auction's bids.
   */
  public async getAuctionBids(
    _req: Request,
    res: Response<unknown, { auctionId: number }>
  ) {
    const bids = await bidService.getAuctionBids(res.locals.auctionId);
    res.status(StatusCodes.OK).json({ bids });
  }
}

const bidController = new BidController();

export default bidController;