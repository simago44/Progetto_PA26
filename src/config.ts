import { z } from "zod"

/** Custom log levels for winston, ordered by severity. */
export const log_levels = {
  crit: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
};

const logLevel = z.enum(Object.keys(log_levels));

const logFormat = z.string()
  .refine(
    v => ['%timestamp%', '%level%', '%message%'].every(p => v.includes(p)),
    { message: 'LOG_FORMAT must contain %timestamp%, %level%, and %message%' }
  )
  .default('[%timestamp%] %level%: %message%');

const configSchema = z.object({
  NODE_PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_CLIENT_SECRET: z.string(),
  AUTH0_REALM: z.string(),
  ENABLE_LOG_FILE: z.coerce.boolean().default(true),
  LOG_DIR: z.string().default("./logs"),
  LOG_FILENAME_PREFIX: z.string().default("express"),
  CONSOLE_LOG_LEVEL: logLevel.default("debug"),
  FILE_LOG_LEVEL: logLevel.default("info"),
  LOG_FORMAT: logFormat
})

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error(result.error);
  process.exit(1);
}

/** Parsed and validated environment configuration. Exits the process if validation fails. */
export const env = result.data;