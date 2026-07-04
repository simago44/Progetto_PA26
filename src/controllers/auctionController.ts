import type { Request, Response } from "express";
import auctionService from "../services/auctionService.ts";
import { StatusCodes } from "http-status-codes";
import { SuccessMesages } from "../factory/messageStrings.ts";

class AuctionController {
  /** Gets the auctions filtered by status
   * If the status code is not present in query params it returns all the auctions
   * Example URL: /auctions?status=0
   */
  public async getAuctions(_req: Request, res: Response) {
    const options = {
      creatorIds: res.locals.creatorIds,
      statuses: res.locals.statuses,
      types: res.locals.types
    };

    const auctions = await auctionService.getAuctions(options);

    res.status(StatusCodes.OK).json({ count: auctions.length, auctions: await auctionService.formatAuctions(auctions) });
  }

  /** Creates an auction and passes to the repository to save on db
   * @params req, res to be a route handler
   * @params next to pass the exceptions
   * @returns void
   */
  public async createAuction(_req: Request, res: Response) {
    // No validation necessary. The creatorId is guaranteed to exists thanks to validation
    // The other fields are validated in middleware
    const auction = await auctionService.createAuction(res.locals.auction);
    res.status(StatusCodes.CREATED).json({ id: auction.id });
  }

  public async updateAuctionReservePrice(_req: Request, res: Response) {
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
