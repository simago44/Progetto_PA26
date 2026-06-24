import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env, log_levels } from '../config.ts';

const LOG_FORMAT = env.LOG_FORMAT;
const ENABLE_LOG_FILE = env.ENABLE_LOG_FILE;
const LOG_DIR = env.LOG_DIR;
const LOG_FILENAME_PREFIX = env.LOG_FILENAME_PREFIX;
const CONSOLE_LOG_LEVEL = env.CONSOLE_LOG_LEVEL;
const FILE_LOG_LEVEL = env.FILE_LOG_LEVEL;

function buildPrintfTemplate(template: string): winston.Logform.Format {
  return winston.format.printf(({ level, message, timestamp, stack }) => {
    const body = stack ? `${message}\n${stack}` : message;
    return template
      .replace('%timestamp%', String(timestamp ?? ''))
      .replace('%level%', level)
      .replace('%message%', String(body));
  });
}

function buildFormat() {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    buildPrintfTemplate(LOG_FORMAT),
  );
}

const transports: winston.transport[] = [];

transports.push(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    buildFormat(),
  ),
  level: CONSOLE_LOG_LEVEL
}));

if (ENABLE_LOG_FILE) {
  transports.push(
    new DailyRotateFile({
      format: buildFormat(),
      dirname: LOG_DIR,
      filename: LOG_FILENAME_PREFIX+"-%DATE%.log",
      datePattern: 'YYYY-MM-DD',
      level: FILE_LOG_LEVEL
    }),
  );
}

const logger = winston.createLogger({
  transports,
  levels: log_levels
});

export default logger;