import sequelize from "./sequelize.ts";

import "../models/relationships.ts";
import { Auction, Bid, User } from "../models/relationships.ts";
import { AuctionType } from "../models/Auction.ts";
import { deleteStaleUsers } from "./auth0.ts";
import env, { NodeEnv } from "../config.ts";

export async function initDb() {
  if (env.NODE_ENV != NodeEnv.Development) {
    await sequelize.sync();
    return;
  }

  await sequelize.sync({ force: true });

  const admin = await User.create({
    id: "auth0|6a3fd812dbd594d590a92367",
    username: "admin",
  });

  const bidCreator = await User.create({
    id: "auth0|6a3fd835b4e640e31f20bbc4",
    username: "bid-creator",
  });

  const bidParticipant = await User.create({
    id: "auth0|6a3fd852b4e640e31f20bbd2",
    username: "bid-participant",
  });

  const NotStarted = await Auction.create({
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), //1 giorno (24 h)
    endAt: new Date(Date.now() + 27 * 60 * 60 * 1000), //1 giorno e 3 ore (27 h)
    creatorId: bidCreator.id,
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
  });

  const InProgress = await Auction.create({
    startAt: new Date(Date.now() + 1000), // parte subito
    endAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 giorno (24 h)
    creatorId: bidCreator.id,
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
  });

  const Ended = await Auction.create({
    startAt: new Date(Date.now() + 1000), // 1 secondo
    endAt: new Date(Date.now() + 2000), //2 secondi
    creatorId: bidCreator.id,
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
  });
  
  await deleteStaleUsers();
}
