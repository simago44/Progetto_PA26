import { Sequelize } from "sequelize";

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
        const DATABASE_URL = process.env.DATABASE_URL as string;

        // Initialize connection
        SequelizeConnection.instance = new Sequelize(DATABASE_URL);

        // Test connection
        SequelizeConnection.instance.authenticate().then(() => {
            console.log('Sequelize connected');
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
