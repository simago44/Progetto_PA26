import { AuctionStatus, type AuctionType, Auction } from "../models/Auction.ts";
import type { CreationAttributes } from "sequelize";
import auctionRepository, { type AuctionFilters } from "../repositories/auctionRepository.ts";
import { isNil, omit, omitBy } from "lodash-es";
import { getEndTime } from "../models/AuctionUtils.ts";

class AuctionService {
  public async getFiltered(filters: AuctionFilters) {
    return auctionRepository.getFiltered(filters);
  }

  public async createAuction(data: CreationAttributes<Auction>): Promise<Auction> {
    return auctionRepository.create(data);
  }

  public async formatAuctions(auctions: Auction[]): Promise<any[]> {
    const formattedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        let cleaned: any = auction;
        cleaned.endsAt = await getEndTime(auction);

        cleaned = omitBy(auction.dataValues, isNil);
        cleaned = omit(cleaned, ["createdAt", "updatedAt"]);

        return cleaned;
      })
    );
    return formattedAuctions;
  }
}

const service = new AuctionService();

export default service;