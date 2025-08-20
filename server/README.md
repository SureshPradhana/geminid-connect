
# Geminid Connect — server (Twilio demo)

1. Copy `.env.example` -> `.env` and fill values (Twilio keys, numbers, JWT_SECRET).
2. Install deps:
   cd server
   npm install

3. Run:
   npm run dev
   # server will run on port default 4000

4. Expose to Twilio (for webhooks):
   npx ngrok http 4000
   # set Twilio phone number webhook URLs:
   # Messaging webhook (POST): https://<ngrok-id>.ngrok.io/twilio/sms
   # Voice webhook (POST):     https://<ngrok-id>.ngrok.io/twilio/voice

5. Client:
   - Start your React client (Vite) on http://localhost:5173 and set CLIENT_ORIGIN and VITE_API_URL accordingly.

Notes:
- This demo stores messages/calls in memory. Replace with DB for persistence.
- For security, set secure: true for cookies in production (HTTPS).
- Consider enabling twilio.webhook({ validate: true }) for webhook signature validation in production.
