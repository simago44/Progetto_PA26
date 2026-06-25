import { Queue, Worker, createNodeRedisClient } from 'bullmq';
import redis from './redis.ts'
import { Auction } from '../models/Auction.ts';
import { checkAuctionHasEnded, closeAuction, getMsToEnd } from '../models/AuctionUtils.ts';
import logger from '../middlewares/logger.ts';
import { Bid } from '../models/Bid.ts';

export const connection = createNodeRedisClient(redis);

const queueName = "auctionQueue";
const closeAuctionJobName = "close-auction";

const auctionQueue = new Queue(queueName, { connection });

const myWorker = new Worker(queueName, async job => {
  logger.debug("processing job", job.name, job.id);
  logger.error(await auctionQueue.getJobs())
  switch (job.name) {
    case closeAuctionJobName:
      // TODO
      const auctionId = job.data.auctionId as string;

      const auction = await Auction.findByPk(auctionId);
      if (auction == null) return;

      const msToEnd = await getMsToEnd(auction);
      if (auction.hasEnded) break;
      if (msToEnd > 0) {
        createCloseAuctionJob(auction);
        break;
      }

      await closeAuction(auction);
      break;
  }
}, { connection });

export async function createCloseAuctionJob(auction: Auction) {
  await auctionQueue.add(closeAuctionJobName, { auctionId: auction.id }, {
    delay: await getMsToEnd(auction),
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

async function afterAuctionCreation(auction: Auction) {
  if (auction.hasEnded) return;

  createCloseAuctionJob(auction);
}
