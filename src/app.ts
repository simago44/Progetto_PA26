import express from "express";
import authRoutes from "./routes/authRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";
import auctionRoutes from "./routes/auctionRoutes.ts";
import healthRoute from "./routes/healthRoute.ts";
import bidRoutes from "./routes/bidRoutes.ts";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerJsdocOptions } from "./constants/constants.ts";
import { Errors } from "./factory/errorFactory.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";

// Initialize Express app
export const app = express();

// Middleware for parsing json bodies
app.use(express.json());

const v1 = express.Router();
v1.use("/", authRoutes);
v1.use("/users", userRoutes);
v1.use("/auctions", auctionRoutes);
v1.use("/auctions", bidRoutes);

app.use("/api/v1", v1);

app.use("/", healthRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerJsdocOptions)));

app.use((req) => {
  throw new Errors.RouteNotFoundError({ path: req.path });
});

app.use(errorHandler);