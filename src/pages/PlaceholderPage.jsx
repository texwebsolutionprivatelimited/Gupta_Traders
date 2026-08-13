export default function PlaceholderPage({ title, description }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-100 mb-2">{title}</h1>
        <p className="text-slate-400 text-sm mb-6">{description}</p>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-emerald-400">Coming Soon</span>
        </div>

        {/* Decorative line */}
        <div className="mt-8 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-800" />
          <span className="text-xs text-slate-600">Under Development</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-800" />
        </div>
      </div>
    </div>
  )
}
