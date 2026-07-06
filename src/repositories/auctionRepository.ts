import { Auction } from "../models/Auction.ts";
import { createSequelizeError } from "../factory/errorFactory.ts";
import { col, fn, Transaction, type CreationAttributes, type WhereOptions } from "sequelize";
import redis from "../integrations/redis.ts";
import type { AuctionType } from "../enums/enums.ts";

class AuctionRepository {
  /**
   * Builds the Redis key for an auction.
   * @param auctionId The auction ID.
   * @returns The Redis key for the auction.
   */
  private idKey(auctionId: number): string {
    return `auction:${auctionId}`;
  }

  /**
   * Builds an Auction instance from creation attributes.
   * @param attributes The attributes required to construct an Auction.
   * @returns The built Auction instance.
   */
  public build(attributes: CreationAttributes<Auction>): Auction {
    try {
      return Auction.build(attributes);
    } catch (err) {
      throw createSequelizeError(err, "buildAuction");
    }
  }

  /**
   * Persists an Auction and updates the cache.
   * @param auction The Auction instance to persist.
   * @returns The saved Auction instance.
   */
  public async save(auction: Auction): Promise<Auction> {
    try {
      const created_auction = await auction.save();
      await redis.set(this.idKey(auction.id), JSON.stringify(created_auction));
      return auction;
    } catch (err) {
      throw createSequelizeError(err, "createAuction");
    }
  }

  /**
   * Creates and persists an Auction from attributes.
   * @param attributes Auction creation attributes.
   * @returns The created Auction instance.
   */
  public async create(attributes: CreationAttributes<Auction>): Promise<Auction> {
    let auction = this.build(attributes);
    auction = await this.save(auction);
    return auction;
  }

  /**
   * Finds an Auction by its primary key (cache-first).
   * @param auctionId The auction ID.
   * @returns The Auction if found, `null` otherwise.
   */
  public async findByPk(auctionId: number): Promise<Auction | null> {
    const cached = await redis.get(this.idKey(auctionId));
    if (cached) {
      const auction = Auction.build(JSON.parse(cached));
      // necessary to save it without errors on unique id
      // we can't use build option isNewRecord because it erases createdAt and other fields 
      auction.isNewRecord = false;
      return auction;
    }

    const auction = await Auction.findByPk(auctionId);
    if (auction) await redis.set(this.idKey(auction.id), JSON.stringify(auction));
    return auction;
  }

  /**
   * Finds auctions matching optional filters.
   * @param where Optional Sequelize filters.
   * @returns List of matching auctions.
   */
  public async findAll(where: WhereOptions = {}): Promise<Auction[]> {
    return Auction.findAll({ where });
  }

  /**
   * Finds auctions where a user has participated.
   * @param userId The user ID.
   * @param where Optional Sequelize filters.
   * @returns List of auctions the user participated in.
   */
  public async findUserAuctions(userId: string, where: WhereOptions = {}): Promise<Auction[]> {
    return Auction.findAll({
      where,
      include: [
        {
          association: Auction.associations.bids,
          where: { userId },
          required: true,
          attributes: [],
        },
      ],
      group: ['Auction.id'],
    });
  }

  /**
   * Computes the total final price of auctions matching filters.
   * @param where Optional Sequelize filters.
   * @returns Sum of final prices (0 if none).
   */
  public async getTotalFinalPrice(where: WhereOptions = {}): Promise<number> {
    return await Auction.sum('finalPrice', { where }) ?? 0;
  }

  /**
   * Computes number of distinct participants per auction type.
   * @param where Optional Sequelize filters.
   * @returns List of { type, participantCount }.
   */
  public async getParticipantsPerAuction(where: WhereOptions = {}): Promise<{ type: AuctionType, participantCount: number }[]> {
    const participantsPerAuction = await Auction.findAll({
      where,
      attributes: [
        'type',
        [fn('COUNT', fn('DISTINCT', col('bids.userId'))), 'participantCount'],
      ],
      include: [
        {
          association: Auction.associations.bids,
          attributes: [],
          required: false,
        },
      ],
      group: ['Auction.id'],
      raw: true,
    }) as unknown as { type: AuctionType, participantCount: number }[];

    return participantsPerAuction;
  }

  /**
   * Closes an auction and clears its cache entry.
   * @param auctionId The auction ID.
   * @param winningBid Winning bid data or `null` if none.
   * @param transaction Optional Sequelize transaction.
   */
  public async closeAuction(auctionId: number, winningBid: { winnerId: string, finalPrice: number; } | null, transaction?: Transaction): Promise<void> {
    try {
      await Auction.update(
        { endedAt: new Date(), winnerId: winningBid?.winnerId ?? null, finalPrice: winningBid?.finalPrice ?? null },
        { where: { id: auctionId }, transaction: transaction ?? null },
      );
    } catch (err) {
      throw createSequelizeError(err, "closeAuction");
    }

    await redis.del(this.idKey(auctionId));
  }
}

const auctionRepository = new AuctionRepository();

export default auctionRepository;
