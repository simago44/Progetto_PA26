import sequelize from "./sequelize.ts";

import "../models/relationships.ts";
import { Auction, Bid, User } from "../models/relationships.ts";
import { AuctionType } from "../models/Auction.ts";
import { createCloseAuctionJob } from "./BullMQ.ts";

export async function initDb() {
  await sequelize.sync({ force: true });
  //await sequelize.sync();

  await User.create({
    id: "auth0|6a3ebbbdb8c407b90132c603",
    username: "admin",
  });

  await User.create({
    id: "auth0|6a3ebb7f62ab40a31fbd9546",
    username: "bid-creator",
  });

  await User.create({
    id: "auth0|6a3ebbd4d8fdb3551fb57f8f",
    username: "bid-participant",
  });

  const NotStarted = await Auction.create({
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), //1 giorno (24 h)
    endAt: new Date(Date.now() + 27 * 60 * 60 * 1000), //1 giorno e 3 ore (27 h)
    creatorId: "auth0|6a3ebb7f62ab40a31fbd9546",
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
  });

  const InProgress = await Auction.create({
    startAt: new Date(Date.now() + 1000), // parte subito
    endAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 giorno (24 h)
    creatorId: "auth0|6a3ebb7f62ab40a31fbd9546",
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
  });

  const Ended = await Auction.create({
    startAt: new Date(Date.now() + 1000), // 1 secondo
    endAt: new Date(Date.now() + 2000), //2 secondi
    creatorId: "auth0|6a3ebb7f62ab40a31fbd9546",
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
  });

  await createCloseAuctionJob(NotStarted);
  await createCloseAuctionJob(InProgress);
  await createCloseAuctionJob(Ended);

  /*
  
  

  await Bid.create({
    userId: "id",
    auctionId: newAuction.id,
    bidPrice: 100
  })
    */
}
