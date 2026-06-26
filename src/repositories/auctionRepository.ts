import { Auction } from "../models/Auction.ts";
import type { Repository } from "./repository.ts";

class AuctionRepository implements Repository<Auction>{
  public save(auction: Auction): Auction {
    //TODO
    return auction;
  }
  public loadByPk(auctionId: string): Auction{
    //TODO
    return new Auction();
  }
  public loadAll(): Auction[] {
    //TODO
    return [new Auction()];
  }
  public update(auction: Auction): Auction{
    //TODO
    return auction;
  }
  public delete(auction: Auction): Auction {
    //TODO
    return auction;
  }
}

const auctionRepository = new AuctionRepository();

export default auctionRepository;