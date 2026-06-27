import { SequelizeMethod } from "sequelize/lib/utils";
import type { Auction } from "../models/Auction.ts";
import { DatabaseError } from "sequelize";
import { createError, ErrorEnum } from "../factory/errorFactory.ts";
import sequelize from "../services/sequelize.ts";

class AuctionRepository {
  public async save(auction: Auction): Promise<Auction> {
    return await auction.save();
  }
}

const auctionRepository = new AuctionRepository();

export default auctionRepository;
