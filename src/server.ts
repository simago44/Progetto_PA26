import express, { type NextFunction, type Request, type Response } from 'express';
import authRoutes from "./routes/authRoutes.ts";
import exampleRoutes from "./routes/exampleRoutes.ts";
import { errorHandler } from './middlewares/errorHandler.ts';
import logger from './middlewares/logger.ts';
import { createError, ErrorEnum } from './factory/errorFactory.ts';
import { env } from './config.ts';

// Initialize Express app
const app = express();
const PORT = env.NODE_PORT

// Middleware for parsing json bodies
app.use(express.json());

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  next(createError(ErrorEnum.MissingToken))
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

app.use("/auth", authRoutes)
app.use("/", exampleRoutes)

app.use(errorHandler)
