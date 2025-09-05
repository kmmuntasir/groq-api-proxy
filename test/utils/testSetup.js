const winston = require('winston');
require('winston-daily-rotate-file');

/**
 * Create a test logger instance
 * @returns {winston.Logger} Configured test logger
 */
function createTestLogger() {
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
        defaultMeta: { service: 'groq-api-proxy-test' },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ timestamp, level, message, ...meta }) => {
                        const ts = new Date(timestamp);
                        const formattedTimestamp = ts.toISOString().replace('T', ' ').slice(0, -5) + '.' + String(ts.getMilliseconds()).padStart(3, '0');
                        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                        return `${formattedTimestamp} [${level}] ${message}${metaStr}`;
                    })
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
}

/**
 * Setup a test server
 * @param {Express.Application} app - Express app instance
 * @param {number} port - Port to listen on
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<Server>} Server instance
 */
function setupTestServer(app, port = 3001, logger = null) {
    const testLogger = logger || createTestLogger();
    
    return new Promise((resolve, reject) => {
        const server = app.listen(port, (err) => {
            if (err) {
                reject(err);
            } else {
                testLogger.info(`Test server listening on port ${port}`);
                resolve(server);
            }
        });
    });
}

/**
 * Teardown a test server
 * @param {Server} server - Server instance to close
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<void>}
 */
function teardownTestServer(server, logger = null) {
    const testLogger = logger || createTestLogger();
    
    return new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) {
                reject(err);
            } else {
                testLogger.info('Test server closed');
                resolve();
            }
        });
    });
}

module.exports = {
    createTestLogger,
    setupTestServer,
    teardownTestServer
};
