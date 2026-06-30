import { Op } from "sequelize";
import { Auction, AuctionStatus, type AuctionType } from "../models/Auction.ts";
import { Errors } from "../factory/errorFactory.ts";

class AuctionRepository {
  public async save(auction: Auction): Promise<Auction> {
    return await auction.save();
  }

  public async loadByPk(auctionId: string): Promise<Auction> {
    const auction = await Auction.findByPk(auctionId);
    if (!auction) throw new Errors.AuctionNotFoundError({ auctionId });

    return auction;
  }

  public async loadAll(): Promise<Auction[]> {
    return await Auction.findAll();
  }

  public async getFiltered(options: {
    creatorId?: string;
    status?: AuctionStatus;
    type?: AuctionType;
  }) {
    const now = new Date();
    const where: any = {}; //where clauses object

    if (options.creatorId) where.creatorId = options.creatorId;
    if (options.type) where.type = options.type;

    switch (options.status) {
      case AuctionStatus.NotStarted:
        where.startAt = { [Op.gt]: now };
        break;
      case AuctionStatus.InProgress:
        where.startAt = { [Op.lte]: now };
        where.hasEnded = false;
        break;
      case AuctionStatus.Ended:
        where.hasEnded = true;
        break;
    }

    return await Auction.findAll({ where });
  }
}

const auctionRepository = new AuctionRepository();

export default auctionRepository;
