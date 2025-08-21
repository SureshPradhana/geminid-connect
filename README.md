

# Geminid Connect

A demo app for sending SMS and making calls using Twilio, with phone number authentication.

## Features

* Phone number sign-in via OTP (Twilio Verify)
* Send SMS messages
* Make voice calls
* View recent messages and calls
* Authentication via HttpOnly JWT cookie

# Live Links

* **Demo App**: [Geminid Connect](https://geminid-connect.vercel.app)

## Source Code

* **Frontend**: [Client Repo/Folder](./client)
* **API / Backend**: [Server Repo/Folder](./server)

## Setup

### Backend

1. Navigate to the server folder:

   ```bash
   cd server
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env` file (copy from `.env.example`) and fill in required keys:

   ```env
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_NUMBER=
   TWILIO_VERIFY_SID=
   JWT_SECRET=
   CLIENT_ORIGIN=http://localhost:5173
   BASE_URL=http://localhost:4000
   VOICE_GREETING=Hello from Geminid Connect
   ```
4. Start the server:

   ```bash
   npm run dev


5. Optional: Expose your server with ngrok to test public webhooks (SMS / call):

``` bash
npx ngrok http 4000
```

Copy the public URL from ngrok and update BASE_URL in your .env accordingly.
   ```

### Frontend

1. Navigate to the client folder:

   ```bash
   cd client
   ```
2. Install dependencies:

   ```bash
   npm install

3. Create a .env file and set the API URL:
   ``` env
    VITE_API_URI=http://localhost:4000
   ```
   ```
3. Start the frontend:

   ```bash
   npm run dev
   ```
4. Open the app at `http://localhost:5173`

## Notes

* Twilio is free-tier, so **you must verify any phone number manually** before signing up.
* The app uses **in-memory storage** for messages and calls, so data is not persisted after server restart.
* All authentication uses **HttpOnly cookies** for security.
* To test calls, use a valid phone number and check your Twilio console for logs.

## License

MIT


