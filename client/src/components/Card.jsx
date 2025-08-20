export default function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-slate-800/40 p-5 shadow-sm">
      <div className="mb-3 text-sm uppercase tracking-wide text-slate-400">{title}</div>
      {children}
    </div>
  )
}

