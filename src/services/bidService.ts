import type { CreationAttributes } from "sequelize";
import { Errors } from "../factory/errorFactory.ts";
import { AuctionStatus, AuctionType, type Auction } from "../models/Auction.ts";
import { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import bidRepository from "../repositories/bidRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import auctionService from "./auctionService.ts";

class BidService {
  public async createBid(bidData: CreationAttributes<Bid>): Promise<Bid> {
    const auctionId: number = bidData.auctionId as number;
    const userId: string = bidData.userId;

    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    const user = await userRepository.findByPk(userId);
    // TODO: if this happens, throw an error and invalidate the token???
    if (!user) throw new Errors.UnauthorizedError(); // should not happen because we validated

    // TODO: validation of bid based on auction and user (tokens, auction closed, ecc)
    const bid: Bid = bidRepository.build(bidData);

    await this.checkIsBidValid(bid, auction, user);

    const createdBid = await bidRepository.save(bid);

    //If the auction is dutch must be closed when the first bid arrives
    if (auction.type == AuctionType.Dutch) await auctionService.closeAuction(auction, 0);

    return createdBid;
  }

  public async getAuctionBids(auctionId: number) {
    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    if (auction.type != AuctionType.English && auction.type != AuctionType.Dutch) {
      throw new Errors.AuctionTypeNotSupportedError({ type: auction.type });
    }

    return await bidRepository.findAuctionBids(auction.id);
  }


  public async getRealUserTokens(user: User) {
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

  public async checkIsBidValid(bid: Bid, auction: Auction, user: User) {
    const auctionMsToEnd = await auctionService.getMsToEnd(auction);
    if (auctionMsToEnd <= 0) throw new Errors.AuctionEndedError();

    switch (auction.type) {
      case AuctionType.English:
        const winningBid = await auctionService.getWinningBid(auction);
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

    const realUserTokens = await this.getRealUserTokens(user);
    if (realUserTokens < bid.bidPrice) throw new Errors.InsufficientTokensError();
  }
}

const bidService = new BidService();

export default bidService;