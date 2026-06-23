import { Sequelize } from "sequelize";
import logger from "../middlewares/logger.ts";
import { env } from '../config.ts';

/**
 * The Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
export class SequelizeConnection {
    // Connection instance
    private static instance: Sequelize;

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {
        // TODO: it's correct to use env variables here?
        const DATABASE_URL = env.DATABASE_URL;

        // Initialize connection
        SequelizeConnection.instance = new Sequelize(DATABASE_URL);

        // Test connection
        SequelizeConnection.instance.authenticate().then(() => {
            logger.info('Sequelize connected');
        });
    }

    /**
     * The static method that controls the access to the singleton instance.
     *
     */
    public static getInstance(): Sequelize {
        if (!SequelizeConnection.instance) {
            new SequelizeConnection();
        }

        return SequelizeConnection.instance;
    }
}
