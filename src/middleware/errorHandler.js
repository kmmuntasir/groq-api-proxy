const { logger } = require('../utils/logger');
const { ERROR_MESSAGES, HTTP_STATUS } = require('../utils/constants');

/**
 * JSON parsing error handler middleware
 * Handles syntax errors from malformed JSON requests
 */
const jsonErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        logger.error('JSON parsing error', {
            error: err.message,
            method: req.method,
            url: req.url,
            headers: req.headers
        });
        
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
            error: ERROR_MESSAGES.JSON_PARSE_ERROR 
        });
    }
    next(err);
};

/**
 * Global error handler middleware
 * Catches and handles any unhandled errors
 */
const globalErrorHandler = (err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url
    });

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error',
        ...(isDevelopment && { details: err.message, stack: err.stack })
    });
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res) => {
    logger.warn('Route not found', {
        method: req.method,
        url: req.url,
        ip: req.ip
    });

    res.status(404).json({
        error: 'Route not found',
        path: req.url,
        method: req.method
    });
};

module.exports = {
    jsonErrorHandler,
    globalErrorHandler,
    notFoundHandler
};
