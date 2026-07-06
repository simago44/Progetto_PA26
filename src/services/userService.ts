import { AuctionStatus, AuctionType } from "../enums/enums.ts";
import { Errors } from "../factory/errorFactory.ts";
import type { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";
import bidRepository from "../repositories/bidRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import auctionService from "./auctionService.ts";

class UserService {
  public async getRealUserTokens(user: User): Promise<number> {
    if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId: user.id });

    const openAuctions = await auctionService.getAuctions({ statuses: [AuctionStatus.InProgress] });
    const bidsPerAuction = await Promise.all(
      openAuctions.map(async (auction) => {
        if (auction.type != AuctionType.English) return bidRepository.findAuctionBids(auction.id)

        // if it's an english auction, we want to get only the winning bid.
        // if the winning bid is not of the current user, we don't need to consider it
        // in the token decrement
        const winningBid = await auctionService.getWinningBid(auction.id);
        if (!winningBid || winningBid.bid.userId != user.id) return [];
        return [winningBid.bid];
      }) // already cached, per-auction
    );
    const bidsInProgessAuctions = bidsPerAuction.flat().filter(bid => bid.userId === user.id);

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

  public async getWallet(userId: string): Promise<number> {
    const user = await userRepository.findByPk(userId);
    if (user == null) throw new Errors.UserNotFoundError({ userId });

    if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId });

    return await this.getRealUserTokens(user);
  }

  public async topUpWallet(userId: string, tokens: number): Promise<void> {
    const user = await userRepository.findByPk(userId);
    if (!user) throw new Errors.UserNotFoundError({ userId });

    await userRepository.incrementTokens(userId, tokens);
  }
}

const userService = new UserService();

export default userService;