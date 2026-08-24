import React from 'react'

export default function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: color + '20', color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  )
}
