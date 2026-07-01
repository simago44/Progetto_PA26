import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import bidRepository from "../repositories/bidRepository.ts";
import { Bid } from "../models/Bid.ts";
import { Errors } from "../factory/errorFactory.ts";
import { closeAuction, getMsToEnd, getWinningBid } from "../models/AuctionUtils.ts";
import { Auction, AuctionType } from "../models/Auction.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import type { User } from "../models/User.ts";

export async function getRealUserTokens(user: User) {
  const bidsInProgessAuctions = await bidRepository.getUserBidsOfInProgessAuctions(user.id);
  const highestByAuction = new Map<number, Bid>();
  for (const bid of bidsInProgessAuctions) {
    const current = highestByAuction.get(bid.auctionId);
    if (!current || bid.bidPrice > current.bidPrice) {
      highestByAuction.set(bid.auctionId, bid);
    }
  }

  const totalTokensOfBids = highestByAuction.values().reduce((total, bid) => total + bid.bidPrice, 0);
  return user.tokens - totalTokensOfBids;
}

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

  const realUserTokens = await getRealUserTokens(user);
  if (realUserTokens < bid.bidPrice) throw new Errors.InsufficientTokensError();
}

export class BidController {
  public async createBid(_req: Request, res: Response, _next: NextFunction) {
    const auctionId = res.locals.bid.auctionId as number;
    const userId = res.locals.bid.userId as string;

    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    const user = await userRepository.findByPk(userId);
    // TODO: if this happens, throw an error and invalidate the token???
    if (!user) throw new Errors.UnauthorizedError(); // should not happen because we validated

    // TODO: validation of bid based on auction and user (tokens, auction closed, ecc)
    const bid: Bid = Bid.build(res.locals.bid);

    await checkIsBidValid(bid, auction, user);

    const createdBid = await bidRepository.create(bid);

    if (auction.type == AuctionType.Dutch) await closeAuction(auction, 0);

    res.status(StatusCodes.OK).json({ id: createdBid.id });
  }
  public async getAuctionBids(_req: Request, res: Response, _next: NextFunction) {
    const auctionId = res.locals.auctionId as number;

    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    if (auction.type != AuctionType.English && auction.type != AuctionType.Dutch) {
      throw new Errors.AuctionTypeNotSupportedError({ type: auction.type });
    }

    const bids = await bidRepository.findAuctionBids(auction.id);

    res.status(StatusCodes.OK).json({ bids });
  }
}
