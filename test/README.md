# Test Structure

This directory contains a comprehensive test suite for the groq-api-proxy application, organized into different categories for maintainability and clarity.

## Directory Structure

```
test/
├── utils/                    # Shared test utilities and helpers
│   ├── testSetup.js         # Server setup/teardown helpers
│   └── mocks.js             # Mock factories and assertions
├── unit/                    # Unit tests for individual modules
│   ├── groq.service.test.js # Tests for Groq service
│   ├── chat.controller.test.js # Tests for chat controller
│   └── middleware.test.js   # Tests for middleware functions
├── integration/             # Integration tests for full API flows
│   └── chat.api.test.js     # End-to-end API tests
└── README.md               # This file
```

## Test Categories

### Unit Tests (`test/unit/`)
Tests individual modules in isolation with mocked dependencies:
- **groq.service.test.js**: Tests Groq API service logic
- **chat.controller.test.js**: Tests chat endpoint controller
- **middleware.test.js**: Tests request validation, logging, and error handling

### Integration Tests (`test/integration/`)
Tests complete API flows from request to response:
- **chat.api.test.js**: Full API endpoint testing with real HTTP requests

### Test Utilities (`test/utils/`)
Shared helpers and mock factories:
- **testSetup.js**: Server lifecycle management
- **mocks.js**: Mock data factories and common assertions

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Framework Stack

- **Mocha**: Test runner and framework
- **Chai**: Assertion library with expect syntax
- **Sinon**: Mocking and stubbing library
- **Supertest**: HTTP integration testing
- **Cross-env**: Environment variable management

## Writing New Tests

### Unit Tests
1. Create test file in appropriate `test/unit/` subdirectory
2. Import module under test and required utilities
3. Use Sinon to mock dependencies
4. Focus on testing single module behavior

### Integration Tests  
1. Create test file in `test/integration/`
2. Use supertest for HTTP request testing
3. Test complete request/response cycles
4. Verify middleware, routing, and error handling

### Best Practices
- Use descriptive test names that explain the expected behavior
- Group related tests with `describe()` blocks
- Use `beforeEach/afterEach` for setup/cleanup
- Mock external dependencies (Groq API, file system, etc.)
- Test both success and error scenarios
- Use shared utilities from `test/utils/` for common patterns

## Mock Strategy

Tests use mocked Groq API responses to ensure:
- Tests run quickly and reliably
- No external API dependencies
- Predictable test data
- Cost-effective testing (no API charges)

Real Groq API integration can be tested separately in a dedicated integration environment.
