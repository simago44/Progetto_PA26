import { Queue, Worker, createNodeRedisClient } from 'bullmq';
import redis from './redis.ts';
import { Auction } from '../models/Auction.ts';
import auctionRepository from '../repositories/auctionRepository.ts';
import auctionService from '../services/auctionService.ts';
import { closeAuctionJobName, queueName } from '../constants/constants.ts';
import { AuctionStatus } from '../enums/enums.ts';
import { createInternalServerError } from '../factory/errorFactory.ts';

export const connection = createNodeRedisClient(redis);

const auctionQueue = new Queue(queueName, { connection });

new Worker(queueName, async job => {
  switch (job.name) {
    case closeAuctionJobName: {
      if (job.data.auctionId == null) throw createInternalServerError(`BullMQ job { id: '${job.id}', name: ${job.name} } has no job.data.auctionId`);
      const auctionId = job.data.auctionId as number;

      const closed = await auctionService.closeAuction(auctionId);
      if (!closed) createCloseAuctionJob(auctionId);

      break;
    }
  }
}, { connection });

export async function createCloseAuctionJob(auctionId: number): Promise<void> {
  await auctionQueue.remove(`close-auction-${auctionId}`);
  await auctionQueue.add(closeAuctionJobName, { auctionId: auctionId }, {
    delay: await auctionService.getMsToEnd(auctionId),
    attempts: 3,
    jobId: `close-auction-${auctionId}`,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: true
  });
}

export async function initBullMQ(): Promise<void> {
  const auctions = await auctionRepository.findAll();
  await Promise.all(
    auctions.map(async (auction) => {
      if (auction.status === AuctionStatus.Ended) return;

      await createCloseAuctionJob(auction.id);
    })
  );
}
