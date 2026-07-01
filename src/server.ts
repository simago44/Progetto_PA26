/**
 * Entry point of the Express application.
 * Registers middleware, routes, and starts the HTTP server.
 */

import express from "express";
import authRoutes from "./routes/authRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import auctionRoutes from "./routes/auctionRoutes.ts";
import bidRoutes from "./routes/bidRoutes.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import logger from "./middlewares/logger.ts";
import env from "./config.ts";
import { healthCheck } from "./utils/healthUtils.ts";
import { initDb } from "./services/initDb.ts";

import "./services/BullMQ.ts";
import { initBullMQ } from "./services/BullMQ.ts";
import { Errors } from "./factory/errorFactory.ts";

await initDb();
await initBullMQ();

// Initialize Express app
const app = express();
const PORT = env.NODE_PORT;

// Middleware for parsing json bodies
app.use(express.json());

app.get("/health", healthCheck);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

app.use("/", authRoutes);
app.use("/users", userRoutes);
app.use("/auctions", auctionRoutes);
app.use("/auctions", bidRoutes);

app.use((req, res, next) => {
  throw new Errors.RouteNotFoundError({ path: req.path});
});

app.use(errorHandler);

export { app };
