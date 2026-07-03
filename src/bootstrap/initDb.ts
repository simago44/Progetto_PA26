import sequelize from "../integrations/sequelize.ts";
import { fakerIT as faker } from "@faker-js/faker";
import "../models/relationships.ts";
import { Auction, Bid, User } from "../models/relationships.ts";
import env, { NodeEnv } from "../core/config.ts";
import userRepository from "../repositories/userRepository.ts";
import { deleteStaleUsers } from "../integrations/auth0.ts";
import logger from "../core/logger.ts";
import bidRepository from "../repositories/bidRepository.ts";
import { addInterval, HOURS, MINUTES, SECONDS, tomorrow } from "../utils/dateUtils.ts";
import auctionService from "../services/auctionService.ts";
import auctionRepository from "../repositories/auctionRepository.ts";
import { AuctionStatus, AuctionType, NewUserTokens, RoleName } from "../enums/enums.ts";

const bidParticipantsLength = 0;
const bidCreatorsLength = 0;
const adminsLength = 0;

const auth0UsernameMinLength = 1;
const auth0UsernameMaxLength = 15;

const auctionsPerTypeAndStatus = 20;
const bidsNumber = 600;

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
  switch (status) {
    case AuctionStatus.NotStarted:
      const startDate = addInterval(new Date(), 24 * HOURS);
      const startsAt = faker.date.between({ from: startDate, to: new Date(startDate.getTime() + 10 * HOURS) });
      const endsAt = addInterval(startsAt, faker.number.float({ min: 3, max: 7 }) * HOURS);
      return {
        startsAt, // starts tomorrow
        endsAt, // ends after 3-7 hours from start
      };
    case AuctionStatus.InProgress:
      return {
        startsAt: addInterval(new Date(), 1 * SECONDS), // starts in 1 second
        endsAt: faker.date.between({ from: tomorrow(), to: addInterval(tomorrow(), 10 * HOURS) }), // ends tomorrow
      };
    case AuctionStatus.Ended:
      return {
        startsAt: addInterval(new Date(), 1 * SECONDS), // starts in 1 second
        endsAt: addInterval(new Date(), 1 * MINUTES + 1 * SECONDS), // ends in 1 minute
      };
  }
}

function buildDutchParams(startsAt: Date, endsAt: Date, startPrice: number) {
  const durationMs = endsAt.getTime() - startsAt.getTime();

  const reservePrice = faker.number.int({ min: 1, max: startPrice - 10 });

  const decrementIntervalMin = faker.number.int({ min: 1, max: 30 });
  const decrementInterval = Math.min(decrementIntervalMin * 60 * 1000, durationMs);

  const decrementsNeeded = Math.max(Math.floor(durationMs / decrementInterval), 1);

  const priceRange = startPrice - reservePrice;
  const decrementPrice = Math.max(Math.round(priceRange / decrementsNeeded), 1);

  return { decrementPrice, decrementInterval, reservePrice };
}

function buildEnglishAuction(creatorId: string, status: AuctionStatus) {
  const { startsAt, endsAt } = buildDatesForStatus(status);
  return {
    creatorId,
    startsAt,
    endsAt,
    type: AuctionType.English,
    reservePrice: 100,
    minimumIncrement: 50,
    delayBeforeEnding: 10000,
    description: faker.commerce.productDescription()
  };
}

function buildDutchAuction(creatorId: string, status: AuctionStatus) {
  const { startsAt, endsAt } = buildDatesForStatus(status);
  const startPrice = 100;
  const { decrementPrice, decrementInterval, reservePrice } = buildDutchParams(startsAt, endsAt, startPrice);

  return {
    creatorId,
    startsAt,
    type: AuctionType.Dutch,
    reservePrice,
    decrementPrice,
    decrementInterval,
    startPrice,
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
    reservePrice: 100,
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
    reservePrice: 100,
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
        const auction = await auctionRepository.create(auctionBuilders[type](creatorId, status));
        if (type === AuctionType.Dutch && status === AuctionStatus.Ended) {
          bidRepository.create({
            userId: "auth0|6a3fd852b4e640e31f20bbd2",
            auctionId: auction.id,
            bidPrice: auction.reservePrice
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
    auctions.map(a => auctionService.getMsToEnd(a))
  );

  let array: Auction[] = auctions.filter((auction, index) =>
    !(auction.type === AuctionType.Dutch && msToEndResults[index]! < 0)
  );
  for (let i = 0; i < length; i++) {
    if (auctions.length <= 0) { throw new Error("auction array is empty"); };
    try {
      const auction = array[Math.floor(Math.random() * array.length)];
      const bid = await bidRepository.create({
        userId: "auth0|6a3fd852b4e640e31f20bbd2",
        bidPrice: faker.number.int({ min: 100, max: 400 }),
        auctionId: auction?.id,
      });
      bids.push(bid);
      //only english auctions can get more than one bids for every users.
      //We are making bids from only bid participant user.
      if (auction && auction.type !== AuctionType.English) {
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
    tokens: NewUserTokens[RoleName.Admin]
  });

  const bidCreator = await User.create({
    id: "auth0|6a3fd835b4e640e31f20bbc4",
    username: "bid-creator",
    tokens: NewUserTokens[RoleName.BidCreator]
  });

  const bidParticipant = await User.create({
    id: "auth0|6a3fd852b4e640e31f20bbd2",
    username: "bid-participant",
    tokens: NewUserTokens[RoleName.BidParticipant]
  });

  try {
    const bidParticipants = await generateUsersArray(bidParticipantsLength, "bid participants", logger.info);
    const bidCreators = await generateUsersArray(bidCreatorsLength, "bid creators", logger.info);
    const admins = await generateUsersArray(adminsLength, "bid participants", logger.info);

  } catch (err) {
    deleteStaleUsers();
    if (err instanceof Error)
      logger.error(`user creations crashed: ${err.message}`);
  }

  auctions = await generateAuctionsArray(bidCreator.id, auctionsPerTypeAndStatus);
  logger.info(`${auctions.length} auctions created`);

  try {
    const bids = await generateBidsArray(bidsNumber, auctions);
    logger.info(`${bids.length} bids created`);
  } catch (err) {
    if (err instanceof Error)
      logger.error(`bid creations crashed: ${err.message}`);
  }

  await deleteStaleUsers();
}
