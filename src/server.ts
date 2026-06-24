/**
 * Entry point of the Express application.
 * Registers middleware, routes, and starts the HTTP server.
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import authRoutes from "./routes/authRoutes.ts";
import exampleRoutes from "./routes/exampleRoutes.ts";
import { errorHandler } from './middlewares/errorHandler.ts';
import logger from './middlewares/logger.ts';
import { env } from './config.ts';
import { healthCheck } from './utils/healthUtils.ts';

// Initialize Express app
const app = express();
const PORT = env.NODE_PORT

// Middleware for parsing json bodies
app.use(express.json());

app.get('/health', healthCheck);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

app.use("/auth", authRoutes)
app.use("/", exampleRoutes)

app.use(errorHandler)

export { app };
