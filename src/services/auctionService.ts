import { AuctionStatus, type AuctionType, Auction } from "../models/Auction.ts";
import { Op, type CreationAttributes } from "sequelize";
import auctionRepository, { type AuctionFilters } from "../repositories/auctionRepository.ts";

class AuctionService {
  public async getFiltered(options: {
    creatorId?: string;
    status?: AuctionStatus;
    type?: AuctionType;
  }) {
    const now = new Date();
    const filters: AuctionFilters = {};
    if (options.creatorId) filters.creatorId = options.creatorId;
    if (options.type) filters.type = options.type;

    switch (options.status) {
      case AuctionStatus.NotStarted:
        filters.startsAfter = now;
        break;
      case AuctionStatus.InProgress:
        filters.startsBefore = now;
        filters.hasEnded = false;
        break;
      case AuctionStatus.Ended:
        filters.hasEnded = true;
        break;
    }

    return auctionRepository.getFiltered(filters);
  }

  public async createAuction(data: CreationAttributes<Auction>): Promise<Auction> {
    return auctionRepository.create(data);
  }
}

const service = new AuctionService();

export default service;