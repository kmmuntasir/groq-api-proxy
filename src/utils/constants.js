// Application constants and default values

// Default Groq API configuration
const DEFAULTS = {
    MODEL: 'llama-3.1-8b-instant',
    TEMPERATURE: 0.7,
    TOP_P: 1,
    PORT: 3001,
    LOG_LEVEL: 'info'
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500
};

// Error Messages
const ERROR_MESSAGES = {
    MESSAGES_REQUIRED: 'Messages are required.',
    JSON_PARSE_ERROR: 'Failed to parse JSON body.',
    GROQ_API_ERROR: 'Failed to communicate with Groq API',
    INVALID_REQUEST: 'Invalid request format'
};

// Box Drawing Characters (for future use if needed)
const BOX_CHARS = {
    TOP_LEFT: '┌',
    TOP_RIGHT: '┐',
    BOTTOM_LEFT: '└',
    BOTTOM_RIGHT: '┘',
    HORIZONTAL: '─',
    VERTICAL: '│',
    CROSS_LEFT: '├',
    CROSS_RIGHT: '┤'
};

// Service Configuration
const SERVICE_CONFIG = {
    NAME: 'groq-api-proxy',
    LOG_FILE_PATTERN: 'logs/%DATE%.log',
    LOG_DATE_PATTERN: 'YYYY-MM-DD',
    LOG_MAX_SIZE: '20m',
    LOG_MAX_FILES: '14d'
};

module.exports = {
    DEFAULTS,
    HTTP_STATUS,
    ERROR_MESSAGES,
    BOX_CHARS,
    SERVICE_CONFIG
};
