/**
 * Entry point of the Express application.
 * Registers middleware, routes, and starts the HTTP server.
 */
import logger from "./core/logger.ts";
import env from "./core/config.ts";
import { initDB } from "./bootstrap/initDb.ts";
import "./integrations/BullMQ.ts";
import { app } from "./app.ts";

await initDB();

const PORT = env.NODE_PORT;

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
