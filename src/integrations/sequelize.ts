import { Sequelize } from "sequelize";
import logger from "../core/logger.ts";
import env from '../core/config.ts';

const sequelize = new Sequelize(env.DATABASE_URL, {
  logging: msg => logger.debug(msg)
});

export async function initSequelize() {
  //Initialize database
  await sequelize.sync();
}

export default sequelize