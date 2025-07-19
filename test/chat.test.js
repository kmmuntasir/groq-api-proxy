const request = require('supertest');
const { expect } = require('chai');
const { app, groq } = require('../index'); // Adjust path and destructure app and groq
const sinon = require('sinon');

describe('Chat API', () => {
    let server;
    let groqStub;

    before((done) => {
        // Stub the Groq SDK's chat.completions.create method
        groqStub = sinon.stub(groq.chat.completions, 'create').callsFake((params) => {
            // Simulate a successful response from Groq API
            if (params.messages && params.messages.length > 0) {
                return Promise.resolve({
                    id: 'test-chatcmpl-id',
                    object: 'chat.completion',
                    created: Date.now(),
                    model: params.model || 'test-model',
                    choices: [
                        {
                            index: 0,
                            message: { role: 'assistant', content: 'This is a mocked response.' },
                            finish_reason: 'stop',
                        },
                    ],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 5,
                        total_tokens: 15,
                    },
                });
            } else {
                // Simulate an error if messages are missing or empty
                return Promise.reject(new Error('Messages are required.'));
            }
        });

        server = app.listen(3001, () => {
            console.log('Test server listening on port 3001');
            done();
        });
    });

    after((done) => {
        groqStub.restore(); // Restore the original method
        server.close(() => {
            console.log('Test server closed');
            done();
        });
    });

    it('should return 400 if messages are not provided', (done) => {
        request(app)
            .post('/chat')
            .send({ model: 'llama3-8b-8192' })
            .expect(400)
            .end((err, res) => {
                expect(res.body.error).to.equal('Messages are required.');
                done(err);
            });
    });

    it('should return 200 and a valid response for a valid request', (done) => {
        request(app)
            .post('/chat')
            .send({
                model: 'llama3-8b-8192',
                messages: [{
                    role: 'user',
                    content: 'Hello world'
                }]
            })
            .expect(200)
            .end((err, res) => {
                expect(res.body).to.have.property('id');
                expect(res.body).to.have.property('object').and.to.equal('chat.completion');
                expect(res.body).to.have.property('choices').and.to.be.an('array').and.not.be.empty;
                expect(res.body.choices[0].message).to.have.property('content').and.to.equal('This is a mocked response.');
                done(err);
            });
    });

    it('should return 400 if an empty messages array is provided', (done) => {
        request(app)
            .post('/chat')
            .send({ model: 'llama3-8b-8192', messages: [] })
            .expect(400)
            .end((err, res) => {
                expect(res.body.error).to.equal('Messages are required.');
                done(err);
            });
    });

    it('should return 400 for invalid JSON body', (done) => {
        request(app)
            .post('/chat')
            .set('Content-Type', 'application/json')
            .send('this is not json') // Send malformed JSON
            .expect(400)
            .end((err, res) => {
                expect(res.body).to.have.property('error').and.to.equal('Failed to parse JSON body.');
                done(err);
            });
    });

    // Test for optional parameters (temperature, top_p)
    it('should correctly pass optional parameters to Groq API', (done) => {
        const params = {
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: 'test' }],
            temperature: 0.5,
            top_p: 0.9
        };

        request(app)
            .post('/chat')
            .send(params)
            .expect(200)
            .end((err, res) => {
                // Verify that groqStub was called with the correct parameters
                expect(groqStub.calledWithMatch({
                    model: params.model,
                    messages: params.messages,
                    temperature: params.temperature,
                    top_p: params.top_p
                })).to.be.true;
                done(err);
            });
    });
});