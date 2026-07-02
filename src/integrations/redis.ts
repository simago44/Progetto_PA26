import { createClient } from "redis";
import env, { NodeEnv } from "../config.ts";
import logger from "../middlewares/logger.ts";

const redis = await createClient({
  url: env.REDIS_URL,
}).on("error", (err) => logger.error("Redis Client Error", err))
  .connect();

export async function initRedis() {
  if (env.NODE_ENV == NodeEnv.Development) {
    await redis.flushAll();
  }
}

export default redis


