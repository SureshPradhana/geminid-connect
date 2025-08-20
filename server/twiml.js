
// server/twiml.js
import twilio from 'twilio';
const { twiml: { MessagingResponse, VoiceResponse } } = twilio;

/**
 * Returns TwiML XML string for an SMS reply.
 * @param {string} text
 */
export const smsReply = (text = 'Thanks — we received your message.') => {
	const resp = new MessagingResponse();
	resp.message(text);
	return resp.toString();
};

/**
 * Returns TwiML XML string for a voice response (speaks the `say` text).
 * @param {{say?: string}} options
 */
export const voiceSay = ({ say = 'Hello from Geminid Connect.' } = {}) => {
	const vr = new VoiceResponse();
	vr.say({ voice: 'alice' }, say);
	return vr.toString();
};
