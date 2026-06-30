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
  if (auctionMsToEnd <= 0) throw new Errors.AuctionEndedError;

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
      if (userHasBidsInAuction) throw new Errors.BidAlreadyPlacedError;
      break;
  }
}

export class BidController {
  public async createBid(req: Request, res: Response, next: NextFunction) {
    const auctionId = req.body.auctionId as string;
    const userId = req.body.userId as string;

    const auction = await auctionRepository.loadByPk(auctionId);
    const user = await userRepository.loadByPk(userId);

    // TODO: validation of bid based on auction and user (tokens, auction closed, ecc)
    const bid: Bid = Bid.build({ ...req.body });

    await checkIsBidValid(bid, auction, user);

    const saved = await bidRepository.save(bid);

    res.status(StatusCodes.OK).json({ id: saved.id });
  }
  public async getAuctionBids(req: Request, res: Response, next: NextFunction) {
    const auctionId = req.params.auctionId as string;

    const auction = await auctionRepository.loadByPk(auctionId);

    if (auction.type != AuctionType.English && auction.type != AuctionType.Dutch) {
      throw new Errors.AuctionTypeNotSupportedError({ type: auction.type });
    }

    const bids = await bidRepository.getAuctionBids(auction.id);

    res.status(StatusCodes.OK).json({ bids });
  }
}
