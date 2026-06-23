// middleware/logger.ts
import winston from "winston";

const errorFileName: string = process.env.ERRORFILENAME || "logs/log.log"
const logFileName: string = process.env.LOGFILENAME || "logs/problems.log"

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
            winston.format.colorize()
        )
        }),
        new winston.transports.File({ filename: errorFileName, level: "warn" }),
        new winston.transports.File({ filename: logFileName })
    ]
});

export default logger;