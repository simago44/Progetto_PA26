import logger from "../core/logger.ts";
import { AuctionStatus, AuctionType, NewUserTokens, RoleName } from "../enums/enums.ts";
import { createInternalServerError, createSequelizeError } from "../factory/errorFactory.ts";
import type { User } from "../models/User.ts";
import env from "../core/config.ts";
import sequelize from "../integrations/sequelize.ts";
import "../models/relationships.ts";
import { fakerIT as faker } from "@faker-js/faker";
import { AuctionConstants } from "../constants/constants.ts";
import type { CreationAttributes } from "sequelize";
import { Auction } from "../models/Auction.ts";
import { addInterval, HOURS, MINUTES, SECONDS, tomorrow } from "../utils/dateUtils.ts";
import z from "zod";
import { readFileSync } from "node:fs";
import { clearRedis } from "../integrations/redis.ts";
import { initBullMQ } from "../integrations/BullMQ.ts";
import container from "../core/container.ts";
import type UserRepository from "../repositories/userRepository.ts";
import type AuctionService from "../services/auctionService.ts";
import type BidService from "../services/bidService.ts";

const MIN_AUCTIONS = 5;
const MAX_AUCTIONS = 20;

const MIN_BIDS = 5;
const MAX_BIDS = 20;

const auctionService = container.resolve<AuctionService>("auctionService");
const bidService = container.resolve<BidService>("bidService");
const userRepository = container.resolve<UserRepository>("userRepository");

const SeedUserSchema = z.object({
  userId: z.string(),
  username: z.string(),
  role: z.enum(RoleName),
});
const UsersSeedSchema = z.array(SeedUserSchema);

function loadUsersByRole(path: string): Record<RoleName, { userId: string; username: string; }[]> {
  const raw = readFileSync(path, "utf-8");
  const users = UsersSeedSchema.parse(JSON.parse(raw));

  const usersByRole = Object.fromEntries(
    Object.values(RoleName).map(
      (role): [RoleName, { userId: string; username: string; }[]] => [role, []]
    )
  ) as Record<RoleName, { userId: string; username: string; }[]>;

  for (const { userId, username, role } of users) {
    usersByRole[role].push({ userId, username });
  }

  return usersByRole;
}

export async function generateUsersArray(
  usersByRole: Record<RoleName, { userId: string, username: string; }[]>,
  role: RoleName
) {
  const array: User[] = [];
  for (const userData of usersByRole[role]) {
    try {
      let tokens = NewUserTokens[role];
      if (role == RoleName.AuctionParticipant && userData.username != 'auction-participant') tokens = 100000;
      array.push(await userRepository.create({ ...userData, tokens }));
    } catch (err) {
      logger.error(createSequelizeError(err, `generateUsersArray`).stack);
      continue;
    }
  }
  return array;
}

function computeDatesForStatus(
  status: AuctionStatus
): { startsAt: Date; endsAt: Date; } {
  const yesterdayDate = faker.date.between({ from: addInterval(new Date(), -10 * 24 * HOURS), to: addInterval(new Date(), - 10 * MINUTES) });
  const tomorrowDate = faker.date.between({ from: tomorrow(), to: addInterval(tomorrow(), 10 * HOURS) });
  const tomorrowDate2 = addInterval(tomorrowDate, faker.number.int({ min: 3, max: 10 }) * HOURS);
  // we give 20 seconds to put some bids
  const endedEndsAt = addInterval(new Date(), 20 * SECONDS);

  switch (status) {
    case AuctionStatus.NotStarted:
      return { startsAt: tomorrowDate, endsAt: tomorrowDate2 };
    case AuctionStatus.InProgress:
      return { startsAt: yesterdayDate, endsAt: tomorrowDate2 };
    case AuctionStatus.Ended:
      return { startsAt: yesterdayDate, endsAt: endedEndsAt };
  }
}

function computeDutchParams(status: AuctionStatus, reservePrice: number): {
  startsAt: Date;
  reservePrice: number;
  startPrice: number;
  decrementPrice: number;
  decrementInterval: number;
} {
  const { startsAt, endsAt } = computeDatesForStatus(status);

  //duration minima 1 minuto
  const duration = Math.max(endsAt.getTime() - startsAt.getTime(), 1 * MINUTES);

  //maximum steps 1 for seconds
  const totalSteps = faker.number.int({ min: 1, max: duration / MINUTES });
  const decrementInterval = Math.floor(duration / totalSteps);
  const decrementPrice = faker.number.int({ min: 1, max: 10 });
  const startPrice = reservePrice + decrementPrice * totalSteps;

  return { startsAt, reservePrice, startPrice, decrementPrice, decrementInterval };
}

export async function generateAuctionsArray(min_auctions: number, max_auctions: number, creatorsArray: User[]) {
  const types = Object.values(AuctionType);
  const statuses = Object.values(AuctionStatus);
  const promises: Promise<Auction>[] = [];

  for (const type of types) {
    for (const status of statuses) {
      const length = faker.number.int({ min: min_auctions, max: max_auctions });
      for (let i = 0; i < length; i++) {
        const index = faker.number.int({ min: 0, max: creatorsArray.length - 1 });
        if (!creatorsArray[index]) throw createInternalServerError("Invalid value for creatorId");

        const creatorId = creatorsArray[index].id;
        const reservePrice = faker.number.int({
          min: AuctionConstants.minReservePrice,
          max: AuctionConstants.minReservePrice + 3000,
        });

        const basePayload = {
          creatorId,
          description: faker.commerce.productDescription(),
          type,
          reservePrice
        };

        let payload: CreationAttributes<Auction>;

        switch (type) {
          case AuctionType.English:
            payload = {
              ...basePayload,
              ...computeDatesForStatus(status),
              minimumIncrement: faker.number.int({ min: 1, max: 10 }),
              delayBeforeEnding: AuctionConstants.defaultDelayBeforeEnding
            };
            break;

          case AuctionType.Dutch: {
            payload = {
              ...basePayload,
              ...computeDutchParams(status, reservePrice),
            };
            break;
          }

          case AuctionType.FirstPrice:
          case AuctionType.SecondPrice:
          default:
            payload = {
              ...basePayload,
              ...computeDatesForStatus(status),
            };
            break;
        }

        promises.push(auctionService.createAuction(payload));
      }
    }
  }

  return Promise.all(promises);
}

export async function generateBidsArray(min_bids: number, max_bids: number, auctions: Auction[], participantsArray: User[]) {
  const promises: Promise<unknown>[] = [];

  // we shuffle the array because we want that every type/status of auction have the
  // same probability of getting a bid (maybe the user tokens can finish)
  const shuffledAuctions = [...auctions].sort(() => Math.random() - 0.5);
  for (const rawAuction of shuffledAuctions) {
    const auction = auctionService.toTypedAuction(rawAuction);
    // can't bid, the auction isn't started
    if (auction.startsAt > new Date()) continue;

    const length = faker.number.int({ min: min_bids, max: max_bids });

    switch (auction.type) {
      case AuctionType.English: {
        const promise_fun = async () => {
          let currentBidPrice = await auctionService.getEnglishCurrentBidPrice(auction);
          for (let i = 0; i < length; i++) {
            const index = faker.number.int({ min: 0, max: participantsArray.length - 1 });
            if (!participantsArray[index]) throw createInternalServerError("Invalid value for participantId");
            const participant = participantsArray[index];

            const increment = faker.number.int({ min: auction.minimumIncrement, max: auction.minimumIncrement * 5 });
            const bidPrice = currentBidPrice + increment;

            const bid = {
              userId: participant.id,
              auctionId: auction.id,
              bidPrice
            };

            try {
              await bidService.createBid(bid);
              currentBidPrice = bidPrice;
            } catch {
              // bid rejected (e.g. insufficient tokens)
            }
          }

        }
        promises.push(promise_fun())
        break;
      }

      case AuctionType.Dutch: {
        // one bid or nothing
        const toBid = faker.datatype.boolean();
        if (!toBid) continue;

        const index = faker.number.int({ min: 0, max: participantsArray.length - 1 });
        if (!participantsArray[index]) throw createInternalServerError("Invalid value for participantId");
        const participant = participantsArray[index];

        const bid = {
          userId: participant.id,
          auctionId: auction.id
        };

        promises.push(bidService.createBid(bid).catch(() => {
          // bid rejected (e.g. insufficient tokens)
          return null;
        }));

        break;
      }

      case AuctionType.FirstPrice:
      case AuctionType.SecondPrice: {
        // one bid per participant with minimum auction.reservePrice (and lower than getRealUserTokens)
        for (let i = 0; i < length; i++) {
          const index = faker.number.int({ min: 0, max: participantsArray.length - 1 });
          if (!participantsArray[index]) throw createInternalServerError("Invalid value for participantId");
          const participant = participantsArray[index];

          /*
          const userTokens = await userService.getRealUserTokens(participant);
          if (userTokens < auction.reservePrice) continue;

          const bidPrice = faker.number.int({ min: auction.reservePrice, max: userTokens });
          */

          const bidPrice = faker.number.int({ min: auction.reservePrice, max: auction.reservePrice * 5 });

          const bid = {
            userId: participant.id,
            auctionId: auction.id,
            bidPrice,
          };

          promises.push(bidService.createBid(bid).catch(() => {
            // bid rejected (e.g. insufficient tokens)
            return null;
          }));
        }
        break;
      }
    }
  }
  return Promise.all(promises);
}

export async function seed() {
  await clearRedis();

  await sequelize.sync({ force: true });

  const usersByRole = loadUsersByRole(env.USERS_BY_ROLE_SEED_PATH);

  //Generates statics users only in the DataBase
  await generateUsersArray(usersByRole, RoleName.Admin);
  const auctionCreators = await generateUsersArray(usersByRole, RoleName.AuctionCreator);
  const auctionParticipants = await generateUsersArray(usersByRole, RoleName.AuctionParticipant);

  //Generates auctions
  const auctions = await generateAuctionsArray(MIN_AUCTIONS, MAX_AUCTIONS, auctionCreators);

  //Generates auctions
  await generateBidsArray(MIN_BIDS, MAX_BIDS, auctions, auctionParticipants);

  await initBullMQ();

  //await deleteStaleUsers();
}

await seed();
process.exit();