import { z } from "zod"

/** Custom log levels for winston, ordered by severity. */
export const log_levels = {
  crit: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
} as const;

export const NodeEnv = {
  Development: "development",
  Production: "production",
  Test: "test",
} as const;

const logLevel = z.enum(Object.keys(log_levels));

const logFormat = z.string()
  .refine(
    v => ['%timestamp%', '%level%', '%message%'].every(p => v.includes(p)),
    { message: 'LOG_FORMAT must contain %timestamp%, %level%, and %message%' }
  )
  .default('[%timestamp%] %level%: %message%');

const configSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  AUTH0_DOMAIN: z.string(),
  AUTH0_AUDIENCE: z.string(),
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_CLIENT_SECRET: z.string(),
  AUTH0_CONNECTION: z.string(),
  ENABLE_LOG_FILE: z.enum(["true", "false", "0", "1"]).transform((val) => val === 'true' || val === '1').default(true),
  LOG_DIR: z.string().default("./logs"),
  LOG_FILENAME_PREFIX: z.string().default("express"),
  CONSOLE_LOG_LEVEL: logLevel.default("debug"),
  FILE_LOG_LEVEL: logLevel.default("info"),
  LOG_FORMAT: logFormat,
  NODE_ENV: z.enum(NodeEnv).default(NodeEnv.Development),
  USERS_SEED_PATH: z.string()
})

const result = configSchema.safeParse(process.env);

if (!result.success) {
  console.error(result.error);
  process.exit(1);
}

/** Parsed and validated environment configuration. Exits the process if validation fails. */
const env = result.data;
export default env;