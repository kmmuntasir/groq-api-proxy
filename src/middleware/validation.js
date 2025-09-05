const { ERROR_MESSAGES, HTTP_STATUS } = require('../utils/constants');

/**
 * Validates chat request parameters
 * Ensures messages array is present and not empty
 */
const validateChatRequest = (req, res, next) => {
    const { messages } = req.body;

    // Check if messages exist and is an array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
            error: ERROR_MESSAGES.MESSAGES_REQUIRED 
        });
    }

    // Validate each message has required properties
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        if (!message.role || !message.content) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: `Message at index ${i} is missing required fields (role, content)`
            });
        }

        if (typeof message.role !== 'string' || typeof message.content !== 'string') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: `Message at index ${i} has invalid field types (role and content must be strings)`
            });
        }
    }

    next();
};

/**
 * Validates optional parameters for chat requests
 */
const validateChatParameters = (req, res, next) => {
    const { temperature, top_p, max_tokens, model } = req.body;

    // Validate temperature (0 to 2)
    if (temperature !== undefined) {
        if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Temperature must be a number between 0 and 2'
            });
        }
    }

    // Validate top_p (0 to 1)
    if (top_p !== undefined) {
        if (typeof top_p !== 'number' || top_p < 0 || top_p > 1) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'top_p must be a number between 0 and 1'
            });
        }
    }

    // Validate max_tokens (positive integer)
    if (max_tokens !== undefined) {
        if (!Number.isInteger(max_tokens) || max_tokens <= 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'max_tokens must be a positive integer'
            });
        }
    }

    // Validate model (string)
    if (model !== undefined && typeof model !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'model must be a string'
        });
    }

    next();
};

module.exports = {
    validateChatRequest,
    validateChatParameters
};
