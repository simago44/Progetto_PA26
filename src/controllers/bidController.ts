import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import bidService from "../services/bidService.ts";

class BidController {
  public async createBid(_req: Request, res: Response) {
    const createdBid = await bidService.createBid(res.locals.bid);
    res.status(StatusCodes.CREATED).json({ id: createdBid.id });
  }

  public async getAuctionBids(_req: Request, res: Response) {
    const auctionId: number = res.locals.auctionId;
    const bids = await bidService.getAuctionBids(auctionId);
    res.status(StatusCodes.OK).json({ bids });
  }
}

const bidController = new BidController();

export default bidController;