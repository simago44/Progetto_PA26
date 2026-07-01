import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import bidRepository from "../repositories/bidRepository.ts";
import { Bid } from "../models/Bid.ts";
import { Errors } from "../factory/errorFactory.ts";
import { getMsToEnd, getWinningBid } from "../models/AuctionUtils.ts";
import { Auction, AuctionType } from "../models/Auction.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import type { User } from "../models/User.ts";


async function checkIsBidValid(bid: Bid, auction: Auction, user: User) {
  const auctionMsToEnd = await getMsToEnd(auction);
  if (auctionMsToEnd <= 0) throw new Errors.AuctionEndedError();

  switch (auction.type) {
    case AuctionType.English:
      const winningBid = await getWinningBid(auction);
      if (!winningBid) return "";
      if (bid.bidPrice < winningBid?.finalPrice + auction.minimumIncrement) {
        throw new Errors.BidTooLowError({ minimumBid: winningBid.finalPrice + auction.minimumIncrement });
      }
      break;

    case AuctionType.Dutch:
      break;

    case AuctionType.FirstPrice:
    case AuctionType.SecondPrice:
      const userHasBidsInAuction = await bidRepository.userHasBidsInAuction(auction.id, user.id);
      if (userHasBidsInAuction) throw new Errors.BidAlreadyPlacedError();
      break;
  }
}

export class BidController {
  public async createBid(req: Request, res: Response, _next: NextFunction) {
    const auctionId = req.body.auctionId as string;
    const userId = req.body.userId as string;

    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });
    
    const user = await userRepository.findByPk(userId);
    // TODO: if this happens, throw an error and invalidate the token???
    if (!user) throw new Errors.UnauthorizedError(); // should not happen because we validated

    // TODO: validation of bid based on auction and user (tokens, auction closed, ecc)
    const bid: Bid = Bid.build({ ...req.body });

    await checkIsBidValid(bid, auction, user);

    const createdBid = await bidRepository.create(bid);

    res.status(StatusCodes.OK).json({ id: createdBid.id });
  }
  public async getAuctionBids(req: Request, res: Response, _next: NextFunction) {
    const auctionId = req.params.auctionId as string;

    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    if (auction.type != AuctionType.English && auction.type != AuctionType.Dutch) {
      throw new Errors.AuctionTypeNotSupportedError({ type: auction.type });
    }

    const bids = await bidRepository.findAuctionBids(auction.id);

    res.status(StatusCodes.OK).json({ bids });
  }
}
