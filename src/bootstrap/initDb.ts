import logger from "../core/logger.ts";
import { AuctionStatus, AuctionType, RoleName } from "../enums/enums.ts";
import { createSequelizeError, createZodError, Errors } from "../factory/errorFactory.ts";
import type { User } from "../models/User.ts";
import userRepository from "../repositories/userRepository.ts";
import env, { NodeEnv } from "../core/config.ts";
import sequelize from "../integrations/sequelize.ts";
import "../models/relationships.ts";
import { fakerIT as faker } from "@faker-js/faker";
import { AuctionSchema } from "../middlewares/auctionMiddleware.ts";
import { AuctionConstants } from "../constants/constants.ts";
import type { CreationAttributes } from "sequelize";
import { Auction } from "../models/Auction.ts";
import { addInterval, HOURS, MINUTES, SECONDS, tomorrow } from "../utils/dateUtils.ts";
import z from "zod";
import { readFileSync } from "node:fs";
import auctionService from "../services/auctionService.ts";

const SeedUserSchema = z.object({
  userId: z.string(),
  username: z.string(),
  role: z.enum(RoleName),
});
const UsersSeedSchema = z.array(SeedUserSchema);

function loadUsersByRole(): Record<RoleName, { userId: string; username: string; }[]> {
  const raw = readFileSync(env.USERS_BY_ROLE_SEED_PATH, "utf-8");
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
      array.push(await userRepository.create({ ...userData, role }));
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
  const tomorrowDate = faker.date.between({ from: tomorrow(), to: addInterval(tomorrow(), 10 * HOURS) });
  const tomorrowDate2 = addInterval(tomorrowDate, faker.number.int({ min: 3, max: 10 }) * HOURS);
  const now = addInterval(new Date(), 1 * SECONDS);
  const now2 = addInterval(now, 1 * SECONDS);

  const startsAt = status === AuctionStatus.NotStarted ? tomorrowDate : now;
  switch (status) {
    case AuctionStatus.NotStarted:
    case AuctionStatus.InProgress:
      return { startsAt, endsAt: tomorrowDate2 };
    case AuctionStatus.Ended:
    default:
      return { startsAt, endsAt: now2 };
  }
}

function computeDutchParams(status: AuctionStatus): {
  startsAt: Date;
  reservePrice: number;
  startPrice: number;
  decrementPrice: number;
  decrementInterval: number;
} {
  const { startsAt, endsAt } = computeDatesForStatus(status);

  //duration minima 1 minuto
  const duration = Math.max(endsAt.getTime() - startsAt.getTime(), 1 * MINUTES);

  const reservePrice = faker.number.int({
    min: AuctionConstants.minReservePrice,
    max: AuctionConstants.minReservePrice + 500,
  });

  //maximum steps 1 for seconds
  const totalSteps = faker.number.int({ min: 1, max: duration / MINUTES });
  const decrementInterval = Math.floor(duration / totalSteps);
  const decrementPrice = faker.number.int({ min: 1, max: 10 });
  const startPrice = reservePrice + decrementPrice * totalSteps;

  return { startsAt, reservePrice, startPrice, decrementPrice, decrementInterval };
}

export async function generateAuctionsArray(length: number, creatorsArray: User[]) {
  const types = Object.values(AuctionType);
  const statuses = Object.values(AuctionStatus);
  const array: Auction[] = [];

  for (let type of types) {
    for (let status of statuses) {
      for (let i = 0; i < length; i++) {
        const index = faker.number.int({ min: 0, max: creatorsArray.length - 1 });
        if (!creatorsArray[index]) throw new Errors.InvariantViolationError({ message: "Invalid value for creatorId" });
        const creatorId = creatorsArray[index].id;
        const basePayload = {
          creatorId,
          reservePrice: AuctionConstants.minReservePrice,
          description: faker.commerce.productDescription(),
          type,
        };

        let payload: CreationAttributes<Auction> | null = null;

        switch (type) {
          case AuctionType.English:
            payload = {
              ...basePayload,
              ...computeDatesForStatus(status),
              minimumIncrement: faker.number.int({ min: 1, max: 10 }),
            };
            break;

          case AuctionType.Dutch: {
            payload = {
              ...basePayload,
              ...computeDutchParams(status),
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

        const result = AuctionSchema.safeParse(payload);

        if (!result.success) {
          const error = createZodError(result.error, 'initDb');
          logger.error(`[${error.name}(${error.status})] ${error.message}`);
          logger.error(result.error);
          continue;
        }

        array.push(await auctionService.createAuction(result.data));
      }
    }
  }
  return array;
}

export async function initDb() {
  //Initialize database
  if (env.NODE_ENV != NodeEnv.Development) {
    await sequelize.sync();
    return;
  }

  await sequelize.sync({ force: true });

  const usersByRole = loadUsersByRole();

  //Generates statics users only in the DataBase
  const admins = await generateUsersArray(usersByRole, RoleName.Admin);
  const bidCreators = await generateUsersArray(usersByRole, RoleName.BidCreator);
  const bidParticipants = await generateUsersArray(usersByRole, RoleName.BidParticipant);

  //Generates auctions
  const auctions = await generateAuctionsArray(1, bidCreators);

  //Generates bids
  return;
}