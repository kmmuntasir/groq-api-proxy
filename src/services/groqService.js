const Groq = require('groq-sdk');
const { logger } = require('../utils/logger');
const { config } = require('../config');
const { DEFAULTS, ERROR_MESSAGES } = require('../utils/constants');

/**
 * Groq API Service
 * Handles all interactions with the Groq API
 */
class GroqService {
    constructor() {
        this.groq = new Groq({
            apiKey: config.groqApiKey
        });
        
        // Log API key status on initialization
        logger.info("GROQ_API_KEY from environment:", { 
            status: config.groqApiKey ? "Set" : "Not Set" 
        });
        logger.info("GROQ_API_KEY value (first 5 chars):", { 
            value: config.groqApiKey ? config.groqApiKey.substring(0, 5) + "..." : "" 
        });
    }

    /**
     * Create a chat completion using the Groq API
     * @param {Object} params - Chat completion parameters
     * @param {Array} params.messages - Array of message objects
     * @param {string} [params.model] - Model to use (defaults to configured default)
     * @param {number} [params.temperature] - Temperature setting (0-2)
     * @param {number} [params.top_p] - Top-p setting (0-1)
     * @param {Object} [params.rest] - Additional parameters
     * @returns {Promise<Object>} Chat completion response
     * @throws {Error} When API call fails
     */
    async createChatCompletion({ messages, model, temperature, top_p, ...rest }) {
        try {
            const completion = await this.groq.chat.completions.create({
                model: model || config.defaultModel,
                messages: messages,
                temperature: temperature || DEFAULTS.TEMPERATURE,
                top_p: top_p || DEFAULTS.TOP_P,
                ...rest
            });

            // Handle null/empty responses
            if (!completion) {
                logger.warn('Groq API returned null/empty response');
                return completion;
            }

            // Log successful API call
            logger.info('Groq API call successful', {
                model: completion.model,
                usage: completion.usage,
                choices: completion.choices?.length || 0
            });

            return completion;
        } catch (error) {
            // Log API errors with context
            logger.error('Groq API error', {
                error: error.message,
                stack: error.stack,
                model: model || config.defaultModel,
                messageCount: messages?.length || 0
            });

            // Re-throw with more context for upstream handling
            const apiError = new Error(`${ERROR_MESSAGES.GROQ_API_ERROR}: ${error.message}`);
            apiError.originalError = error;
            apiError.statusCode = error.status || 500;
            throw apiError;
        }
    }

    /**
     * Get available models (future enhancement)
     * @returns {Promise<Array>} Array of available models
     */
    async getModels() {
        try {
            // This would be implemented when Groq SDK supports model listing
            logger.info('Fetching available models');
            // const models = await this.groq.models.list();
            // return models;
            
            // For now, return default model info
            return [{
                id: config.defaultModel,
                name: config.defaultModel,
                description: 'Default Groq model'
            }];
        } catch (error) {
            logger.error('Error fetching models', { error: error.message });
            throw new Error('Failed to fetch available models');
        }
    }

    /**
     * Health check for the Groq service
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            // Simple health check with minimal API call
            const testCompletion = await this.groq.chat.completions.create({
                model: config.defaultModel,
                messages: [{ role: 'user', content: 'health check' }],
                max_tokens: 1
            });

            return {
                status: 'healthy',
                model: testCompletion.model,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Groq service health check failed', { error: error.message });
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
const groqService = new GroqService();
module.exports = groqService;
