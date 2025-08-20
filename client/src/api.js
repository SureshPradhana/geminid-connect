const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function req(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const text = await res.text().catch(() => '')
  try { return JSON.parse(text || '{}') } catch { return { ok: false, text } }
}

export const sendOTP = (phone) => req('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) })
export const verifyOTP = (phone, code) => req('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) })
export const whoami = () => req('/auth/whoami', { method: 'GET' })
export const logout = () => req('/auth/logout', { method: 'POST' })

export const sendSMS = (payload) => req('/api/sms', { method: 'POST', body: JSON.stringify(payload) })
export const makeCall = (payload) => req('/api/call', { method: 'POST', body: JSON.stringify(payload) })
export const getActivity = () => req('/api/activity', { method: 'GET' })
export const health = () => req('/api/health', { method: 'GET' })
