import { Sequelize } from "sequelize";
import logger from "../middlewares/logger.ts";
import env from '../config.ts';

const DATABASE_URL = env.DATABASE_URL;

const sequelize = new Sequelize(DATABASE_URL, {
  logging: msg => logger.debug(msg)
});

export default sequelize