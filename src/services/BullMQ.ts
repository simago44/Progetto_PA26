import { Queue, Worker, createNodeRedisClient } from 'bullmq';
import redis from './redis.ts'
import { Auction } from '../models/Auction.ts';
import { closeAuction, getMsToEnd } from '../models/AuctionUtils.ts';
import logger from '../middlewares/logger.ts';
import auctionRepository from '../repositories/auctionRepository.ts';

export const connection = createNodeRedisClient(redis);

const queueName = "auctionQueue";
const closeAuctionJobName = "close-auction";

const auctionQueue = new Queue(queueName, { connection });

const myWorker = new Worker(queueName, async job => {
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
  await auctionQueue.remove(`close-auction-${auction.id}`);
  await auctionQueue.add(closeAuctionJobName, { auctionId: auction.id }, {
    delay: await getMsToEnd(auction),
    attempts: 3,
    jobId: `close-auction-${auction.id}`,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: true
  });
}

export async function initBullMQ() {
  const auctions = await auctionRepository.loadAll();
  auctions.forEach(async (auction) => {
    if (auction.hasEnded) return;

    createCloseAuctionJob(auction);
  });
}
