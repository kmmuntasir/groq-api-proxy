// Load environment variables first
require('dotenv').config();

// Import modules
const Server = require('./src/server');
const createApp = require('./src/app');
const groqService = require('./src/services/groqService');

// Handle different environments
if (process.env.NODE_ENV === 'test') {
    // For testing: export app and groq instance
    const app = createApp();
    module.exports = { app, groq: groqService.groq };
} else {
    // For production/development: start the server
    const server = new Server();
    server.start().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
    
    // Export app for external access if needed
    module.exports = createApp();
}
