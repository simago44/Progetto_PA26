import { createClient } from "redis";
import env, { NodeEnv } from "../core/config.ts";
import logger from "../core/logger.ts";

const redis = await createClient({
  url: env.REDIS_URL,
}).on("error", (err) => logger.error("Redis Client Error", err))
  .connect();

export async function clearRedis(): Promise<void> {
  await redis.flushAll();
}

export default redis


