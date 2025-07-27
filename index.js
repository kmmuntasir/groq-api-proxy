require('dotenv').config();
const express = require('express');
const Groq = require('groq-sdk');

const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON request bodies
app.use(express.json());

// Custom error handling for JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Failed to parse JSON body.' });
    }
    next();
});

// Enable CORS for all origins (you might want to restrict this in production)
const cors = require('cors');
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

console.log("GROQ_API_KEY from environment:", process.env.GROQ_API_KEY ? "Set" : "Not Set");
console.log("GROQ_API_KEY value (first 5 chars):", process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 5) + "..." : "");

app.post('/chat', async (req, res) => {
    try {
        const { model, messages, temperature, top_p, ...rest } = req.body;

        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required.' });
        }

        const completion = await groq.chat.completions.create({
            model: model || "llama-3.1-8b-instant", // Default model if not provided
            messages: messages,
            temperature: temperature || 0.7, // Default temperature
            top_p: top_p || 1,             // Default top_p
            ...rest
        });

        res.json(completion);

    } catch (error) {
        console.error('Error proxying request to Groq API:', error);
        res.status(500).json({ error: 'Failed to communicate with Groq API', details: error.message });
    }
});

if (process.env.NODE_ENV === 'test') {
    module.exports = { app, groq }; // Export app and groq for testing
} else {
    app.listen(port, () => {
        console.log(`Groq API Proxy server listening at http://localhost:${port}`);
    });
    module.exports = app; // Export app for normal execution
} 