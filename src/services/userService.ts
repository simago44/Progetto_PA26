import { AuctionStatus, AuctionType } from "../enums/enums.ts";
import { Errors } from "../factory/errorFactory.ts";
import type { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import bidRepository from "../repositories/bidRepository.ts";
import userRepository from "../repositories/userRepository.ts";
import auctionService, { type AuctionFilters } from "./auctionService.ts";

class UserService {
  /**
   * Calculates the user's available tokens after accounting for active bids.
   * @param user The User instance.
   * @returns The user's available token balance.
   * @throws {WalletNotFoundError} If the user does not have a wallet.
   */
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

  /**
   * Retrieves the user's available wallet balance.
   * @param userId The user ID.
   * @returns The user's available token balance.
   * @throws {UserNotFoundError} If the user does not exist.
   * @throws {WalletNotFoundError} If the user does not have a wallet.
   */
  public async getWallet(userId: string): Promise<number> {
    const user = await userRepository.findByPk(userId);
    if (user == null) throw new Errors.UserNotFoundError({ userId });

    if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId });

    return await this.getRealUserTokens(user);
  }

  /**
   * Retrieves a report of auctions matching the provided filters.
   * @param filters The auction report filters.
   * @returns A list of formatted auctions.
   */
  public async getAuctionReport(filters: Required<Pick<AuctionFilters, 'won' | 'participantId' | 'startDate' | 'endDate'>>) {
    const user = await userRepository.findByPk(filters.participantId);
    if (!user) throw new Errors.UserNotFoundError({ userId: filters.participantId });
    
    const where = auctionService.buildFilters(filters);
    const auctions = await auctionRepository.findUserAuctions(filters.participantId, where);
    return auctionService.formatAuctions(auctions);
  }

  /**
   * Retrieves the total amount spent by a user on won auctions within a date range.
   * @param filters The wallet report filters.
   * @returns The total final price of won auctions.
   * @throws {UserNotFoundError} If the user does not exist.
   */
  public async getWalletReport(filters: { participantId: string, startDate: Date, endDate: Date }) {
    const user = await userRepository.findByPk(filters.participantId);
    if (!user) throw new Errors.UserNotFoundError({ userId: filters.participantId });
    
    const auctionFilters = {
      ...filters,
      won: true
    }
    const where = auctionService.buildFilters(auctionFilters);
    return await auctionRepository.getTotalFinalPrice(where);
  }

  /**
   * Adds tokens to a user's wallet.
   * @param userId The user ID.
   * @param tokens The number of tokens to add.
   * @throws {UserNotFoundError} If the user does not exist.
   * @throws {WalletNotFoundError} If the user does not have a wallet.
   */
  public async topUpWallet(userId: string, tokens: number): Promise<void> {
    const user = await userRepository.findByPk(userId);
    if (!user) throw new Errors.UserNotFoundError({ userId });

    if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId });

    await userRepository.incrementTokens(userId, tokens);
  }
}

const userService = new UserService();

export default userService;