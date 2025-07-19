# API Test Cases for `/chat` Endpoint

This document outlines potential test cases for the `/chat` endpoint of the Groq API Proxy.

## 1. Basic Functionality and Validation

- **Valid Request (200 OK):**
    - Send a request with `model` and `messages` (single user message).
    - Verify a 200 OK status and a valid Groq API response structure (e.g., `id`, `object`, `choices`).
    - Verify the response contains an assistant message.

- **Missing `messages` (400 Bad Request):**
    - Send a request without the `messages` field.
    - Verify a 400 Bad Request status and an error message indicating `messages` are required.

- **Empty `messages` array (400 Bad Request):**
    - Send a request with an empty `messages` array.
    - Verify appropriate error handling (either 400 from proxy or pass-through to Groq API).

- **Invalid `model` (Groq API Error):**
    - Send a request with a non-existent or invalid `model` name.
    - Verify the proxy correctly forwards the request and returns the Groq API error (e.g., 404 or specific Groq error).

- **Optional Parameters:**
    - Send a request with `temperature` and `top_p`.
    - Verify these parameters are correctly passed to the Groq API (this might require mocking or more advanced assertion).
    - Test with `temperature` and `top_p` at their boundary values (e.g., 0, 1).

## 2. Error Handling

- **Groq API Key Missing/Invalid (500 Internal Server Error):**
    - Simulate an environment where `GROQ_API_KEY` is missing or invalid.
    - Verify the proxy returns a 500 Internal Server Error.

- **Groq API Unreachable/Network Error (500 Internal Server Error):**
    - Simulate a network issue or an unreachable Groq API endpoint.
    - Verify the proxy returns a 500 Internal Server Error with an appropriate message.

## 3. Edge Cases and Security

- **Large Request Body:**
    - Send a request with a very large number of messages or very long message content.
    - Verify the proxy handles large payloads without crashing or timing out prematurely.

- **CORS Preflight Request (OPTIONS):**
    - Send an `OPTIONS` request to `/chat` (simulating a browser preflight).
    - Verify a 200 OK status and appropriate CORS headers are present.

- **Invalid JSON Body:**
    - Send a request with malformed JSON in the body.
    - Verify a 400 Bad Request from the Express `express.json()` middleware.

## 4. Performance (Manual or Load Testing)

- **Concurrent Requests:**
    - Send multiple concurrent requests to the `/chat` endpoint.
    - Observe response times and server resource usage to identify bottlenecks.

- **Sustained Load:**
    - Apply sustained load over a period.
    - Monitor for memory leaks or performance degradation. 