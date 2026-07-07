/**
 * Entry point of the Express application.
 * Registers middleware, routes, and starts the HTTP server.
 */

import express from "express";
import authRoutes from "./routes/authRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import auctionRoutes from "./routes/auctionRoutes.ts";
import healthRoute from "./routes/healthRoute.ts";
import bidRoutes from "./routes/bidRoutes.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import logger from "./core/logger.ts";
import env from "./core/config.ts";
import { initDB } from "./bootstrap/initDb.ts";
import "./integrations/BullMQ.ts";
import { Errors } from "./factory/errorFactory.ts";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerJsdocOptions } from "./constants/constants.ts";

await initDB();

// Initialize Express app
const app = express();
const PORT = env.NODE_PORT;

// Middleware for parsing json bodies
app.use(express.json());

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

app.use("/", healthRoute);
app.use("/", authRoutes);
app.use("/users", userRoutes);
app.use("/auctions", auctionRoutes);
app.use("/auctions", bidRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerJsdocOptions)));

app.use((req) => {
  throw new Errors.RouteNotFoundError({ path: req.path });
});

app.use(errorHandler);

export { app };
