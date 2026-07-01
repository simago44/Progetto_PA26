import { createClient } from "redis";
import env from "../config.ts";
import logger from "../middlewares/logger.ts";

const REDIS_URL = env.REDIS_URL;

const redis = await createClient({
  url: REDIS_URL,
}).on("error", (err) => logger.error("Redis Client Error", err))
  .connect();

export default redis


