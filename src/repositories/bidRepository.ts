import type { RedisClientType } from "redis";
import { createSequelizeError } from "../factory/errorFactory.ts";
import { Bid } from "../models/Bid.ts";
import type { CreationAttributes, Transaction } from "sequelize";

interface BidRepositoryDeps {
  redis: RedisClientType;
}

class BidRepository {
  private redis: BidRepositoryDeps["redis"];

  constructor({ redis }: BidRepositoryDeps) {
    this.redis = redis;
  }

  /**
   * 
   * Builds the Redis key for an auction's bids.
   * @param auctionId The auction ID.
   * @returns The Redis key for the auction's bids.
   */
  private auctionBidsKey(auctionId: number): string {
    return `auction:${auctionId}:bids`;
  }

  /**
   * Retrieves cached bids for a given auction from Redis.
   * @param auctionId The auction ID.
   * @returns A list of cached Bid instances, or `null` if no cache exists.
   */
  private async getCachedBids(auctionId: number): Promise<Bid[] | null> {
    const cached = await this.redis.get(this.auctionBidsKey(auctionId));
    if (cached == null) return null;

    const bids = [];
    for (const bid of JSON.parse(cached)) {
      const builtBid = Bid.build(bid);
      // necessary to save it without errors on unique id
      // we can't use bulkBuild option isNewRecord because it erases createdAt and other fields 
      builtBid.isNewRecord = false;
      bids.push(builtBid);
    }
    return bids;
  }

  /**
   * Builds a Bid instance from creation attributes.
   * @param attributes The attributes required to construct a Bid.
   * @returns The built Bid instance.
   */
  public build(attributes: CreationAttributes<Bid>): Bid {
    try {
      return Bid.build(attributes);
    } catch (err) {
      throw createSequelizeError(err, "buildBid");
    }
  }

  /**
   * Persists a Bid and updates the cache.
   * @param auction The Bid instance to persist.
   * @param transaction Optional Sequelize transaction.
   * @returns The saved Bid instance.
   */
  public async save(bid: Bid, transaction: Transaction | null = null): Promise<Bid> {
    try {
      const created_bid = await bid.save({ transaction });

      // we invalidate cache for the auction
      await this.redis.del(this.auctionBidsKey(created_bid.auctionId));
      return created_bid;
    } catch (err) {
      throw createSequelizeError(err, "createBid");
    }
  }

  /**
   * Creates and persists a Bid from attributes.
   * @param attributes Bid creation attributes.
   * @returns The created Bid instance.
   */
  public async create(bidAttributes: CreationAttributes<Bid>): Promise<Bid> {
    let bid = this.build(bidAttributes);
    bid = await this.save(bid);
    return bid;
  }

  /**
   * Finds all bids from the database.
   * @returns A list of all Bid instances.
   */
  public async findAll(): Promise<Bid[]> {
    return await Bid.findAll();
  }

  /**
   * Finds all bids for a specific auction.
   * @param auctionId The auction ID.
   * @param transaction Optional Sequelize transaction.
   * @returns List of Bid instances for the auction.
   */
  public async findAuctionBids(auctionId: number, transaction: Transaction | null = null): Promise<Bid[]> {
    const cached_bids = await this.getCachedBids(auctionId);
    if (cached_bids) return cached_bids;

    const bids = await Bid.findAll({ where: { auctionId }, transaction });
    if (!transaction) await this.redis.set(this.auctionBidsKey(auctionId), JSON.stringify(bids));
    else await this.redis.del(this.auctionBidsKey(auctionId));
    return bids;
  }

  /**
   * Checks whether a user has placed any bids in an auction.
   * @param auctionId The auction ID.
   * @param userId The user ID.
   * @param transaction Optional Sequelize transaction.
   * @returns `true` if the user has at least one bid in the auction, `false` otherwise.
   */
  public async userHasBidsInAuction(auctionId: number, userId: string, transaction: Transaction | null = null): Promise<boolean> {
    const bids = await this.findAuctionBids(auctionId, transaction);
    return bids.some(b => b.userId === userId);
  }

  /**
   * Checks whether an auction has any bids.
   * @param auctionId The auction ID.
   * @returns `true` if the auction has at least one bid, `false` otherwise.
   */
  public async auctionHasBids(auctionId: number, transaction: Transaction | null = null): Promise<boolean> {
    const bids = await this.findAuctionBids(auctionId, transaction);
    return bids.length > 0;
  }
}

export default BidRepository;
