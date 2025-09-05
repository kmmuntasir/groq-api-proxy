const { expect } = require('chai');
const sinon = require('sinon');
const chatController = require('../../src/controllers/chatController');
const groqService = require('../../src/services/groqService');
const { createMockGroqResponse, createMockGroqError, createMockRequest } = require('../utils/mocks');

describe('Chat Controller', () => {
    let req, res, groqServiceStub;

    beforeEach(() => {
        req = {
            body: createMockRequest()
        };
        
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis()
        };
        
        groqServiceStub = sinon.stub(groqService, 'createChatCompletion');
    });

    afterEach(() => {
        groqServiceStub.restore();
    });

    describe('createChatCompletion', () => {
        it('should successfully process valid chat request', async () => {
            const mockResponse = createMockGroqResponse({
                model: 'llama3-8b-8192',
                content: 'Hello! How can I help you?'
            });

            groqServiceStub.resolves(mockResponse);

            await chatController.createChatCompletion(req, res);

            expect(groqServiceStub.calledOnce).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(mockResponse)).to.be.true;
        });

        it('should pass all request parameters to groq service', async () => {
            const mockResponse = createMockGroqResponse();
            groqServiceStub.resolves(mockResponse);

            const requestWithParams = createMockRequest({
                temperature: 0.8,
                top_p: 0.95,
                max_tokens: 150
            });
            req.body = requestWithParams;

            await chatController.createChatCompletion(req, res);

            const callArgs = groqServiceStub.getCall(0).args[0];
            expect(callArgs).to.include({
                model: requestWithParams.model,
                temperature: requestWithParams.temperature,
                top_p: requestWithParams.top_p,
                max_tokens: requestWithParams.max_tokens
            });
            expect(callArgs.messages).to.deep.equal(requestWithParams.messages);
        });

        it('should handle groq service errors with status code', async () => {
            const mockError = createMockGroqError('Service unavailable', 503);
            mockError.statusCode = 503;
            groqServiceStub.rejects(mockError);

            await chatController.createChatCompletion(req, res);

            expect(groqServiceStub.calledOnce).to.be.true;
            expect(res.status.calledWith(503)).to.be.true;
            expect(res.json.calledWith({
                error: mockError.message
            })).to.be.true;
        });

        it('should handle groq service errors without status code', async () => {
            const mockError = new Error('Unexpected error');
            groqServiceStub.rejects(mockError);

            await chatController.createChatCompletion(req, res);

            expect(res.status.calledWith(500)).to.be.true;
            expect(res.json.calledWith({
                error: mockError.message
            })).to.be.true;
        });

        it('should handle empty response from groq service', async () => {
            groqServiceStub.resolves(null);

            await chatController.createChatCompletion(req, res);

            expect(groqServiceStub.calledOnce).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(null)).to.be.true;
        });

        it('should preserve request body structure when calling service', async () => {
            const mockResponse = createMockGroqResponse();
            groqServiceStub.resolves(mockResponse);

            const customRequest = {
                model: 'custom-model',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Hello!' }
                ],
                temperature: 0.5,
                custom_param: 'custom_value'
            };
            req.body = customRequest;

            await chatController.createChatCompletion(req, res);

            const callArgs = groqServiceStub.getCall(0).args[0];
            expect(callArgs.messages).to.deep.equal(customRequest.messages);
            expect(callArgs.model).to.equal(customRequest.model);
            expect(callArgs.temperature).to.equal(customRequest.temperature);
            expect(callArgs.custom_param).to.equal(customRequest.custom_param);
        });
    });
});
