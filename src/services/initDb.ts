import sequelize from "./sequelize.ts";
import { fakerIT as faker } from "@faker-js/faker";
import "../models/relationships.ts";
import { User } from "../models/relationships.ts";
import env, { NodeEnv } from "../config.ts";
import userRepository from "../repositories/userRepository.ts";
import { deleteStaleUsers, RoleName } from "./auth0.ts";
import logger from "../middlewares/logger.ts";

const bidParticipantsLength = 10;
const bidCreatorsLength = 5;
const AdminsLength = 0;

const auth0UsernameMinLength = 1;
const auth0UsernameMaxLength = 15;

const randomEndedAuctions = 5; //per ogni tipo di asta
const randomInProgressAuctions = 5;
const randomNotStartedAuctions = 5;

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

  try {
    logger.info(`creating ${bidParticipantsLength} bid participants...`);
    const randomBidParticipants: User[] = [];
    for (let i = 0; i < bidParticipantsLength; i++) {
      const user = await userRepository.save(
        generateUsername(),
        "Password1@",
        RoleName.BidParticipant
      );
      randomBidParticipants.push(user);
    }
    logger.info("bid participants created successfully");

    logger.info(`creating ${bidCreatorsLength} bid creators...`);
    const randomBidCreators: User[] = [];
    for (let i = 0; i < bidCreatorsLength; i++) {
      const user = await userRepository.save(
        generateUsername(),
        "Password1@",
        RoleName.BidParticipant
      );
      randomBidCreators.push(user);
    }
    logger.info("bid creators created successfully");

    logger.info(`creating ${AdminsLength} admins...`);
    const randomAdmins: User[] = [];
    for (let i = 0; i < AdminsLength; i++) {
      const user = await userRepository.save(
        generateUsername(),
        "Password1@",
        RoleName.BidParticipant
      );
      randomAdmins.push(user);
    }
    logger.info("admins created successfully");


  } catch (err) {
    await deleteStaleUsers();
    if (err instanceof Error)
      logger.error(`user creations crashed: ${err.message}`);
  } finally { await deleteStaleUsers(); }
}
