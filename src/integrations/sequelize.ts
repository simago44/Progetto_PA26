import { Sequelize, UniqueConstraintError, ValidationError } from "sequelize";
import logger from "../middlewares/logger.ts";
import env from '../config.ts';
import { Errors } from "../factory/errorFactory.ts";

const DATABASE_URL = env.DATABASE_URL;

const sequelize = new Sequelize(DATABASE_URL, {
  logging: msg => logger.debug(msg)
});

export default sequelize