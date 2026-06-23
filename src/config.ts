import { z } from "zod"

const configSchema = z.object({
  NODE_PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_CLIENT_SECRET: z.string(),
  AUTH0_REALM: z.string(),
  ERRORFILENAME: z.string().default("logs/errors-%DATE%.log"),
  LOGFILENAME: z.string().default("logs/log.log")
})

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error(result.error);
  process.exit(1);
}

export const env = result.data;