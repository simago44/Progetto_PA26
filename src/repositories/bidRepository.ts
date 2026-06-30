import type { Auction } from "../models/Auction.ts";
import { Bid } from "../models/Bid.ts";
import type { User } from "../models/User.ts";

class BidRepository {
  public async save(bid: Bid): Promise<Bid> {
    return await bid.save();
  }

  public async loadAll(): Promise<Bid[]> {
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
}

const bidRepository = new BidRepository();

export default bidRepository;
