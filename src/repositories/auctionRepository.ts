import { Auction, AuctionStatus, type AuctionType } from "../models/Auction.ts";
import { createSequelizeError } from "../factory/errorFactory.ts";
import { Op, type CreationAttributes, type WhereOptions } from "sequelize";
import redis from "../integrations/redis.ts";

export interface AuctionFilters {
  creatorIds?: string[];
  statuses?: AuctionStatus[];
  types?: AuctionType[];
}

class AuctionRepository {
  private cacheKey(auctionId: number): string {
    return `auction:${auctionId}`;
  }

  private buildStatusWhere(status: AuctionStatus): WhereOptions {
    const now = new Date();

    switch (status) {
      case AuctionStatus.NotStarted:
        return {
          startsAt: { [Op.gt]: now },
          hasEnded: false
        };

      case AuctionStatus.InProgress:
        return {
          startsAt: { [Op.lte]: now },
          hasEnded: false,
        };

      case AuctionStatus.Ended:
        return { hasEnded: true };
    }
  }

  public async create(data: CreationAttributes<Auction>): Promise<Auction> {
    try {
      const auction = await Auction.create(data);
      await redis.set(this.cacheKey(auction.id), JSON.stringify(auction));
      return auction;
    } catch (err) {
      throw createSequelizeError(err, "createAuction");
    }
  }

  public async findByPk(auctionId: number): Promise<Auction | null> {
    const cached = await redis.get(this.cacheKey(auctionId));
    if (cached) return JSON.parse(cached) as Auction;

    return await Auction.findByPk(auctionId);
  }

  public async loadAll(): Promise<Auction[]> {
    return await Auction.findAll();
  }

  public async getFiltered(filters: AuctionFilters): Promise<Auction[]> {
    const where: any = {};

    where[Op.and] = []
    if (filters.creatorIds) {
      const or_list = []
      for (const creatorId of filters.creatorIds) {
        or_list.push({ creatorId });
      };
      where[Op.and].push({ [Op.or]: or_list })
    }
    if (filters.types) {
      const or_list = []
      for (const type of filters.types) {
        or_list.push({ type });
      };
      where[Op.and].push({ [Op.or]: or_list })
    }
    if (filters.statuses) {
      const or_list = []
      for (const status of filters.statuses) {
        or_list.push(this.buildStatusWhere(status));
      };
      where[Op.and].push({ [Op.or]: or_list })
    }

    return Auction.findAll({ where });
  }
}

const auctionRepository = new AuctionRepository();

export default auctionRepository;
