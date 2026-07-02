import { Auction } from "../models/Auction.ts";
import { createSequelizeError } from "../factory/errorFactory.ts";
import { Op, Transaction, type CreationAttributes, type WhereOptions } from "sequelize";
import redis from "../integrations/redis.ts";
import { AuctionStatus, type AuctionType } from "../enums/enums.ts";

export interface AuctionFilters {
  creatorIds?: string[];
  statuses?: AuctionStatus[];
  types?: AuctionType[];
}

class AuctionRepository {
  private idKey(auctionId: number): string {
    return `auction:${auctionId}`;
  }

  private buildStatusWhere(status: AuctionStatus): WhereOptions {
    const now = new Date();

    switch (status) {
      case AuctionStatus.NotStarted:
        return {
          startsAt: { [Op.gt]: now },
          endedAt: null
        };

      case AuctionStatus.InProgress:
        return {
          startsAt: { [Op.lte]: now },
          endedAt: null
        };

      case AuctionStatus.Ended:
        return { endedAt: { [Op.ne]: null } };
    }
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
    if (cached) return Auction.build(JSON.parse(cached));

    const auction = await Auction.findByPk(auctionId);
    if (auction) await redis.set(this.idKey(auction.id), JSON.stringify(auction));
    return auction;
  }

  public async findAll(): Promise<Auction[]> {
    return await Auction.findAll();
  }

  public async getFiltered(filters: AuctionFilters): Promise<Auction[]> {
    const where: any = {};
    where[Op.and] = [];
    if (filters.creatorIds) {
      where[Op.and].push({ creatorId: { [Op.in]: filters.creatorIds } });
    }
    if (filters.types) {
      where[Op.and].push({ type: { [Op.in]: filters.types } });
    }
    if (filters.statuses) {
      const or_list = filters.statuses.map(s => this.buildStatusWhere(s));
      where[Op.and].push({ [Op.or]: or_list });
    }
    return Auction.findAll({ where });
  }

  public async closeAuction(auctionId: number, winningBid: { winnerId: string, finalPrice: number } | null, transaction?: Transaction): Promise<void> {
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
