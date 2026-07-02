import { Sequelize } from "sequelize";
import logger from "../core/logger.ts";
import env from '../core/config.ts';

const sequelize = new Sequelize(env.DATABASE_URL, {
  logging: msg => logger.debug(msg)
});

export default sequelize