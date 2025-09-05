const { logger } = require('../utils/logger');

/**
 * Request/response logging middleware
 * Logs incoming requests and outgoing responses with timing information
 */
const requestLogger = (req, res, next) => {
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
};

module.exports = requestLogger;
