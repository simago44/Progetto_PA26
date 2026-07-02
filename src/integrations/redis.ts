import { createClient } from "redis";
import env, { NodeEnv } from "../config.ts";
import logger from "../middlewares/logger.ts";

const REDIS_URL = env.REDIS_URL;

const redis = await createClient({
  url: REDIS_URL,
}).on("error", (err) => logger.error("Redis Client Error", err))
  .connect();

export async function initRedis() {
  if (env.NODE_ENV == NodeEnv.Development) {
    await redis.flushAll();
  }
}

export default redis


