const express = require('express');
const cors = require('cors');

// Import configuration
const { config } = require('./config');
const { getCorsOptions } = require('./config/cors');

// Import middleware
const requestLogger = require('./middleware/requestLogger');
const { jsonErrorHandler, globalErrorHandler } = require('./middleware/errorHandler');

// Import routes
const setupRoutes = require('./routes');

// Import services (initializes automatically)
const groqService = require('./services/groqService');

/**
 * Create and configure Express application
 * @returns {Object} Configured Express app instance
 */
const createApp = () => {
    const app = express();

    // Basic middleware
    app.use(express.json());
    
    // Error handling middleware for JSON parsing
    app.use(jsonErrorHandler);
    
    // CORS middleware
    app.use(cors(getCorsOptions()));
    
    // Serve static files from the 'public' directory
    app.use(express.static('public'));
    
    // Request logging middleware
    app.use(requestLogger);
    
    // Setup all application routes
    setupRoutes(app);
    
    // Global error handler (must be last)
    app.use(globalErrorHandler);
    
    return app;
};

module.exports = createApp;
