import { MINUTES } from "../utils/dateUtils.ts";

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
      title: 'Progetto PA26',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.ts'], // files containing annotations as above
});