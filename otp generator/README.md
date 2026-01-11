# OTP Generator (Front-end + optional Twilio server)

Quick start (local debug):

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and (optionally) set `DEBUG=true` for local testing.

3. Start server:

```bash
npm start
```

4. Open `index.html` in your browser. The front-end will call `http://localhost:3000/send-otp`.

Server endpoints:

- `POST /send-otp` { mobile } -> sends OTP via Twilio if configured. Returns `{ ok, otp? }` (otp present only in DEBUG).
- `POST /verify-otp` { mobile, otp } -> verifies OTP.

Note: This is a simple demo. For production, persist OTPs in a database, rate-limit requests, secure endpoints, and never return OTPs in API responses.
