import { MINUTES } from "../utils/dateUtils.ts";

export const queueName = "auctionQueue";
export const closeAuctionJobName = "close-auction";

export const AuctionConstants = Object.freeze({
  defaultDelayBeforeEnding: 5 * MINUTES,
  descriptionMinLenght: 10,
  descriptionMaxLenght: 1023,
});
