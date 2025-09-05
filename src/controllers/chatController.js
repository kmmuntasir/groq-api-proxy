const groqService = require('../services/groqService');
const { config } = require('../config');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Chat Controller
 * Handles chat completion requests and coordinates with the Groq service
 */
class ChatController {
    
    /**
     * Handle chat completion request
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    async createChatCompletion(req, res) {
        try {
            const { model, messages, temperature, top_p, ...rest } = req.body;

            // Call Groq service to create chat completion
            const completion = await groqService.createChatCompletion({
                model,
                messages,
                temperature,
                top_p,
                ...rest
            });

            // Return successful response
            res.status(HTTP_STATUS.OK).json(completion);

        } catch (error) {
            // Error is already logged in groqService, just respond with appropriate status
            const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
            
            res.status(statusCode).json({
                error: error.message,
                // Only include additional error details in development mode
                ...(config.isDevelopment && { 
                    details: error.originalError?.message,
                    timestamp: new Date().toISOString()
                })
            });
        }
    }

    /**
     * Health check endpoint for chat functionality
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    async healthCheck(req, res) {
        try {
            const healthStatus = await groqService.healthCheck();
            
            const statusCode = healthStatus.status === 'healthy' 
                ? HTTP_STATUS.OK 
                : HTTP_STATUS.INTERNAL_SERVER_ERROR;
                
            res.status(statusCode).json({
                service: 'chat',
                ...healthStatus
            });
            
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                service: 'chat',
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get available models endpoint (future enhancement)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    async getModels(req, res) {
        try {
            const models = await groqService.getModels();
            
            res.status(HTTP_STATUS.OK).json({
                models,
                count: models.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Export singleton instance
const chatController = new ChatController();
module.exports = chatController;
