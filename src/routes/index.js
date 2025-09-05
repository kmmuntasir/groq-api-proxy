const express = require('express');
const chatRoutes = require('./chatRoutes');
const { notFoundHandler } = require('../middleware/errorHandler');

/**
 * Main Routes Handler
 * Organizes and registers all application routes
 */
const setupRoutes = (app) => {
    
    // API Routes
    app.use('/chat', chatRoutes);
    
    // Health check endpoint (general)
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'groq-api-proxy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });
    
    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            name: 'Groq API Proxy',
            version: '1.0.0',
            description: 'Secure proxy backend for Groq AI API',
            endpoints: {
                'POST /chat': 'Create chat completion',
                'GET /chat/health': 'Chat service health check',
                'GET /chat/models': 'Get available models',
                'GET /health': 'General health check'
            },
            documentation: 'See README.md for detailed usage instructions'
        });
    });
    
    // 404 handler for undefined routes (must be last)
    app.use(notFoundHandler);
};

module.exports = setupRoutes;
