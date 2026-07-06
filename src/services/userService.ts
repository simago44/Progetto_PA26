import { AuctionStatus } from "../enums/enums.ts";
import { Errors } from "../factory/errorFactory.ts";
import type { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";
import bidRepository from "../repositories/bidRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import auctionService from "./auctionService.ts";

class UserService {
  public async getUserBidsOfInProgessAuctions(userId: string): Promise<Bid[]> {
    const openAuctions = await auctionService.getAuctions({ statuses: [AuctionStatus.InProgress] });
    const bidsPerAuction = await Promise.all(
      openAuctions.map(auction => bidRepository.findAuctionBids(auction.id)) // already cached, per-auction
    );
    return bidsPerAuction.flat().filter(bid => bid.userId === userId);
  }

  public async getRealUserTokens(user: User): Promise<number> {
    if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId: user.id });
    const bidsInProgessAuctions = await this.getUserBidsOfInProgessAuctions(user.id);

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