import sequelize from './sequelize.ts';

import '../models/relationships.ts';
import { Auction, Bid, User } from '../models/relationships.ts';
import { AuctionType } from '../models/AuctionUtils.ts';
import { createCloseAuctionJob } from './BullMQ.ts';
import logger from '../middlewares/logger.ts';

export async function initDb() {
  await sequelize.sync({ force: true });
  //await sequelize.sync();

  /*
  await User.create({
    id: "id",
    username: "username"
  })
    */ 

  /*
  const newAuction = await Auction.create({
    startAt: new Date(Date.now()+50),
    endAt: new Date(Date.now()+5000),
    creatorId: "id",
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
    
  })
  
  await createCloseAuctionJob(newAuction);

  await Bid.create({
    userId: "id",
    auctionId: newAuction.id,
    bidPrice: 100
  })
    */
}
