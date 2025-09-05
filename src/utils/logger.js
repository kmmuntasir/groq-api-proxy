const winston = require('winston');
require('winston-daily-rotate-file');

// Helper function to format boxed logs
const formatBoxedLog = ({ timestamp, level, message, ...meta }) => {
    const ts = new Date(timestamp);
    const formattedTimestamp = ts.toISOString().replace('T', ' ').slice(0, -5) + '.' + String(ts.getMilliseconds()).padStart(3, '0');
    
    // Handle HTTP request logging
    if (message === 'Incoming request') {
        const { method, url, headers, body } = meta;
        const boxWidth = 80;
        const topBorder = '┌' + '─'.repeat(boxWidth - 2) + '┐';
        const bottomBorder = '└' + '─'.repeat(boxWidth - 2) + '┘';
        const divider = '├' + '─'.repeat(boxWidth - 2) + '┤';
        
        let result = `${formattedTimestamp} [${level}] ${message}\n`;
        result += `${topBorder}\n`;
        result += `│ METHOD: ${method} │\n`;
        result += `│ URL: ${url} │\n`;
        result += `${divider}\n`;
        result += `│ HEADERS: │\n`;
        
        if (headers) {
            const headersStr = JSON.stringify(headers, null, 2);
            const headerLines = headersStr.split('\n');
            for (const line of headerLines) {
                result += `│ ${line}\n`;
            }
        }
        
        if (body) {
            result += `${divider}\n`;
            result += `│ BODY: │\n`;
            const bodyStr = JSON.stringify(body, null, 2);
            const bodyLines = bodyStr.split('\n');
            for (const line of bodyLines) {
                result += `│ ${line}\n`;
            }
        }
        
        result += `${bottomBorder}`;
        return result;
    }
    
    // Handle Groq API call success logging
    if (message === 'Groq API call successful') {
        const { model, usage, choices } = meta;
        const boxWidth = 80;
        const topBorder = '┌' + '─'.repeat(boxWidth - 2) + '┐';
        const bottomBorder = '└' + '─'.repeat(boxWidth - 2) + '┘';
        const divider = '├' + '─'.repeat(boxWidth - 2) + '┤';
        
        let result = `${formattedTimestamp} [${level}] ${message}\n`;
        result += `${topBorder}\n`;
        result += `│ MODEL: ${model} │\n`;
        result += `│ CHOICES: ${choices} | TOKENS: ${usage?.total_tokens || 'N/A'} | TIME: ${usage?.total_time ? (usage.total_time * 1000).toFixed(0) + 'ms' : 'N/A'} │\n`;
        result += `${divider}\n`;
        result += `│ USAGE DETAILS: │\n`;
        
        if (usage) {
            const usageStr = JSON.stringify(usage, null, 2);
            const usageLines = usageStr.split('\n');
            for (const line of usageLines) {
                result += `│ ${line}\n`;
            }
        }
        
        result += `${bottomBorder}`;
        return result;
    }
    
    // Handle HTTP response logging
    if (message === 'Outgoing response') {
        const { method, url, statusCode, duration, responseSize, response } = meta;
        const boxWidth = 80;
        const topBorder = '┌' + '─'.repeat(boxWidth - 2) + '┐';
        const bottomBorder = '└' + '─'.repeat(boxWidth - 2) + '┘';
        const divider = '├' + '─'.repeat(boxWidth - 2) + '┤';
        
        let result = `${formattedTimestamp} [${level}] ${message}\n`;
        result += `${topBorder}\n`;
        result += `│ REQUEST: ${method} ${url} │\n`;
        result += `│ STATUS: ${statusCode} | DURATION: ${duration} | SIZE: ${responseSize} bytes │\n`;
        result += `${divider}\n`;
        result += `│ RESPONSE: │\n`;
        
        if (response) {
            const responseStr = JSON.stringify(response, null, 2);
            const responseLines = responseStr.split('\n');
            for (const line of responseLines) {
                result += `│ ${line}\n`;
            }
        }
        
        result += `${bottomBorder}`;
        return result;
    }
    
    // Standard log format for other messages
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${formattedTimestamp} [${level}] ${message}${metaStr}`;
};

// Configure winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'groq-api-proxy' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(formatBoxedLog)
            )
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.printf(formatBoxedLog)
            )
        })
    ]
});

module.exports = {
    logger,
    formatBoxedLog
};
