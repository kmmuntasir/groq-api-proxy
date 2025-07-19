# 🛡️ groq-api-proxy

**Secure, configurable proxy backend for Groq AI API.**  
Safely connect your frontend apps (React, Vue, mobile, etc.) to Groq’s `/chat/completions` endpoint without exposing your API key.

> 🔗 GitHub: [github.com/kmmuntasir/groq-api-proxy](https://github.com/kmmuntasir/groq-api-proxy)

---

## ✨ Features

- 🔐 **Security first** — Keeps your Groq API key on the server
- ⚙️ **Configurable** — Easily set up per project via `.env`
- 🔁 **Reusable** — Use across multiple frontend apps
- 💬 **Flexible** — Accepts any valid Groq chat parameters
- 🌍 **CORS-enabled** — Works with frontend on any domain
- 🚀 **Deploy anywhere** — Works on Node servers, Docker, or cloud platforms (Render, Railway, Fly.io, etc.)

---

## 📦 Project Structure

groq-api-proxy/
├── index.js          # Main Express app
├── .env.example      # Example environment file
├── .env              # Environment variables (private, not committed)
├── package.json
├── package-lock.json
└── README.md


---

## 🚀 Quick Start

To get your Groq API Proxy up and running quickly, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/kmmuntasir/groq-api-proxy.git
cd groq-api-proxy
```

### 2. Install Dependencies

Install the necessary Node.js packages:

```bash
npm install
```

### 3. Set Up Environment

Create a `.env` file in the root directory of the project, and add your Groq API key and desired port. You can use `env.example` as a template.

```
# .env
PORT=3001
GROQ_API_KEY="YOUR_GROQ_API_KEY"
```

Replace `"YOUR_GROQ_API_KEY"` with your actual Groq API key.

### 4. Start the Server

To start the server in development mode with hot-reloading (using Nodemon):

```bash
npm run dev
```

For production, use:

```bash
npm start
```

The server will be running at `http://localhost:3001` (or your specified PORT).

---

## 💻 API Usage

This proxy exposes a single POST endpoint `/chat` that mirrors the Groq Chat Completions API.

**Endpoint:** `POST /chat`

**Headers:**
`Content-Type: application/json`

**Request Body Example:**

```json
{
    "model": "llama3-8b-8192",
    "messages": [
        {
            "role": "user",
            "content": "Tell me a fun fact about the universe."
        }
    ],
    "temperature": 0.7,
    "top_p": 1
}
```

**Response Body Example (full Groq API response):**

```json
{
    "id": "chatcmpl-xxxxxxxxxxxxxxxxxxxxxx",
    "object": "chat.completion",
    "created": 1718035200,
    "model": "llama3-8b-8192",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Here's a short and fun fact about the universe:\n\nDid you know that there is a giant storm on Jupiter that has been raging for at least 187 years? It's called the Great Red Spot, and it's so big that three Earths could fit inside it!"
            },
            "logprobs": null,
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "queue_time": 0.505739446,
        "prompt_tokens": 17,
        "prompt_time": 0.009619823,
        "completion_tokens": 8,
        "completion_time": 0.017778975,
        "total_tokens": 25,
        "total_time": 0.027398798
    },
    "usage_breakdown": null,
    "system_fingerprint": "fp_5b339000ab",
    "x_groq": {
        "id": "req_01k0hmvxf9ee8sjvn3zkhtsg92"
    },
    "service_tier": "on_demand"
}
```

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
