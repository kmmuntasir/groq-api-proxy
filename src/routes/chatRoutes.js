const express = require('express');
const chatController = require('../controllers/chatController');
const { validateChatRequest } = require('../middleware/validation');

/**
 * Chat Routes
 * Handles all chat-related endpoints with appropriate middleware
 */
const router = express.Router();

/**
 * POST /chat
 * Create a chat completion
 * 
 * @route   POST /chat
 * @desc    Create a chat completion using Groq API
 * @access  Public
 * @body    {Object} { model, messages, temperature, top_p, ...rest }
 * @returns {Object} Chat completion response from Groq API
 */
router.post('/', 
    validateChatRequest,
    chatController.createChatCompletion.bind(chatController)
);

/**
 * GET /chat/health
 * Health check for chat functionality
 * 
 * @route   GET /chat/health
 * @desc    Check if chat service is healthy
 * @access  Public
 * @returns {Object} Health status of chat service
 */
router.get('/health', 
    chatController.healthCheck.bind(chatController)
);

/**
 * GET /chat/models
 * Get available models (future enhancement)
 * 
 * @route   GET /chat/models
 * @desc    Get list of available models
 * @access  Public
 * @returns {Object} List of available models
 */
router.get('/models', 
    chatController.getModels.bind(chatController)
);

module.exports = router;
