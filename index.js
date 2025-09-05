require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');
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
                result += `│ ${line} │\n`;
            }
        }
        
        if (body) {
            result += `${divider}\n`;
            result += `│ BODY: │\n`;
            const bodyStr = JSON.stringify(body, null, 2);
            const bodyLines = bodyStr.split('\n');
            for (const line of bodyLines) {
                result += `│ ${line} │\n`;
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
                result += `│ ${line} │\n`;
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
                winston.format.json()
            )
        })
    ]
});

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON request bodies
app.use(express.json());

// Custom error handling for JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Failed to parse JSON body.' });
    }
    next();
});

// Enable CORS for all origins (you might want to restrict this in production)
const cors = require('cors');
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();

    // Log incoming request
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        headers: {
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip
        },
        body: req.method === 'POST' ? req.body : undefined
    });

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;

        // Log outgoing response
        logger.info('Outgoing response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(data).length,
            response: data
        });

        return originalJson.call(this, data);
    };

    next();
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

logger.info("GROQ_API_KEY from environment:", { status: process.env.GROQ_API_KEY ? "Set" : "Not Set" });
logger.info("GROQ_API_KEY value (first 5 chars):", { value: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 5) + "..." : "" });

app.post('/chat', async (req, res) => {
    try {
        const { model, messages, temperature, top_p, ...rest } = req.body;

        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required.' });
        }

        const completion = await groq.chat.completions.create({
            model: model || process.env.DEFAULT_MODEL || "llama-3.1-8b-instant", // Default model if not provided
            messages: messages,
            temperature: temperature || 0.7, // Default temperature
            top_p: top_p || 1,             // Default top_p
            ...rest
        });

        // Log successful Groq API call
        logger.info('Groq API call successful', {
            model: completion.model,
            usage: completion.usage,
            choices: completion.choices?.length || 0
        });

        res.json(completion);

    } catch (error) {
        logger.error('Error proxying request to Groq API:', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Failed to communicate with Groq API', details: error.message });
    }
});

if (process.env.NODE_ENV === 'test') {
    module.exports = { app, groq }; // Export app and groq for testing
} else {
    app.listen(port, () => {
        logger.info(`Groq API Proxy server listening at http://localhost:${port}`, { port });
    });
    module.exports = app; // Export app for normal execution
} 