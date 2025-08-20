// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import { smsReply, voiceSay } from './twiml.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const {
	TWILIO_ACCOUNT_SID,
	TWILIO_AUTH_TOKEN,
	TWILIO_NUMBER,
	TWILIO_VERIFY_SID,
	JWT_SECRET
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_NUMBER || !TWILIO_VERIFY_SID || !JWT_SECRET) {
	console.warn('[WARN] Missing required env vars. Fill server/.env from .env.example');
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// CORS with credentials so HttpOnly cookie works from client
app.use(cors({
	origin: CLIENT_ORIGIN,
	credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// In-memory demo store (messages + calls). Replace with DB for real app.
const store = { messages: [], calls: [] };

// Helper: sign short-lived JWT
function signToken(payload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });
}

// Auth middleware: checks cookie token or Authorization header
function requireAuth(req, res, next) {
	const token = req.cookies?.token || (req.get('authorization') || '').replace(/^Bearer\s+/, '');
	if (!token) return res.status(401).json({ error: 'unauthenticated' });
	try {
		req.user = jwt.verify(token, JWT_SECRET);
		next();
	} catch (err) {
		return res.status(401).json({ error: 'invalid token' });
	}
}

/* -----------------------
   Auth endpoints (Twilio Verify)
   POST /auth/send-otp     { phone }
   POST /auth/verify-otp   { phone, code } -> sets HttpOnly cookie
   GET  /auth/whoami
   POST /auth/logout
   ----------------------- */

app.post('/auth/send-otp', async (req, res) => {
	try {
		const { phone } = req.body;
		if (!phone) return res.status(400).json({ error: 'phone required' });

		await client.verify.services(TWILIO_VERIFY_SID).verifications.create({
			to: phone,
			channel: 'sms'
		});

		return res.json({ sent: true });
	} catch (err) {
		console.error('send-otp err', err?.message || err);
		return res.status(500).json({ error: err?.message || 'error' });
	}
});

app.post('/auth/verify-otp', async (req, res) => {
	try {
		const { phone, code } = req.body;
		if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

		const check = await client.verify.services(TWILIO_VERIFY_SID).verificationChecks.create({
			to: phone,
			code
		});

		if (check.status === 'approved') {
			const token = signToken({ sub: phone });
			// HttpOnly cookie — secure: true in prod under HTTPS
			res.cookie('token', token, {
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				maxAge: 1000 * 60 * 60 * 3
			});
			return res.json({ ok: true });
		} else {
			return res.status(401).json({ error: 'invalid code' });
		}
	} catch (err) {
		console.error('verify-otp err', err?.message || err);
		return res.status(500).json({ error: err?.message || 'error' });
	}
});

app.get('/auth/whoami', (req, res) => {
	const token = req.cookies?.token;
	if (!token) return res.json({ authenticated: false });
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		return res.json({ authenticated: true, user: payload });
	} catch {
		return res.json({ authenticated: false });
	}
});

app.post('/auth/logout', (req, res) => {
	res.clearCookie('token');
	res.json({ ok: true });
});

/* -----------------------
   Protected API endpoints
   - /api/sms  (send SMS)
   - /api/call (make call)
   - /api/activity (recent)
   ----------------------- */

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/sms', requireAuth, async (req, res) => {
	try {
		const { to, body } = req.body;
		if (!to || !body) return res.status(400).json({ error: 'to and body required' });

		const msg = await client.messages.create({
			from: TWILIO_NUMBER,
			to,
			body
		});

		store.messages.unshift({
			id: msg.sid,
			to,
			from: TWILIO_NUMBER,
			body,
			status: 'queued',
			at: new Date().toISOString()
		});

		return res.json({ message: 'SMS sent', sid: msg.sid });
	} catch (err) {
		console.error('api/sms err', err?.message || err);
		return res.status(500).json({ error: err?.message || 'error' });
	}
});

app.post('/api/call', requireAuth, async (req, res) => {
	try {
		const { to, say } = req.body;
		if (!to) return res.status(400).json({ error: 'to is required' });

		const url = `${req.protocol}://${req.get('host')}/twilio/voice?say=${encodeURIComponent(say || process.env.VOICE_GREETING || 'Hello!')}`;

		const call = await client.calls.create({
			to,
			from: TWILIO_NUMBER,
			url
		});

		store.calls.unshift({
			sid: call.sid,
			to,
			from: TWILIO_NUMBER,
			say,
			status: 'queued',
			at: new Date().toISOString()
		});

		return res.json({ message: 'Call initiated', sid: call.sid });
	} catch (err) {
		console.error('api/call err', err?.message || err);
		return res.status(500).json({ error: err?.message || 'error' });
	}
});

app.get('/api/activity', requireAuth, (_req, res) => {
	res.json({ messages: store.messages, calls: store.calls });
});

/* -----------------------
   Twilio webhooks (inbound)
   - /twilio/sms   (inbound SMS)
   - /twilio/voice (TwiML for voice)
   NOTE: For production enable twilio.webhook({ validate: true })
------------------------*/

// inbound SMS
app.post('/twilio/sms', (req, res) => {
	const { From, To, Body } = req.body || {};
	store.messages.unshift({
		id: `in-${Date.now()}`,
		to: To,
		from: From,
		body: Body,
		status: 'received',
		at: new Date().toISOString()
	});
	res.type('text/xml').send(smsReply('Thanks! Received your message.'));
});

// voice TwiML for both inbound and outbound
app.post('/twilio/voice', (req, res) => {
	const say = req.query.say || process.env.VOICE_GREETING || 'Hello from Geminid Connect';
	res.type('text/xml').send(voiceSay({ say }));
});

// optional GET test endpoint
app.get('/twilio/voice', (req, res) => {
	const say = req.query.say || process.env.VOICE_GREETING || 'Hello from Geminid Connect';
	res.type('text/xml').send(voiceSay({ say }));
});

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

