# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

The groq-api-proxy is a secure, configurable proxy backend for the Groq AI API. It acts as a middleware layer between frontend applications and the Groq API, keeping the API key server-side for security. The application follows a modular architecture with clear separation of concerns across configuration, middleware, services, controllers, routes, and utilities layers.

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test
```

### Docker Development
```bash
# Build Docker image
docker build -t groq-api-proxy .

# Run with Docker Compose (recommended)
docker-compose up -d

# Stop Docker Compose services
docker-compose down

# Run single container
docker run -p 3001:3001 --env-file .env groq-api-proxy
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run tests with verbose output
NODE_ENV=test mocha test/**/*.test.js --reporter spec

# Run specific test file
NODE_ENV=test mocha test/integration/chat.api.test.js
```

## Architecture & Code Structure

### Core Components

**Application Entry (`index.js`)**
- Lightweight entry point that conditionally starts server or exports app for testing
- Environment loading and basic setup

**Application Setup (`src/app.js`)**
- Express application configuration with all middleware
- Route mounting and static file serving
- Error handling setup

**Server Management (`src/server.js`)**
- HTTP server lifecycle management
- Graceful shutdown handling
- Process signal management

**Configuration Layer (`src/config/`)**
- Environment variable management (`index.js`)
- CORS configuration (`cors.js`)
- Centralized application settings

**Middleware Layer (`src/middleware/`)**
- Request validation (`validation.js`)
- Request/response logging (`requestLogger.js`)
- Error handling (`errorHandler.js`)
- JSON parsing error management

**Service Layer (`src/services/`)**
- Groq API integration (`groqService.js`)
- Business logic encapsulation
- External service communication

**Controller Layer (`src/controllers/`)**
- Request handling logic (`chatController.js`)
- Response formatting
- Service coordination

**Routes Layer (`src/routes/`)**
- API endpoint definitions (`chatRoutes.js`)
- Route organization (`index.js`)
- Static file route handling

**Utilities (`src/utils/`)**
- Winston logger with boxed formatting (`logger.js`)
- Application constants (`constants.js`)
- Shared helper functions

**Configuration**
- Environment-based configuration via `.env` file
- Required: `GROQ_API_KEY`, optional: `PORT`, `DEFAULT_MODEL`, `LOG_LEVEL`
- Defaults: PORT=3001, DEFAULT_MODEL="llama-3.1-8b-instant", LOG_LEVEL="info"

**Logging System**
- Winston with dual transport: Console (boxed format) + Daily rotating files (boxed format)
- Log files stored in `/logs/` directory with date pattern YYYY-MM-DD
- Beautiful boxed console logging with rounded corners and dividers for HTTP requests/responses
- Both console and log files use identical formatting for consistency
- Comprehensive logging includes method, URL, status, duration, payload sizes, headers, and full request/response bodies
- Log levels: error, warn, info, debug

### API Design

**Single Endpoint: POST /chat**
- Accepts standard Groq Chat Completion parameters
- Required: `messages` array (non-empty)
- Optional: `model`, `temperature`, `top_p`, and any other Groq API parameters
- Returns complete Groq API response unchanged
- Error handling for missing messages, JSON parsing errors, and Groq API failures

### Testing Architecture

**Test Framework: Mocha + Chai + Sinon + Supertest**
- Organized into unit, integration, and utility tests
- Sinon for mocking and stubbing external dependencies
- Supertest for HTTP endpoint testing
- Test environment detection via `NODE_ENV=test`
- Comprehensive test coverage across all application layers

**Test Organization:**
- **Unit Tests** (`test/unit/`) - Individual module testing in isolation
  - `groq.service.test.js` - Groq API service logic
  - `chat.controller.test.js` - Controller behavior
  - `middleware.test.js` - Middleware functionality
- **Integration Tests** (`test/integration/`) - Full API workflow testing
  - `chat.api.test.js` - End-to-end API testing
- **Test Utilities** (`test/utils/`) - Shared testing infrastructure
  - `testSetup.js` - Server lifecycle helpers
  - `mocks.js` - Mock factories and assertions

**Key Test Patterns:**
- Service mocking using `sinon.stub(groqService, 'createChatCompletion')`
- HTTP request/response validation with supertest
- Mock data factories for consistent test data
- Shared assertions for response validation
- Server setup/teardown automation

## Environment Setup

### Required Environment Variables
```bash
# .env file structure
PORT=3001                           # Server port
GROQ_API_KEY=YOUR_GROQ_API_KEY     # Groq API key (required)
DEFAULT_MODEL=llama-3.1-8b-instant # Default model if not specified
LOG_LEVEL=info                     # Winston log level
```

### Production Considerations
- Ensure `GROQ_API_KEY` is securely managed
- Consider restricting CORS origins in production
- Log rotation configured for 14 days retention, 20MB max size
- Docker image uses Node.js 22 Alpine for minimal size

## Development Workflow

### Making Changes
1. Environment setup: Copy `example.env` to `.env` and configure
2. Start development server: `npm run dev` 
3. Make code changes (auto-reload enabled via nodemon)
4. Run tests: `npm test`
5. Build/test Docker image if needed

### Key Files to Understand
- `index.js`: Application entry point with conditional server startup
- `src/app.js`: Express application setup and middleware configuration
- `src/server.js`: Server lifecycle and graceful shutdown management
- `src/services/groqService.js`: Groq API integration and error handling
- `src/controllers/chatController.js`: Request handling and response formatting
- `src/utils/logger.js`: Winston logger with beautiful boxed formatting
- `test/integration/chat.api.test.js`: End-to-end API testing
- `test/utils/mocks.js`: Mock factories and shared assertions
- `example.env`: Environment variable template
- `docker-compose.yml`: Simple single-service Docker setup
- `WARP.md`: This development guide

### Logging Format

**Console Output**: Beautiful boxed format with rounded corners for HTTP requests and responses
```
2025-09-05 20:23:19.662 [info] Incoming request
┌────────────────────────────────────────────────────────────────────────────────┐
│ METHOD: POST │
│ URL: /chat │
├────────────────────────────────────────────────────────────────────────────────┤
│ HEADERS: │
│ {
│   "content-type": "application/json",
│   "user-agent": "curl/8.5.0",
│   "x-forwarded-for": "::1"
│ }
├────────────────────────────────────────────────────────────────────────────────┤
│ BODY: │
│ {
│   "messages": [
│     {
│       "role": "user",
│       "content": "Test message"
│     }
│   ]
│ }
└────────────────────────────────────────────────────────────────────────────────┘

2025-09-05 20:45:08.226 [info] Groq API call successful
┌────────────────────────────────────────────────────────────────────────────────┐
│ MODEL: llama3-8b-8192 │
│ CHOICES: 1 | TOKENS: 15 | TIME: 150ms │
├────────────────────────────────────────────────────────────────────────────────┤
│ USAGE DETAILS: │
│ {
│   "prompt_tokens": 10,
│   "completion_tokens": 5,
│   "total_tokens": 15
│ }
└────────────────────────────────────────────────────────────────────────────────┘

2025-09-05 20:23:21.247 [info] Outgoing response
┌────────────────────────────────────────────────────────────────────────────────┐
│ REQUEST: POST /chat │
│ STATUS: 200 | DURATION: 1586ms | SIZE: 2599 bytes │
├────────────────────────────────────────────────────────────────────────────────┤
│ RESPONSE: │
│ {
│   "id": "chatcmpl-...",
│   "object": "chat.completion",
│   "choices": [...]
│ }
└────────────────────────────────────────────────────────────────────────────────┘
```

**Log Files**: Same beautiful boxed format as console for consistent readability

### Debugging
- Check console logs for beautifully formatted boxed request/response data
- Review daily log files in `/logs/` directory for identical boxed-formatted historical data
- Both console and log files show clear boxed format with method, URL, status, duration, and full payloads
- Error logs include stack traces and detailed error context

## Deployment Notes

The application is designed for simple deployment across various platforms:
- Modular architecture with clear separation of concerns
- Lightweight entry point for easy deployment
- Docker support with multi-stage build
- Environment-based configuration
- Graceful shutdown handling for production reliability
- Health check accessible via static file serving
- CORS pre-configured for frontend integration
- Comprehensive logging for debugging and monitoring

## Architecture Benefits

The modular architecture provides:
- **Maintainability** - Clear separation of concerns across layers
- **Testability** - Isolated unit testing of individual components
- **Scalability** - Easy to extend with new features and endpoints
- **Reliability** - Proper error handling and graceful shutdown
- **Debuggability** - Comprehensive logging with beautiful formatting

The proxy maintains complete transparency with the Groq API, passing through all parameters and returning unmodified responses while providing security, logging, and error handling layers.
