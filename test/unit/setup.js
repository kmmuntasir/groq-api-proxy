// Unit test setup file to load environment variables
const dotenv = require('dotenv');

// Load environment variables before any modules are imported
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';
