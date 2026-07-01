import sequelize from "./sequelize.ts";
import { fakerIT as faker } from "@faker-js/faker";
import "../models/relationships.ts";
import { Auction, Bid, User } from "../models/relationships.ts";
import env, { NodeEnv } from "../config.ts";
import userRepository from "../repositories/userRepository.ts";
import { deleteStaleUsers, RoleName } from "./auth0.ts";
import logger from "../middlewares/logger.ts";
import { AuctionStatus, AuctionType } from "../models/Auction.ts";
import { getMsToEnd } from "../models/AuctionUtils.ts";
import bidRepository from "../repositories/bidRepository.ts";

const bidParticipantsLength = 0;
const bidCreatorsLength = 0;
const adminsLength = 0;

const auth0UsernameMinLength = 1;
const auth0UsernameMaxLength = 15;

const auctionsPerTypeAndStatus = 2;
const bidsNumber = 30;

function generateUsername(minLength = auth0UsernameMinLength, maxLength = auth0UsernameMaxLength): string {
  let username = faker.internet.username();
  if (username.length < minLength) {
    username += faker.string.alphanumeric(minLength - username.length);
  }
  if (username.length > maxLength) {
    username = username.slice(0, maxLength);
  }
  return username;
}

async function generateUsersArray(
  length: number,
  logString?: string,
  loggerMethod?: (_: string) => {}
): Promise<User[]> {
  const users: User[] = [];
  if (loggerMethod && logString) loggerMethod(`generating ${length} ${logString}...`);
  for (let i = 0; i < length; i++) {
    const username: string = generateUsername();
    logger.debug(`creating user with username: ${username}`);
    const user = await userRepository.create(
      username,
      "Password1@",
      RoleName.BidParticipant
    );
    users.push(user);
  }
  if (loggerMethod && logString) loggerMethod(`${length} ${logString} created`);
  return users;
}

function buildDatesForStatus(status: AuctionStatus): { startsAt: Date; endsAt: Date; } {
  const now = Date.now();

  switch (status) {
    case AuctionStatus.NotStarted:
      return {
        startsAt: new Date(now + 24 * 60 * 60 * 1000), // +1 giorno
        endsAt: new Date(now + 27 * 60 * 60 * 1000),   // +1 giorno e 3 ore
      };
    case AuctionStatus.InProgress:
      return {
        startsAt: new Date(now + 1000),                // parte subito
        endsAt: new Date(now + 24 * 60 * 60 * 1000),    // finisce tra 1 giorno
      };
    case AuctionStatus.Ended:
      return {
        startsAt: new Date(now + 1000),  // +1 secondo
        endsAt: new Date(now + 61_000),    // +61 secondi
      };
  }
}

function buildDutchParams(startsAt: Date, endsAt: Date, startPrice: number) {
  const durationMs = endsAt.getTime() - startsAt.getTime();

  const minimumPrice = faker.number.int({ min: 0, max: startPrice - 10 });

  const decrementIntervalMin = faker.number.int({ min: 1, max: 30 });
  const decrementInterval = Math.min(decrementIntervalMin * 60 * 1000, durationMs);

  const decrementsNeeded = Math.max(Math.floor(durationMs / decrementInterval), 1);

  const priceRange = startPrice - minimumPrice;
  const decrementPrice = Math.max(Math.round(priceRange / decrementsNeeded), 1);

  return { decrementPrice, decrementInterval, minimumPrice };
}

function buildEnglishAuction(creatorId: string, status: AuctionStatus) {
  const { startsAt, endsAt } = buildDatesForStatus(status);
  return {
    creatorId,
    startsAt,
    endsAt,
    type: AuctionType.English,
    startPrice: 100,
    minimumIncrement: 50,
    delayBeforeEnding: 10000,
    description: faker.commerce.productDescription()
  };
}

function buildDutchAuction(creatorId: string, status: AuctionStatus) {
  const { startsAt, endsAt } = buildDatesForStatus(status);
  const startPrice = 100;
  const { decrementPrice, decrementInterval, minimumPrice } = buildDutchParams(
    startsAt,
    endsAt,
    startPrice
  );
  logger.debug(`auction ends at: ${endsAt}`);

  return {
    creatorId,
    startsAt,
    type: AuctionType.Dutch,
    startPrice,
    decrementPrice,
    decrementInterval,
    minimumPrice,
    description: faker.commerce.productDescription()
  };
}

function buildFirstPriceAuction(creatorId: string, status: AuctionStatus) {
  const { startsAt, endsAt } = buildDatesForStatus(status);
  return {
    creatorId,
    startsAt,
    endsAt,
    type: AuctionType.FirstPrice,
    startPrice: 100,
    description: faker.commerce.productDescription()
  };
}

function buildSecondPriceAuction(creatorId: string, status: AuctionStatus) {
  const { startsAt, endsAt } = buildDatesForStatus(status);
  return {
    creatorId,
    startsAt,
    endsAt,
    type: AuctionType.SecondPrice,
    startPrice: 100,
    description: faker.commerce.productDescription()
  };
}

const auctionBuilders: Record<AuctionType, (creatorId: string, status: AuctionStatus) => any> = {
  [AuctionType.English]: buildEnglishAuction,
  [AuctionType.Dutch]: buildDutchAuction,
  [AuctionType.FirstPrice]: buildFirstPriceAuction,
  [AuctionType.SecondPrice]: buildSecondPriceAuction,
};

async function generateAuctionsArray(creatorId: string, count: number): Promise<Auction[]> {
  const auctions: Auction[] = [];
  const types = Object.values(AuctionType);
  const statuses = Object.values(AuctionStatus);

  for (const type of types) {
    for (const status of statuses) {
      for (let i = 0; i < count; i++) {
        const auction = await Auction.create(auctionBuilders[type](creatorId, status));
        if (type === AuctionType.Dutch && status === AuctionStatus.Ended) {
          auction.createBid({
            userId: "auth0|6a3fd852b4e640e31f20bbd2",
            bidPrice: auction.startPrice
          });
        }
        auctions.push(auction);
      }
    }
  }

  return auctions;
}

async function generateBidsArray(length: number = bidsNumber, auctions: Auction[]): Promise<Bid[]> {
  const bids: Bid[] = [];
  const msToEndResults = await Promise.all(
    auctions.map(a => getMsToEnd(a))
  );

  let array: Auction[] = auctions.filter((auction, index) =>
    !(auction.type === AuctionType.Dutch && msToEndResults[index]! < 0)
  );
  for (let i = 0; i < length; i++) {
    if (auctions.length <= 0) { throw new Error("auction array is empty"); };
    try {
      const auction = array[Math.floor(Math.random() * array.length)];
      const bid = Bid.build({
        userId: "auth0|6a3fd852b4e640e31f20bbd2",
        bidPrice: faker.number.int({ min: 100, max: 400 }),
        auctionId: auction?.id,
      });
      await bidRepository.create(bid);
      bids.push(bid);
      if (auction!.type === AuctionType.Dutch) {
        array = array.filter(a => a.id !== auction!.id);
      }
    } catch (err) {
      if (err instanceof Error) {
        logger.error(err.message);
        continue;
      }
    }
  }
  return bids;
}

export async function initDb() {
  if (env.NODE_ENV != NodeEnv.Development) {
    await sequelize.sync();
    return;
  }

  await sequelize.sync({ force: true });

  let auctions: Auction[] = [];

  //User creation
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

  try {
    const bidParticipants = await generateUsersArray(bidParticipantsLength, "bid participants", logger.info);
    const bidCreators = await generateUsersArray(bidCreatorsLength, "bid creators", logger.info);
    const admins = await generateUsersArray(adminsLength, "bid participants", logger.info);

  } catch (err) {
    deleteStaleUsers();
    if (err instanceof Error)
      logger.error(`user creations crashed: ${err.message}`);
    return;
  }

  try {
    auctions = await generateAuctionsArray(bidCreator.id, auctionsPerTypeAndStatus);
    logger.info(`${auctions.length} auctions created`);
  } catch (err) {
    if (err instanceof Error)
      logger.error(`auction creations crashed: ${err.message}`);
    return;
  }

  try {
    const bids = await generateBidsArray(bidsNumber, auctions);
    logger.info(`${bids.length} bids created`);
  } catch (err) {
    if (err instanceof Error)
      logger.error(`bid creations crashed: ${err.message}`);
    return;
  }

  /*const NotStarted = await Auction.create({
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), //1 giorno (24 h)
    endsAt: new Date(Date.now() + 27 * 60 * 60 * 1000), //1 giorno e 3 ore (27 h)
    creatorId: bidCreator.id,
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
  });

  const InProgress = await Auction.create({
    startsAt: new Date(Date.now() + 1000), // parte subito
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 giorno (24 h)
    creatorId: bidCreator.id,
    startPrice: 100,
    type: AuctionType.FirstPrice,
    delayBeforeEnding: 10000,
  });

  const Ended = await Auction.create({
    startsAt: new Date(Date.now() + 1000), // 1 secondo
    endsAt: new Date(Date.now() + 2000), //2 secondi
    creatorId: bidCreator.id,
    startPrice: 100,
    type: AuctionType.English,
    delayBeforeEnding: 10000,
    minimumIncrement: 50
  });

  const BidEnded1 = await Bid.create({
    auctionId: Ended.id,
    userId: bidParticipant.id,
    bidPrice: 200
  });

  const BidEnded2 = await Bid.create({
    auctionId: Ended.id,
    userId: bidParticipant.id,
    bidPrice: 300
  });*/

  await deleteStaleUsers();
}
