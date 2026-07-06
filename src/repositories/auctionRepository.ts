import { Auction } from "../models/Auction.ts";
import { createSequelizeError } from "../factory/errorFactory.ts";
import { col, fn, Transaction, type CreationAttributes, type WhereOptions } from "sequelize";
import redis from "../integrations/redis.ts";
import type { AuctionType } from "../enums/enums.ts";

class AuctionRepository {
  private idKey(auctionId: number): string {
    return `auction:${auctionId}`;
  }

  public build(attributes: CreationAttributes<Auction>): Auction {
    try {
      return Auction.build(attributes);
    } catch (err) {
      throw createSequelizeError(err, "buildAuction");
    }
  }

  public async save(auction: Auction): Promise<Auction> {
    try {
      const created_auction = await auction.save();
      await redis.set(this.idKey(auction.id), JSON.stringify(created_auction));
      return auction;
    } catch (err) {
      throw createSequelizeError(err, "createAuction");
    }
  }

  public async create(auctionAttributes: CreationAttributes<Auction>): Promise<Auction> {
    let auction = this.build(auctionAttributes);
    auction = await this.save(auction);
    return auction;
  }

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

  public async findAll(): Promise<Auction[]> {
    return await Auction.findAll();
  }

  public async getFiltered(where: WhereOptions): Promise<Auction[]> {
    return Auction.findAll({ where });
  }

  public async getUserAuctions(userId: string, where: WhereOptions): Promise<Auction[]> {
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

  public async getTotalFinalPrice(where: WhereOptions): Promise<number> {
    return await Auction.sum('finalPrice', { where }) ?? 0;
  }

  public async getParticipantsPerAuction(where: WhereOptions): Promise<{ type: AuctionType, participantCount: number }[]> {
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
