const request = require('supertest');
const { expect } = require('chai');
const app = require('../index'); // Adjust path if needed

describe('Chat API', () => {
    let server;

    before((done) => {
        server = app.listen(3001, () => {
            console.log('Test server listening on port 3001');
            done();
        });
    });

    after((done) => {
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

    // Add more tests here as needed

});