const { config } = require('./index');

// CORS configuration based on environment
const getCorsOptions = () => {
    if (config.isProduction) {
        // In production, you might want to restrict origins
        return {
            origin: process.env.ALLOWED_ORIGINS ? 
                process.env.ALLOWED_ORIGINS.split(',') : 
                true, // Allow all origins if not specified
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: false
        };
    } else {
        // In development/test, allow all origins
        return {
            origin: true,
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            credentials: false
        };
    }
};

module.exports = {
    getCorsOptions
};
