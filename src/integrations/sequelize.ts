import { Sequelize } from "sequelize";
import logger from "../middlewares/logger.ts";
import env from '../config.ts';

const sequelize = new Sequelize(env.DATABASE_URL, {
  logging: msg => logger.debug(msg)
});

export default sequelize