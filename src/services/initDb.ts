import sequelize from "./sequelize.ts";
import { fakerIT as faker } from "@faker-js/faker";
import "../models/relationships.ts";
import { User } from "../models/relationships.ts";
import env, { NodeEnv } from "../config.ts";
import userRepository from "../repositories/userRepository.ts";
import { deleteStaleUsers, RoleName } from "./auth0.ts";
import logger from "../middlewares/logger.ts";
import { Sequelize } from "sequelize";

const bidParticipantsLength = 0;
const bidCreatorsLength = 0;
const adminsLength = 0;

const auth0UsernameMinLength = 1;
const auth0UsernameMaxLength = 15;

const randomEndedAuctions = 5; //per ogni tipo di asta
const randomInProgressAuctions = 5;
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
    const user = await userRepository.save(
      username,
      "Password1@",
      RoleName.BidParticipant
    );
    users.push(user);
  }
  if (loggerMethod && logString) loggerMethod(`${length} ${logString} created`);
  return users;
}

  return auctions;
}

export async function initDb() {
  if (env.NODE_ENV != NodeEnv.Development) {
    await sequelize.sync();
    return;
  }

  await sequelize.sync({ force: true });

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

    const auctions = await generateAuctionsArray(auctionsPerTypeAndStatus);
  } catch (err) {
    deleteStaleUsers();
    if (err instanceof Error)
      logger.error(`user creations crashed: ${err.message}`);
  }
  await deleteStaleUsers();
}
