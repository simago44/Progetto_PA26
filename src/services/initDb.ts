import sequelize from './sequelize.ts';

import '../models/relationships.ts';
import { Auction, Bid, User } from '../models/relationships.ts';
import { AuctionType } from '../models/AuctionUtils.ts';

export async function initDb() {
  await sequelize.sync({ force: true });
  /*
  User.create({
    id: "id",
    username: "username"
  })
  const newAuction = Auction.create({
    startAt: new Date(Date.now()+50),
    endAt: new Date(Date.now()+100),
    creatorId: "id",
    startPrice: 100,
    type: AuctionType.English
  })

  Bid.create({
    userId: "id",
    auctionId: (await newAuction).id,
    bidPrice: 100
  })
  */
}
