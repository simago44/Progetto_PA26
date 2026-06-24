import { Sequelize } from "sequelize";
import logger from "../middlewares/logger.ts";
import { env } from '../config.ts';

/**
 * Manages a single shared Sequelize connection for the application.
 * Use `getInstance()` to access the connection.
 * 
 * @see getInstance
 */
export class SequelizeConnection {
  /** The shared Sequelize instance */
  private static instance: Sequelize;

  /**
  * Private constructor — use `getInstance()` instead.
  * Initializes the Sequelize connection using the `DATABASE_URL` environment variable.
  */
  private constructor() {
    // TODO: it's correct to use env variables here?
    const DATABASE_URL = env.DATABASE_URL;

    // Initialize connection
    SequelizeConnection.instance = new Sequelize(DATABASE_URL, {
      logging: msg => logger.debug(msg)
    });
  }

  /**
   * Returns the shared Sequelize instance, creating it if it doesn't exist yet.
   */
  public static getInstance(): Sequelize {
    if (!SequelizeConnection.instance) {
      new SequelizeConnection();
    }

    return SequelizeConnection.instance;
  }
}
