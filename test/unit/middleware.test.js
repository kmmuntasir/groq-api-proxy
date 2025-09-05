const { expect } = require('chai');
const sinon = require('sinon');
const { validateChatRequest } = require('../../src/middleware/validation');
const requestLogger = require('../../src/middleware/requestLogger');
const { globalErrorHandler, jsonErrorHandler } = require('../../src/middleware/errorHandler');
const { logger } = require('../../src/utils/logger');

describe('Middleware', () => {
    let req, res, next, loggerStub;

    beforeEach(() => {
        req = {
            method: 'POST',
            originalUrl: '/chat',
            url: '/chat',
            get: sinon.stub(),
            body: {},
            headers: {
                'content-type': 'application/json',
                'user-agent': 'test-agent',
                'x-forwarded-for': '127.0.0.1'
            },
            ip: '127.0.0.1'
        };
        
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis(),
            on: sinon.stub(),
            locals: {},
            statusCode: 200
        };
        
        next = sinon.stub();
        loggerStub = sinon.stub(logger, 'info');
    });

    afterEach(() => {
        loggerStub.restore();
    });

    describe('Validation Middleware', () => {
        describe('validateChatRequest', () => {
            it('should pass validation for valid request', () => {
                req.body = {
                    messages: [{ role: 'user', content: 'Hello' }]
                };

                validateChatRequest(req, res, next);

                expect(next.calledOnce).to.be.true;
                expect(res.status.called).to.be.false;
                expect(res.json.called).to.be.false;
            });

            it('should fail validation when messages are missing', () => {
                req.body = {};

                validateChatRequest(req, res, next);

                expect(res.status.calledWith(400)).to.be.true;
                expect(res.json.calledWith({ error: 'Messages are required.' })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should fail validation when messages array is empty', () => {
                req.body = { messages: [] };

                validateChatRequest(req, res, next);

                expect(res.status.calledWith(400)).to.be.true;
                expect(res.json.calledWith({ error: 'Messages are required.' })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should pass validation with other valid parameters', () => {
                req.body = {
                    model: 'llama3-8b-8192',
                    messages: [{ role: 'user', content: 'Hello' }],
                    temperature: 0.7,
                    top_p: 0.9
                };

                validateChatRequest(req, res, next);

                expect(next.calledOnce).to.be.true;
                expect(res.status.called).to.be.false;
                expect(res.json.called).to.be.false;
            });
        });
    });

    describe('Request Logger Middleware', () => {
        it('should log incoming requests', () => {
            req.body = { messages: [{ role: 'user', content: 'test' }] };

            requestLogger(req, res, next);

            expect(loggerStub.calledOnce).to.be.true;
            expect(next.calledOnce).to.be.true;
            
            // Verify the log was called with correct data
            const logCall = loggerStub.getCall(0);
            expect(logCall.args[0]).to.equal('Incoming request');
            expect(logCall.args[1]).to.have.property('method', 'POST');
            expect(logCall.args[1]).to.have.property('url', '/chat');
        });

        it('should handle requests without headers', () => {
            req.headers = {}; // Empty headers
            req.body = {};

            requestLogger(req, res, next);

            expect(loggerStub.calledOnce).to.be.true;
            expect(next.calledOnce).to.be.true;
        });

        it('should setup response logging by overriding res.json', () => {
            const originalJson = res.json;
            
            requestLogger(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(res.json).to.not.equal(originalJson); // Should be overridden
            
            // Test that calling res.json now logs the response
            const testResponse = { message: 'success' };
            res.json(testResponse);
            
            expect(loggerStub.calledTwice).to.be.true; // Once for request, once for response
            const responseLogCall = loggerStub.getCall(1);
            expect(responseLogCall.args[0]).to.equal('Outgoing response');
        });
    });

    describe('Error Handler Middleware', () => {
        describe('jsonErrorHandler', () => {
            it('should handle JSON parsing errors', () => {
                const error = new SyntaxError('Unexpected token');
                error.status = 400;
                error.body = '{invalid json';

                jsonErrorHandler(error, req, res, next);

                expect(res.status.calledWith(400)).to.be.true;
                expect(res.json.calledOnce).to.be.true;
                const callArgs = res.json.getCall(0).args[0];
                expect(callArgs.error).to.equal('Failed to parse JSON body.');
                expect(next.called).to.be.false;
            });

            it('should pass non-JSON errors to next middleware', () => {
                const error = new Error('Some other error');

                jsonErrorHandler(error, req, res, next);

                expect(res.status.called).to.be.false;
                expect(res.json.called).to.be.false;
                expect(next.calledOnceWith(error)).to.be.true;
            });

            it('should handle JSON parsing errors without body property', () => {
                const error = new SyntaxError('Invalid JSON');
                error.status = 400;
                // No body property

                jsonErrorHandler(error, req, res, next);

                expect(res.status.called).to.be.false;
                expect(res.json.called).to.be.false;
                expect(next.calledOnceWith(error)).to.be.true;
            });
        });

        describe('globalErrorHandler', () => {
            it('should handle errors with status codes', () => {
                const error = new Error('Not Found');
                error.status = 404;

                globalErrorHandler(error, req, res, next);

                expect(res.status.calledWith(500)).to.be.true;
                expect(res.json.calledOnce).to.be.true;
                const callArgs = res.json.getCall(0).args[0];
                expect(callArgs.error).to.equal('Internal server error');
            });

            it('should handle errors without status codes as 500', () => {
                const error = new Error('Internal Error');

                globalErrorHandler(error, req, res, next);

                expect(res.status.calledWith(500)).to.be.true;
                expect(res.json.calledOnce).to.be.true;
                const callArgs = res.json.getCall(0).args[0];
                expect(callArgs.error).to.equal('Internal server error');
            });

            it('should include error details in development mode', () => {
                const originalEnv = process.env.NODE_ENV;
                process.env.NODE_ENV = 'development';
                
                const error = new Error('Bad Request');

                globalErrorHandler(error, req, res, next);

                expect(res.status.calledWith(500)).to.be.true;
                expect(res.json.calledOnce).to.be.true;
                const callArgs = res.json.getCall(0).args[0];
                expect(callArgs.error).to.equal('Internal server error');
                expect(callArgs.details).to.equal('Bad Request');
                
                process.env.NODE_ENV = originalEnv;
            });
        });
    });
});
