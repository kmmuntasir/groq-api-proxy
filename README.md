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
├── index.js # Main Express app
├── .env.example # Example environment file
├── package.json
└── README.md


---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/kmmuntasir/groq-api-proxy.git
cd groq-api-proxy
