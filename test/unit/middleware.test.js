const { expect } = require('chai');
const sinon = require('sinon');
const { validateChatRequest } = require('../../src/middleware/validation');
const { requestLogger } = require('../../src/middleware/requestLogger');
const { errorHandler, jsonErrorHandler } = require('../../src/middleware/errorHandler');
const { logger } = require('../../src/utils/logger');

describe('Middleware', () => {
    let req, res, next, loggerStub;

    beforeEach(() => {
        req = {
            method: 'POST',
            originalUrl: '/chat',
            get: sinon.stub(),
            body: {}
        };
        
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis(),
            on: sinon.stub(),
            locals: {}
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
            req.get.withArgs('content-type').returns('application/json');
            req.get.withArgs('user-agent').returns('test-agent');
            req.get.withArgs('x-forwarded-for').returns('127.0.0.1');
            
            req.body = { messages: [{ role: 'user', content: 'test' }] };

            requestLogger(req, res, next);

            expect(loggerStub.calledOnce).to.be.true;
            expect(next.calledOnce).to.be.true;
        });

        it('should handle requests without headers', () => {
            req.get.returns(undefined);
            req.body = {};

            requestLogger(req, res, next);

            expect(loggerStub.calledOnce).to.be.true;
            expect(next.calledOnce).to.be.true;
        });

        it('should setup response logging', () => {
            requestLogger(req, res, next);

            expect(res.on.calledWith('finish')).to.be.true;
            expect(next.calledOnce).to.be.true;
        });
    });

    describe('Error Handler Middleware', () => {
        describe('jsonErrorHandler', () => {
            it('should handle JSON parsing errors', () => {
                const error = new Error('Unexpected token');
                error.status = 400;

                jsonErrorHandler(error, req, res, next);

                expect(res.status.calledWith(400)).to.be.true;
                expect(res.json.calledWith({ error: 'Failed to parse JSON body.' })).to.be.true;
                expect(next.called).to.be.false;
            });

            it('should pass non-JSON errors to next middleware', () => {
                const error = new Error('Some other error');

                jsonErrorHandler(error, req, res, next);

                expect(res.status.called).to.be.false;
                expect(res.json.called).to.be.false;
                expect(next.calledOnceWith(error)).to.be.true;
            });

            it('should handle JSON parsing errors without status', () => {
                const error = new Error('Invalid JSON');

                jsonErrorHandler(error, req, res, next);

                expect(res.status.calledWith(400)).to.be.true;
                expect(res.json.calledWith({ error: 'Failed to parse JSON body.' })).to.be.true;
            });
        });

        describe('errorHandler', () => {
            it('should handle errors with status codes', () => {
                const error = new Error('Not Found');
                error.status = 404;

                errorHandler(error, req, res, next);

                expect(res.status.calledWith(404)).to.be.true;
                expect(res.json.calledWith({ error: 'Not Found' })).to.be.true;
            });

            it('should handle errors without status codes as 500', () => {
                const error = new Error('Internal Error');

                errorHandler(error, req, res, next);

                expect(res.status.calledWith(500)).to.be.true;
                expect(res.json.calledWith({ error: 'Internal server error.' })).to.be.true;
            });

            it('should use statusCode property if status is not available', () => {
                const error = new Error('Bad Request');
                error.statusCode = 400;

                errorHandler(error, req, res, next);

                expect(res.status.calledWith(400)).to.be.true;
                expect(res.json.calledWith({ error: 'Bad Request' })).to.be.true;
            });
        });
    });
});
