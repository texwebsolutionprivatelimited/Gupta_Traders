import { useState, useEffect } from 'react'

export default function PrinterStatus() {
  const [status, setStatus] = useState('browser') // 'browser' | 'direct'

  useEffect(() => {
    const checkDirectPrint = () => {
      // Check for QZ Tray or similar direct print services
      if (typeof window.qz !== 'undefined') {
        setStatus('direct')
      } else {
        setStatus('browser')
      }
    }

    checkDirectPrint()
    const interval = setInterval(checkDirectPrint, 10000)
    return () => clearInterval(interval)
  }, [])

  if (status === 'direct') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400 select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>🟢 Printer Ready</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-semibold text-amber-400 select-none">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      <span>🟡 Browser Printing Available</span>
    </div>
  )
}
