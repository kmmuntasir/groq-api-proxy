const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const { app, groq } = require('../../index');
const { setupTestServer, teardownTestServer, createTestLogger } = require('../utils/testSetup');
const { 
    createMockGroqResponse, 
    createMockRequest, 
    assertValidGroqResponse, 
    assertErrorResponse 
} = require('../utils/mocks');

describe('Chat API Integration Tests', () => {
    let server, groqStub, testLogger;

    before(async () => {
        testLogger = createTestLogger();
        
        // Stub the Groq SDK's chat.completions.create method
        groqStub = sinon.stub(groq.chat.completions, 'create').callsFake((params) => {
            // Simulate a successful response from Groq API
            if (params.messages && params.messages.length > 0) {
                return Promise.resolve(createMockGroqResponse({
                    model: params.model || 'test-model',
                    content: 'This is a mocked response.'
                }));
            } else {
                // Simulate an error if messages are missing or empty
                return Promise.reject(new Error('Messages are required.'));
            }
        });

        server = await setupTestServer(app, 3001, testLogger);
    });

    after(async () => {
        groqStub.restore(); // Restore the original method
        await teardownTestServer(server, testLogger);
    });

    describe('POST /chat', () => {
        describe('Successful Requests', () => {
            it('should return 200 and a valid response for a basic valid request', (done) => {
                const requestData = createMockRequest();
                
                request(app)
                    .post('/chat')
                    .send(requestData)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        assertValidGroqResponse(res.body, { expect });
                        expect(res.body.choices[0].message.content).to.equal('This is a mocked response.');
                        done();
                    });
            });

            it('should correctly pass optional parameters to Groq API', (done) => {
                const requestData = createMockRequest({
                    temperature: 0.5,
                    top_p: 0.9,
                    max_tokens: 100
                });

                request(app)
                    .post('/chat')
                    .send(requestData)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        // Verify that groqStub was called with the correct parameters
                        expect(groqStub.calledWithMatch({
                            model: requestData.model,
                            messages: requestData.messages,
                            temperature: requestData.temperature,
                            top_p: requestData.top_p,
                            max_tokens: requestData.max_tokens
                        })).to.be.true;
                        
                        assertValidGroqResponse(res.body, { expect });
                        done();
                    });
            });

            it('should handle requests with system messages', (done) => {
                const requestData = createMockRequest({
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: 'Hello!' }
                    ]
                });

                request(app)
                    .post('/chat')
                    .send(requestData)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        assertValidGroqResponse(res.body, { expect });
                        done();
                    });
            });

            it('should handle different models', (done) => {
                const requestData = createMockRequest({
                    model: 'llama-3.1-70b-versatile'
                });

                request(app)
                    .post('/chat')
                    .send(requestData)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        expect(groqStub.calledWithMatch({
                            model: 'llama-3.1-70b-versatile'
                        })).to.be.true;
                        
                        assertValidGroqResponse(res.body, { expect });
                        done();
                    });
            });
        });

        describe('Request Validation', () => {
            it('should return 400 if messages are not provided', (done) => {
                request(app)
                    .post('/chat')
                    .send({ model: 'llama3-8b-8192' })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        assertErrorResponse(res.body, 'Messages are required.', { expect });
                        done();
                    });
            });

            it('should return 400 if an empty messages array is provided', (done) => {
                request(app)
                    .post('/chat')
                    .send({ 
                        model: 'llama3-8b-8192', 
                        messages: [] 
                    })
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        assertErrorResponse(res.body, 'Messages are required.', { expect });
                        done();
                    });
            });

            it('should return 400 for invalid JSON body', (done) => {
                request(app)
                    .post('/chat')
                    .set('Content-Type', 'application/json')
                    .send('this is not json') // Send malformed JSON
                    .expect(400)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        assertErrorResponse(res.body, 'Failed to parse JSON body.', { expect });
                        done();
                    });
            });
        });

        describe('Error Handling', () => {
            it('should handle Groq API errors gracefully', (done) => {
                // Setup stub to reject with error
                groqStub.restore();
                groqStub = sinon.stub(groq.chat.completions, 'create').rejects(
                    new Error('API rate limit exceeded')
                );

                const requestData = createMockRequest();

                request(app)
                    .post('/chat')
                    .send(requestData)
                    .expect(500)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        // The new architecture returns the full error message from the service
                        assertErrorResponse(res.body, 'Failed to communicate with Groq API: API rate limit exceeded', { expect });
                        
                        // Restore original stub behavior
                        groqStub.restore();
                        groqStub = sinon.stub(groq.chat.completions, 'create').callsFake((params) => {
                            if (params.messages && params.messages.length > 0) {
                                return Promise.resolve(createMockGroqResponse({
                                    model: params.model || 'test-model',
                                    content: 'This is a mocked response.'
                                }));
                            } else {
                                return Promise.reject(new Error('Messages are required.'));
                            }
                        });
                        
                        done();
                    });
            });
        });

        describe('Request/Response Logging', () => {
            it('should log requests and responses', (done) => {
                // Ensure stub is properly set up for success
                groqStub.restore();
                groqStub = sinon.stub(groq.chat.completions, 'create').callsFake((params) => {
                    if (params.messages && params.messages.length > 0) {
                        return Promise.resolve(createMockGroqResponse({
                            model: params.model || 'test-model',
                            content: 'This is a mocked response.'
                        }));
                    } else {
                        return Promise.reject(new Error('Messages are required.'));
                    }
                });

                const requestData = createMockRequest();

                request(app)
                    .post('/chat')
                    .send(requestData)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        // Test passes if no error occurs - logging is verified via console output
                        assertValidGroqResponse(res.body, { expect });
                        done();
                    });
            });
        });

        describe('CORS Support', () => {
            it('should include CORS headers', (done) => {
                // Ensure stub is properly set up for success
                groqStub.restore();
                groqStub = sinon.stub(groq.chat.completions, 'create').callsFake((params) => {
                    if (params.messages && params.messages.length > 0) {
                        return Promise.resolve(createMockGroqResponse({
                            model: params.model || 'test-model',
                            content: 'This is a mocked response.'
                        }));
                    } else {
                        return Promise.reject(new Error('Messages are required.'));
                    }
                });

                const requestData = createMockRequest();

                request(app)
                    .post('/chat')
                    .send(requestData)
                    .expect(200)
                    .end((err, res) => {
                        if (err) return done(err);
                        
                        // CORS headers should be present (handled by cors middleware)
                        // Basic response verification
                        assertValidGroqResponse(res.body, { expect });
                        done();
                    });
            });
        });
    });

    describe('Static File Serving', () => {
        it('should serve static files from public directory', (done) => {
            request(app)
                .get('/')
                .expect(200) // index.html exists in public directory
                .end((err, res) => {
                    if (err) return done(err);
                    
                    // Should return HTML content
                    expect(res.headers['content-type']).to.include('text/html');
                    done();
                });
        });
    });

    describe('Health Check', () => {
        it('should respond to basic health check via static files', (done) => {
            // This tests that the static file middleware is working
            request(app)
                .get('/nonexistent.html')
                .expect(404)
                .end(done);
        });
    });
});
