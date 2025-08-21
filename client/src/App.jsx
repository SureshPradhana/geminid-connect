import { useEffect, useState } from 'react'
import Card from './components/Card'
import { sendOTP, verifyOTP, whoami, logout, sendSMS, makeCall, getActivity, health } from './api'

export default function App() {
  const [phase, setPhase] = useState('loading') // loading -> anon -> sent -> authed
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [smsTo, setSmsTo] = useState('')
  const [smsBody, setSmsBody] = useState('Hello from Geminid Connect')
  const [callTo, setCallTo] = useState('')
  const [callSay, setCallSay] = useState('Hello — this is a demo from Geminid Connect.')
  const [activity, setActivity] = useState({ messages: [], calls: [] })
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        await health()
        const w = await whoami()
        setPhase(w?.authenticated ? 'authed' : 'anon')
      } catch {
        setPhase('anon')
      }
    })()
  }, [])

  useEffect(() => {
    if (phase === 'authed') {
      refresh()
      const t = setInterval(refresh, 4000)
      return () => clearInterval(t)
    }
  }, [phase])

  async function refresh() {
    try {
      const a = await getActivity()
      setActivity(a || { messages: [], calls: [] })
    } catch (e) { /* ignore */ }
  }

  async function handleSendOTP(e) {
    e?.preventDefault()
    if (!phone) return setToast('Enter phone in E.164 format (+1...)')
    setLoading(true)
    try {
      await sendOTP(phone)
      setPhase('sent')
      setToast('OTP sent — check your phone')
    } catch (err) {
      setToast(err?.error || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function handleVerify(e) {
    e?.preventDefault()
    if (!code) return setToast('Enter code')
    setLoading(true)
    try {
      await verifyOTP(phone, code)
      setPhase('authed')
      setToast('Signed in')
      await refresh()
    } catch (err) {
      setToast(err?.error || 'Invalid code')
    } finally { setLoading(false) }
  }

  async function handleLogout() {
    await logout()
    setPhase('anon')
    setPhone(''); setCode('')
    setToast('Signed out')
  }

  async function handleSendSMS(e) {
    e?.preventDefault()
    if (!smsTo || !smsBody) return setToast('Fill To and Message')
    setLoading(true)
    try {
      const r = await sendSMS({ to: smsTo, body: smsBody })
      setToast(r.message || 'SMS queued')
      await refresh()
    } catch (err) {
      setToast(err?.error || 'Failed to send SMS')
    } finally { setLoading(false) }
  }

  async function handleCall(e) {
    e?.preventDefault()
    if (!callTo) return setToast('Enter a phone to call')
    setLoading(true)
    try {
      const r = await makeCall({ phone: callTo, message: callSay })
      setToast(r.message || 'Call started')
      await refresh()
    } catch (err) {
      setToast(err?.error || 'Failed to start call')
    } finally { setLoading(false) }
  }

  if (phase === 'loading') return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading…</div>

  // ANONYMOUS / SIGN IN
  if (phase !== 'authed') {
    return (
      <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="mb-4 text-2xl font-semibold">Geminid Connect</h1>
        {toast && <div className="mb-3 rounded p-3 bg-amber-500/10 text-amber-200">{toast}</div>}

        {phase === 'anon' && (
          <form onSubmit={handleSendOTP} className="space-y-3">
            <label className="text-sm">Phone (E.164, e.g. +1...)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 rounded bg-slate-800" placeholder="+1..." />
            <button className="mt-2 rounded bg-indigo-600 px-4 py-2 text-white" disabled={loading}>Send OTP</button>
          </form>
        )}

        {phase === 'sent' && (
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="text-sm">Enter OTP</label>
            <input value={code} onChange={e => setCode(e.target.value)} className="w-full p-2 rounded bg-slate-800" placeholder="123456" />
            <div className="flex gap-2">
              <button className="rounded bg-emerald-600 px-4 py-2 text-white" disabled={loading}>Verify</button>
              <button type="button" onClick={handleSendOTP} className="rounded bg-slate-600 px-4 py-2 text-white">Resend</button>
            </div>
          </form>
        )}
      </div>
      </div>
    )
  }

  // AUTHENTICATED UI
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Geminid Connect</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-300">Signed in</div>
          <button onClick={handleLogout} className="rounded bg-red-600 px-3 py-1 text-white">Sign out</button>
        </div>
      </div>

      {toast && <div className="mb-4 rounded p-3 bg-emerald-600/10 text-emerald-200">{toast}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Send SMS">
          <form onSubmit={handleSendSMS} className="space-y-3">
            <label className="text-sm">To (E.164)</label>
            <input value={smsTo} onChange={e => setSmsTo(e.target.value)} className="w-full p-2 rounded bg-slate-800" placeholder="+1..." />
            <label className="text-sm">Message</label>
            <textarea value={smsBody} onChange={e => setSmsBody(e.target.value)} className="w-full p-2 rounded bg-slate-800" />
            <button className="rounded bg-indigo-600 px-4 py-2 text-white" disabled={loading}>Send SMS</button>
          </form>
        </Card>

        <Card title="Make Call">
          <form onSubmit={handleCall} className="space-y-3">
            <label className="text-sm">To (E.164)</label>
            <input value={callTo} onChange={e => setCallTo(e.target.value)} className="w-full p-2 rounded bg-slate-800" placeholder="+1..." />
            <label className="text-sm">What to say</label>
            <input value={callSay} onChange={e => setCallSay(e.target.value)} className="w-full p-2 rounded bg-slate-800" />
            <button className="rounded bg-sky-500 px-4 py-2 text-white" disabled={loading}>Start Call</button>
          </form>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Recent Messages">
          <ul className="divide-y divide-slate-700">
            {activity.messages?.length ? activity.messages.map(m => (
              <li key={m.id || m.sid} className="py-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <div>{m.status}</div>
                  <div className="text-xs">{new Date(m.at).toLocaleString()}</div>
                </div>
                <div className="mt-1">From: {m.from} → To: {m.to}</div>
                <div className="mt-1 text-slate-300">{m.body}</div>
              </li>
            )) : <div className="p-2 text-sm text-slate-400">No messages yet</div>}
          </ul>
        </Card>

        <Card title="Recent Calls">
          <ul className="divide-y divide-slate-700">
            {activity.calls?.length ? activity.calls.map(c => (
              <li key={c.sid} className="py-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <div>{c.status}</div>
                  <div className="text-xs">{new Date(c.at).toLocaleString()}</div>
                </div>
                <div className="mt-1">From: {c.from} → To: {c.to}</div>
                <div className="mt-1 text-slate-300">Say: {c.say || 'default'}</div>
              </li>
            )) : <div className="p-2 text-sm text-slate-400">No calls yet</div>}
          </ul>
        </Card>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-500">Built by Geminid Connect</footer>
    </div>
  )
}
