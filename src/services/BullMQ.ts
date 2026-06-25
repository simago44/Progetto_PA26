import { Queue, Worker, createNodeRedisClient } from 'bullmq';
import redis from './redis.ts'

const connection = createNodeRedisClient(redis);

export const myQueue = new Queue('myqueue', { connection });
export const myWorker = new Worker('myqueue', async job => {}, { connection });
