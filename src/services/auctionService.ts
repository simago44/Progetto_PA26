import { AuctionStatus, type AuctionType, Auction } from "../models/Auction.ts";
import type { CreationAttributes } from "sequelize";
import auctionRepository, { type AuctionFilters } from "../repositories/auctionRepository.ts";

class AuctionService {
  public async getFiltered(filters: AuctionFilters) {
    return auctionRepository.getFiltered(filters);
  }

  public async createAuction(data: CreationAttributes<Auction>): Promise<Auction> {
    return auctionRepository.create(data);
  }
}

const service = new AuctionService();

export default service;