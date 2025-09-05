const sinon = require('sinon');

/**
 * Mock Groq API response factory
 * @param {Object} options - Response configuration options
 * @param {string} options.model - Model name
 * @param {string} options.content - Response content
 * @param {Object} options.usage - Token usage stats
 * @returns {Object} Mocked Groq API response
 */
function createMockGroqResponse(options = {}) {
    const {
        model = 'test-model',
        content = 'This is a mocked response.',
        usage = {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15
        }
    } = options;

    return {
        id: `test-chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model,
        choices: [
            {
                index: 0,
                message: { 
                    role: 'assistant', 
                    content 
                },
                finish_reason: 'stop'
            }
        ],
        usage
    };
}

/**
 * Mock Groq API error factory
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Mocked Groq API error
 */
function createMockGroqError(message = 'API Error', statusCode = 500) {
    const error = new Error(message);
    error.status = statusCode;
    error.statusCode = statusCode;
    return error;
}

/**
 * Create a stubbed Groq service instance
 * @param {Object} groqService - Groq service instance to stub
 * @param {Object} options - Stubbing options
 * @returns {sinon.SinonStub} Stubbed method
 */
function createGroqServiceStub(groqService, options = {}) {
    const {
        shouldSucceed = true,
        response = createMockGroqResponse(),
        error = createMockGroqError()
    } = options;

    const stub = sinon.stub(groqService, 'createChatCompletion');
    
    if (shouldSucceed) {
        stub.resolves(response);
    } else {
        stub.rejects(error);
    }
    
    return stub;
}

/**
 * Create mock request data
 * @param {Object} options - Request configuration options
 * @returns {Object} Mock request data
 */
function createMockRequest(options = {}) {
    const {
        model = 'llama3-8b-8192',
        messages = [{ role: 'user', content: 'Hello world' }],
        temperature,
        top_p,
        ...otherParams
    } = options;

    const request = {
        model,
        messages,
        ...otherParams
    };

    if (temperature !== undefined) request.temperature = temperature;
    if (top_p !== undefined) request.top_p = top_p;

    return request;
}

/**
 * Create common test assertions for Groq API responses
 * @param {Object} response - Response to validate
 * @param {Object} chai - Chai assertion library
 */
function assertValidGroqResponse(response, chai) {
    const { expect } = chai;
    
    expect(response).to.have.property('id');
    expect(response).to.have.property('object').and.to.equal('chat.completion');
    expect(response).to.have.property('created').and.to.be.a('number');
    expect(response).to.have.property('model').and.to.be.a('string');
    expect(response).to.have.property('choices').and.to.be.an('array').and.not.be.empty;
    expect(response).to.have.property('usage').and.to.be.an('object');
    
    const choice = response.choices[0];
    expect(choice).to.have.property('index').and.to.be.a('number');
    expect(choice).to.have.property('message').and.to.be.an('object');
    expect(choice.message).to.have.property('role').and.to.equal('assistant');
    expect(choice.message).to.have.property('content').and.to.be.a('string');
    expect(choice).to.have.property('finish_reason');
    
    const usage = response.usage;
    expect(usage).to.have.property('prompt_tokens').and.to.be.a('number');
    expect(usage).to.have.property('completion_tokens').and.to.be.a('number');
    expect(usage).to.have.property('total_tokens').and.to.be.a('number');
}

/**
 * Create common test assertions for error responses
 * @param {Object} response - Error response to validate
 * @param {string} expectedMessage - Expected error message
 * @param {Object} chai - Chai assertion library
 */
function assertErrorResponse(response, expectedMessage, chai) {
    const { expect } = chai;
    
    expect(response).to.have.property('error').and.to.equal(expectedMessage);
}

module.exports = {
    createMockGroqResponse,
    createMockGroqError,
    createGroqServiceStub,
    createMockRequest,
    assertValidGroqResponse,
    assertErrorResponse
};
