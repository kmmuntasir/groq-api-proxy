const { expect } = require('chai');
const sinon = require('sinon');
const groqService = require('../../src/services/groqService');
const { createMockGroqResponse, createMockGroqError } = require('../utils/mocks');

describe('Groq Service', () => {
    let groqStub;

    beforeEach(() => {
        // Stub the actual Groq SDK instance within the service
        groqStub = sinon.stub(groqService.groq.chat.completions, 'create');
    });

    afterEach(() => {
        groqStub.restore();
    });

    describe('createChatCompletion', () => {
        it('should successfully call Groq API and return response', async () => {
            const mockResponse = createMockGroqResponse({
                model: 'llama3-8b-8192',
                content: 'Test response'
            });

            groqStub.resolves(mockResponse);

            const params = {
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: 'Test message' }]
            };

            const result = await groqService.createChatCompletion(params);

            expect(groqStub.calledOnce).to.be.true;
            expect(result).to.deep.equal(mockResponse);
        });

        it('should pass through all parameters to Groq API', async () => {
            const mockResponse = createMockGroqResponse();
            groqStub.resolves(mockResponse);

            const params = {
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: 'Test message' }],
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 100
            };

            await groqService.createChatCompletion(params);

            const callArgs = groqStub.getCall(0).args[0];
            expect(callArgs).to.include({
                model: params.model,
                temperature: params.temperature,
                top_p: params.top_p,
                max_tokens: params.max_tokens
            });
            expect(callArgs.messages).to.deep.equal(params.messages);
        });

        it('should handle Groq API errors and re-throw with context', async () => {
            const originalError = createMockGroqError('API rate limit exceeded', 429);
            groqStub.rejects(originalError);

            const params = {
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: 'Test message' }]
            };

            try {
                await groqService.createChatCompletion(params);
                expect.fail('Expected error to be thrown');
            } catch (error) {
                expect(error.message).to.include('Failed to communicate with Groq API');
                expect(error.message).to.include(originalError.message);
                expect(error.originalError).to.equal(originalError);
                expect(error.statusCode).to.equal(429);
            }
        });

        it('should use default model when not specified', async () => {
            const mockResponse = createMockGroqResponse();
            groqStub.resolves(mockResponse);

            const params = {
                messages: [{ role: 'user', content: 'Test message' }]
            };

            await groqService.createChatCompletion(params);

            const callArgs = groqStub.getCall(0).args[0];
            expect(callArgs.model).to.equal('llama-3.1-8b-instant'); // Default model from config
        });

        it('should handle null/empty responses gracefully', async () => {
            groqStub.resolves(null);

            const params = {
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: 'Test message' }]
            };

            const result = await groqService.createChatCompletion(params);
            expect(result).to.be.null;
        });

        it('should handle API errors without status code', async () => {
            const originalError = new Error('Network error');
            groqStub.rejects(originalError);

            const params = {
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: 'Test message' }]
            };

            try {
                await groqService.createChatCompletion(params);
                expect.fail('Expected error to be thrown');
            } catch (error) {
                expect(error.statusCode).to.equal(500);
                expect(error.originalError).to.equal(originalError);
            }
        });
    });

    describe('healthCheck', () => {
        it('should return healthy status when API call succeeds', async () => {
            const mockResponse = createMockGroqResponse();
            groqStub.resolves(mockResponse);

            const result = await groqService.healthCheck();

            expect(result.status).to.equal('healthy');
            expect(result.model).to.equal(mockResponse.model);
            expect(result.timestamp).to.be.a('string');
        });

        it('should return unhealthy status when API call fails', async () => {
            const error = new Error('API unavailable');
            groqStub.rejects(error);

            const result = await groqService.healthCheck();

            expect(result.status).to.equal('unhealthy');
            expect(result.error).to.equal(error.message);
            expect(result.timestamp).to.be.a('string');
        });
    });

    describe('getModels', () => {
        it('should return default model information', async () => {
            const models = await groqService.getModels();

            expect(models).to.be.an('array');
            expect(models).to.have.length(1);
            expect(models[0]).to.have.property('id');
            expect(models[0]).to.have.property('name');
            expect(models[0]).to.have.property('description');
        });
    });
});
