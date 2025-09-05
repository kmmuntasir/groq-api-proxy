const { config } = require('./config');
const { logger } = require('./utils/logger');
const createApp = require('./app');

/**
 * Server Module
 * Handles server startup, lifecycle, and graceful shutdown
 */
class Server {
    constructor() {
        this.app = null;
        this.server = null;
        this.isShuttingDown = false;
    }

    /**
     * Start the server
     * @returns {Promise<Object>} Server instance
     */
    async start() {
        try {
            // Create Express app
            this.app = createApp();
            
            // Start HTTP server
            this.server = this.app.listen(config.port, () => {
                logger.info(`Groq API Proxy server listening at http://localhost:${config.port}`, { 
                    port: config.port,
                    environment: config.nodeEnv,
                    timestamp: new Date().toISOString()
                });
            });

            // Setup graceful shutdown handlers
            this.setupGracefulShutdown();

            return this.server;
        } catch (error) {
            logger.error('Failed to start server', { 
                error: error.message, 
                stack: error.stack 
            });
            process.exit(1);
        }
    }

    /**
     * Stop the server gracefully
     * @returns {Promise<void>}
     */
    async stop() {
        if (this.isShuttingDown) {
            return;
        }

        this.isShuttingDown = true;
        logger.info('Starting graceful shutdown...');

        try {
            // Close HTTP server
            if (this.server) {
                await new Promise((resolve, reject) => {
                    this.server.close((error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
                logger.info('HTTP server closed');
            }

            // Perform cleanup tasks here if needed
            // - Close database connections
            // - Clear timeouts/intervals
            // - Save state if necessary

            logger.info('Graceful shutdown completed');
        } catch (error) {
            logger.error('Error during graceful shutdown', { 
                error: error.message, 
                stack: error.stack 
            });
        }
    }

    /**
     * Setup graceful shutdown signal handlers
     * @private
     */
    setupGracefulShutdown() {
        // Handle various termination signals
        const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
        
        signals.forEach((signal) => {
            process.on(signal, async () => {
                logger.info(`Received ${signal}, shutting down gracefully`);
                await this.stop();
                process.exit(0);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', { 
                error: error.message, 
                stack: error.stack 
            });
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled promise rejection', { 
                reason: reason?.message || reason,
                stack: reason?.stack
            });
            process.exit(1);
        });
    }

    /**
     * Get the Express app instance (for testing)
     * @returns {Object} Express app instance
     */
    getApp() {
        return this.app;
    }
}

module.exports = Server;
