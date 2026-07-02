import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import env, { log_levels } from './config.ts';

/**
 * Builds a winston printf format from a template string.
 * Supports the placeholders: `%timestamp%`, `%level%`, `%message%`.
 * If the log entry has a stack trace, it is appended below the message.
 * 
 * @param template - The format template string from config
 * @returns A winston printf format which follows the @param template
 */
function buildPrintfTemplate(template: string): winston.Logform.Format {
  return winston.format.printf(({ level, message, timestamp, stack }) => {
    const body = stack ? `${message}\n${stack}` : message;
    return template
      .replace('%timestamp%', String(timestamp ?? ''))
      .replace('%level%', level)
      .replace('%message%', String(body));
  });
}

/**
 * Builds the base winston log format combining timestamp, error stack, and printf template.
 */
function buildFormat() {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    buildPrintfTemplate(env.LOG_FORMAT),
  );
}

const transports: winston.transport[] = [];

transports.push(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    buildFormat(),
  ),
  level: env.CONSOLE_LOG_LEVEL
}));

if (env.ENABLE_LOG_FILE) {
  transports.push(
    new DailyRotateFile({
      format: buildFormat(),
      dirname: env.LOG_DIR,
      filename: env.LOG_FILENAME_PREFIX + "-%DATE%.log",
      datePattern: 'YYYY-MM-DD',
      level: env.FILE_LOG_LEVEL
    }),
  );
}

const logger = winston.createLogger({
  transports,
  levels: log_levels
});

export default logger;