import { Queue, Worker, createNodeRedisClient } from 'bullmq';
import redis from './redis.ts';
import { Auction } from '../models/Auction.ts';
import auctionRepository from '../repositories/auctionRepository.ts';
import auctionService from '../services/auctionService.ts';
import { closeAuctionJobName, queueName } from '../constants/constants.ts';
import { AuctionStatus } from '../enums/enums.ts';

export const connection = createNodeRedisClient(redis);

const auctionQueue = new Queue(queueName, { connection });

new Worker(queueName, async job => {
  switch (job.name) {
    case closeAuctionJobName: {
      // TODO
      const auctionId = job.data.auctionId as string;

      const auction = await Auction.findByPk(auctionId);
      if (auction == null) return;

      const msToEnd = await auctionService.getMsToEnd(auction);
      if (auction.status == AuctionStatus.Ended) break;
      if (msToEnd > 0) {
        createCloseAuctionJob(auction);
        break;
      }

      await auctionService.closeAuction(auction, msToEnd);
      break;
    }
  }
}, { connection });

export async function createCloseAuctionJob(auction: Auction): Promise<void> {
  await auctionQueue.remove(`close-auction-${auction.id}`);
  await auctionQueue.add(closeAuctionJobName, { auctionId: auction.id }, {
    delay: await auctionService.getMsToEnd(auction),
    attempts: 3,
    jobId: `close-auction-${auction.id}`,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: true
  });
}

export async function initBullMQ(): Promise<void> {
  const auctions = await auctionRepository.findAll();
  auctions.forEach(async (auction) => {
    if (auction.status == AuctionStatus.Ended) return;

    createCloseAuctionJob(auction);
  });
}
