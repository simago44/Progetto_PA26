import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import bidService from "../services/bidService.ts";

export class BidController {
  public async createBid(_req: Request, res: Response, _next: NextFunction) {
    const createdBid = await bidService.createBid(res.locals.bid);
    res.status(StatusCodes.OK).json({ id: createdBid.id });
  }

  public async getAuctionBids(_req: Request, res: Response, _next: NextFunction) {
    const auctionId: number = res.locals.auctionId;
    const bids = await bidService.getAuctionBids(auctionId);
    res.status(StatusCodes.OK).json({ bids });
  }
}
