import { MINUTES } from "../utils/dateUtils.ts";

export const PORT = 3000;

export const queueName = "auctionQueue";
export const closeAuctionJobName = "close-auction";

export const AuctionConstants = Object.freeze({
  defaultDelayBeforeEnding: 5 * MINUTES,
  descriptionMinLenght: 10,
  descriptionMaxLenght: 1023,
  minReservePrice: 1
});

export const swaggerJsdocOptions = Object.freeze({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auction Platform API',
      version: '1.0.0',
    },
    servers: [
      { url: '/api/v1' },
    ],
  },
  apis: ['./src/routes/*.ts'], // files containing annotations as above
});