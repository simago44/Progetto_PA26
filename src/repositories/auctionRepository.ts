import { Auction, type AuctionType } from "../models/Auction.ts";
import { Errors } from "../factory/errorFactory.ts";
import { Op, type CreationAttributes } from "sequelize";

export interface AuctionFilters {
  creatorId?: string;
  type?: AuctionType;
  startsAfter?: Date;
  startsBefore?: Date;
  hasEnded?: boolean;
}

class AuctionRepository {
  public async create(data: CreationAttributes<Auction>): Promise<Auction> {
    return await Auction.create(data);
  }

  public async loadByPk(auctionId: string): Promise<Auction> {
    const auction = await Auction.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    return auction;
  }

  public async loadAll(): Promise<Auction[]> {
    return await Auction.findAll();
  }

  public async getFiltered(filters: AuctionFilters): Promise<Auction[]> {
    const where: any = {};

    if (filters.creatorId) where.creatorId = filters.creatorId;
    if (filters.type) where.type = filters.type;
    if (filters.startsAfter) where.startAt = { [Op.gt]: filters.startsAfter };
    if (filters.startsBefore) where.startAt = { [Op.lte]: filters.startsBefore };
    if (filters.hasEnded !== undefined) where.hasEnded = filters.hasEnded;

    return Auction.findAll({ where });
  }
}

const auctionRepository = new AuctionRepository();

export default auctionRepository;
