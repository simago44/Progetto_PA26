import { Bid } from "../models/Bid.ts";

class AuctionRepository {
  public async save(bid: Bid): Promise<Bid> {
    return await bid.save();
  }

  public async loadAll(): Promise<Bid[]> {
    return await Bid.findAll();
  }
}

const bidRepository = new AuctionRepository();

export default bidRepository;
