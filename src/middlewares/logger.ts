import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

function envLevels(key: string): string[] | null {
  const val = process.env[key];
  if (!val) return null;
  return val.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
}

const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info').trim();
const LOG_FORMAT = (process.env.LOG_FORMAT ?? '[timestamp] level: message').trim();
const FILE_LOG = (process.env.FILE_LOG ?? 'true').toLowerCase() === 'true';
const CONSOLE_LOG = (process.env.CONSOLE_LOG ?? 'true').toLowerCase() === 'true';
const LOG_DIR = (process.env.LOG_DIR ?? './logs').trim();
const LOG_FILENAME = (process.env.LOG_FILENAME ?? 'level-%DATE%.log').trim();
const CONSOLE_LOG_LEVELS = envLevels('CONSOLE_LOG_LEVEL'); // null = nessun filtro
const FILE_LOG_LEVELS = envLevels('FILE_LOG_LEVEL');    // null = nessun filtro

function buildPrintfTemplate(template: string): winston.Logform.Format {
  return winston.format.printf(({ level, message, timestamp, stack }) => {
    const body = stack ? `${message}\n${stack}` : message;
    return template
      .replace('timestamp', String(timestamp ?? ''))
      .replace('level', level)
      .replace('message', String(body));
  });
}

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  buildPrintfTemplate(LOG_FORMAT),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  buildPrintfTemplate(LOG_FORMAT),
);

/**
 * Formato Winston che blocca tutti i livelli non presenti nella whitelist.
 */
function levelFilter(allowed: string[]): winston.Logform.Format {
  return winston.format((info) => {
    return allowed.includes(info.level) ? info : false;
  })();
}

const transports: winston.transport[] = [];

if (CONSOLE_LOG) {
  const format = CONSOLE_LOG_LEVELS
    ? winston.format.combine(levelFilter(CONSOLE_LOG_LEVELS), consoleFormat)
    : consoleFormat;

  transports.push(new winston.transports.Console({ format }));
}

if (FILE_LOG) {
  const levels = FILE_LOG_LEVELS ?? [LOG_LEVEL];

  for (const level of levels) {
    const filename = LOG_FILENAME.replace('level', `${level}`);

    transports.push(
      new DailyRotateFile({
        dirname:      LOG_DIR,
        filename:     path.join(filename),
        datePattern:  'YYYY-MM-DD',
        format:       winston.format.combine(levelFilter([level]), fileFormat),
        auditFile:    path.join(LOG_DIR, `.audit-${level}.json`),
      }),
    );
  }
}

if (transports.length === 0) {
  transports.push(new winston.transports.Console({ silent: true }));
}

const logger = winston.createLogger({
  level: 'silly',
  transports,
});

export default logger;