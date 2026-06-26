import sequelize from './sequelize.ts';

import '../models/relationships.ts';
import { Auction, Bid, User } from '../models/relationships.ts';
import { AuctionType } from '../models/Auction.ts';
import { createCloseAuctionJob } from './BullMQ.ts';

export async function initDb() {
  await sequelize.sync({ force: true });
  //await sequelize.sync();

  await User.create({
    id: "auth0|6a3ebbbdb8c407b90132c603",
    username: "admin"
  });

  await User.create({
    id: "auth0|6a3ebb7f62ab40a31fbd9546",
    username: "bid-creator"
  });

  await User.create({
    id: "auth0|6a3ebbd4d8fdb3551fb57f8f",
    username: "bid-participant"
  });

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
