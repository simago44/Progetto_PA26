/**
 * Entry point of the Express application.
 * Registers middleware, routes, and starts the HTTP server.
 */
import logger from "./core/logger.ts";
import env from "./core/config.ts";
import "./integrations/BullMQ.ts";
import { app } from "./app.ts";
import { initSequelize } from "./integrations/sequelize.ts";
import { initBullMQ } from "./integrations/BullMQ.ts";
// Necessary to initialize sequelize models relationships
import "./models/relationships.ts";

await initSequelize();
await initBullMQ();

const PORT = env.NODE_PORT;

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
