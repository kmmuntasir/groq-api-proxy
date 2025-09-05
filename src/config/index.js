const { DEFAULTS } = require('../utils/constants');

// Environment configuration with validation and defaults
const config = {
    // Server configuration
    port: process.env.PORT || DEFAULTS.PORT,
    
    // Groq API configuration
    groqApiKey: process.env.GROQ_API_KEY,
    defaultModel: process.env.DEFAULT_MODEL || DEFAULTS.MODEL,
    
    // Logging configuration
    logLevel: process.env.LOG_LEVEL || DEFAULTS.LOG_LEVEL,
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Validation flags
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isTest: process.env.NODE_ENV === 'test'
};

// Validation function to ensure required environment variables are set
const validateConfig = () => {
    const errors = [];
    
    if (!config.groqApiKey) {
        errors.push('GROQ_API_KEY environment variable is required');
    }
    
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
    
    return true;
};

// Validate configuration on module load (except in test environment)
if (config.nodeEnv !== 'test') {
    try {
        validateConfig();
    } catch (error) {
        console.error('Configuration Error:', error.message);
        process.exit(1);
    }
}

module.exports = {
    config,
    validateConfig
};
