import { Op, Sequelize } from "sequelize";
import { createSequelizeError } from "../factory/errorFactory.ts";
import { Auction } from "../models/Auction.ts";
import { Bid } from "../models/Bid.ts";

class BidRepository {
  public async create(bid: Bid): Promise<Bid> {
    try {
      return await bid.save();
    } catch (err) {
      throw createSequelizeError(err, "createBid");
    }
  }

  public async findAll(): Promise<Bid[]> {
    return await Bid.findAll();
  }

  public async userHasBidsInAuction(auctionId: number, userId: string): Promise<boolean> {
    const bid = await Bid.findOne({
      where: {
        userId: userId,
        auctionId: auctionId
      }
    });

    return bid != null;
  }

  public async auctionHasBids(auctionId: number): Promise<boolean> {
    const bid = await Bid.findOne({
      where: {
        auctionId: auctionId
      }
    });

    return bid != null;
  }

  public async findAuctionBids(auctionId: number): Promise<Bid[]> {
    const bids = await Bid.findAll({
      where: {
        auctionId: auctionId
      }
    });

    return bids;
  }

  public async getUserBidsOfInProgessAuctions(userId: string): Promise<Bid[]> {
    const bids = await Bid.findAll({
      where: { userId },
      include: [{
        model: Auction,
        required: true,
        where: { hasEnded: false }
      }]
    });

    return bids;
  }
}

const bidRepository = new BidRepository();

export default bidRepository;
