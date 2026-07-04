import type { CreationAttributes } from "sequelize";
import { createAuctionMissingFieldError, Errors } from "../factory/errorFactory.ts";
import { type Auction } from "../models/Auction.ts";
import { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import bidRepository from "../repositories/bidRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import auctionService from "./auctionService.ts";
import { omit } from "lodash-es";
import userService from "./userService.ts";
import { AuctionType } from "../enums/enums.ts";

class BidService {
  public async formatBids(bids: Bid[]): Promise<Record<string, unknown>[]> {
    const formattedAuctions = await Promise.all(
      bids.map(async (bid) => {
        return omit(bid.dataValues, ["updatedAt"]);
      })
    );
    return formattedAuctions;
  }

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

  public async getAuctionBids(auctionId: number): Promise<Record<string, unknown>[]> {
    const auction = await auctionRepository.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    if (auction.type != AuctionType.English && auction.type != AuctionType.Dutch) {
      throw new Errors.AuctionTypeNotSupportedError({ type: auction.type });
    }

    const bids = await bidRepository.findAuctionBids(auction.id);
    return this.formatBids(bids);
  }

  public async checkIsBidValid(bid: Bid, auction: Auction, user: User): Promise<void> {
    const auctionMsToEnd = await auctionService.getMsToEnd(auction);
    if (auctionMsToEnd <= 0) throw new Errors.AuctionEndedError();

    switch (auction.type) {
      case AuctionType.English: {
        if (auction.minimumIncrement == null) throw createAuctionMissingFieldError(auction, 'minimumIncrement');

        const winningBid = await auctionService.getWinningBid(auction.id);

        // if no bid is found, we check that the bid is at least equal to the reservePrice
        // otherwise, we check if the bid is at least equal to winningBid + minimumIncrement
        if (!winningBid) {
          if (bid.bidPrice < auction.reservePrice) {
            throw new Errors.BidTooLowError({ minimumBid: auction.reservePrice });
          }
        } else {
          if (bid.bidPrice < winningBid.bidPrice + auction.minimumIncrement) {
            throw new Errors.BidTooLowError({ minimumBid: winningBid.bidPrice + auction.minimumIncrement });
          }
        }
        break;
      }

      case AuctionType.Dutch:
        break;

      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice: {
        const userHasBidsInAuction = await bidRepository.userHasBidsInAuction(auction.id, user.id);
        if (userHasBidsInAuction) throw new Errors.BidAlreadyPlacedError();
        break;
      }
    }

    const realUserTokens = await userService.getRealUserTokens(user);
    if (realUserTokens < bid.bidPrice) throw new Errors.InsufficientTokensError();
  }
}

const bidService = new BidService();

export default bidService;