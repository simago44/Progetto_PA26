import type { Sequelize, Transaction } from "sequelize";
import { AuctionStatus, AuctionType } from "../enums/enums.ts";
import { Errors } from "../factories/errorFactory.ts";
import type { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";
import type AuctionService from "./auctionService.ts";
import type UserRepository from "../repositories/userRepository.ts";
import type BidRepository from "../repositories/bidRepository.ts";
import type AuctionRepository from "../repositories/auctionRepository.ts";
import type { AuctionFilters } from "./auctionService.ts";

interface UserServiceDeps {
  auctionRepository: AuctionRepository;
  bidRepository: BidRepository;
  userRepository: UserRepository;
  auctionService: AuctionService;
  sequelize: Sequelize;
}

class UserService {
  private auctionRepository: UserServiceDeps["auctionRepository"];
  private bidRepository: UserServiceDeps["bidRepository"];
  private userRepository: UserServiceDeps["userRepository"];
  private auctionService: UserServiceDeps["auctionService"];
  private sequelize: UserServiceDeps["sequelize"];

  constructor({ auctionRepository, bidRepository, userRepository, auctionService, sequelize }: UserServiceDeps) {
    this.auctionRepository = auctionRepository;
    this.bidRepository = bidRepository;
    this.userRepository = userRepository;
    this.auctionService = auctionService;
    this.sequelize = sequelize;
  }

  /**
   * Calculates the user's available tokens after accounting for active bids.
   * @param user The User instance.
   * @param bidAuctionId The Auction Id of the current bid being created.
   * @param transaction Sequelize transaction to be used.
   * @returns The user's available token balance.
   * @throws {WalletNotFoundError} If the user does not have a wallet.
   */
  public async getRealUserTokens(user: User, bidAuctionId: number | null = null, transaction: Transaction | null = null): Promise<number> {
    if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId: user.id });

    const openAuctions = await this.auctionService.getAuctions({ statuses: [AuctionStatus.InProgress] }, transaction);
    const bidsPerAuction = await Promise.all(
      openAuctions.map(async (auction) => {
        // If we are bidding again and the bidAuctionId == current auction
        // then we must not consider the auction in the sum (the old bid
        // will be replaced by the new bid)
        if (auction.id == bidAuctionId) return [];

        if (auction.type != AuctionType.English) return this.bidRepository.findAuctionBids(auction.id, transaction);

        // if it's an english auction, we want to get only the winning bid.
        // if the winning bid is not of the current user, we don't need to consider it
        // in the token decrement
        const winningBid = await this.auctionService.getWinningBid(auction, transaction);
        if (!winningBid || winningBid.bid.userId != user.id) return [];
        return [winningBid.bid];
      }) // already cached, per-auction
    );
    const bidsInProgessAuctions = bidsPerAuction.flat().filter(bid => bid.userId === user.id);

    // Gets the highest user bid regardless of auction type because it shouldn't know about
    // other offers (especially in sealed bid auctions)
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
    const user = await this.userRepository.findByPk(userId);
    if (user == null) throw new Errors.UserNotFoundError({ userId });

    if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId });

    return await this.getRealUserTokens(user);
  }

  /**
   * Retrieves a report of auctions matching the provided filters.
   * @param filters The auction report filters.
   * @returns A list of formatted auctions.
   */
  public async getAuctionReport(filters: Required<Pick<AuctionFilters, 'won' | 'participantId' | 'fromDate' | 'toDate'>>) {
    const user = await this.userRepository.findByPk(filters.participantId);
    if (!user) throw new Errors.UserNotFoundError({ userId: filters.participantId });

    const where = this.auctionService.buildFilters(filters);
    const auctions = await this.auctionRepository.findUserAuctions(filters.participantId, where);
    return this.auctionService.formatAuctions(auctions);
  }

  /**
   * Retrieves the total amount spent by a user on won auctions within a date range.
   * @param filters The wallet report filters.
   * @returns The total final price of won auctions.
   * @throws {UserNotFoundError} If the user does not exist.
   */
  public async getWalletReport(filters: { participantId: string, fromDate: Date, toDate: Date; }) {
    const user = await this.userRepository.findByPk(filters.participantId);
    if (!user) throw new Errors.UserNotFoundError({ userId: filters.participantId });

    const auctionFilters = {
      ...filters,
      won: true
    };
    const where = this.auctionService.buildFilters(auctionFilters);
    return await this.auctionRepository.getTotalFinalPrice(where);
  }

  /**
   * Adds tokens to a user's wallet.
   * @param userId The user ID.
   * @param tokens The number of tokens to add.
   * @throws {UserNotFoundError} If the user does not exist.
   * @throws {WalletNotFoundError} If the user does not have a wallet.
   */
  public async topUpWallet(userId: string, tokens: number): Promise<void> {
    // Transaction and lock needed to prevent other queries relative to the userId during the wallet update.
    await this.sequelize.transaction(async (t: Transaction) => {
      const user = await this.userRepository.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!user) throw new Errors.UserNotFoundError({ userId });

      if (user.tokens == null) throw new Errors.WalletNotFoundError({ userId });

      await this.userRepository.incrementTokens(userId, tokens, t);
    });
  }
}

export default UserService;