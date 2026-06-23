// middleware/logger.ts
import winston from "winston";
import 'winston-daily-rotate-file';
import { env } from '../config.ts';

const errorFileName = env.ERRORFILENAME
const logFileName = env.LOGFILENAME
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD_HH:mm:ss' }), 
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),

    transports: [
        new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, stack }) => {
                return `[${timestamp}] ${level}: ${stack || message}`;
            })
        )
        }),
        new winston.transports.DailyRotateFile({ filename: errorFileName, level: "warn" }),
        new winston.transports.DailyRotateFile({ filename: logFileName })
    ]
});

export default logger;