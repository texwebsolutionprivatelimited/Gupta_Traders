import React from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto px-4 pb-6 pt-2 sm:px-6 lg:px-8 print:hidden">
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-800/50 bg-slate-900/45 backdrop-blur-xl px-6 py-5 shadow-2xl shadow-slate-950/30 hover:border-slate-700/60 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left Section: Branding & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-500/10">
              G
            </div>
            <span className="font-semibold text-sm text-slate-200">Gupta Traders</span>
          </div>
          <span className="hidden sm:inline text-slate-700/50">|</span>
          <p className="text-xs text-slate-500">
            &copy; {currentYear} Gupta Traders. All rights reserved.
          </p>
          <span className="hidden sm:inline text-slate-700/50">|</span>
          <p className="text-xs text-slate-500">
            Designed & Developed by{' '}
            <a
              href="https://texwebsolution.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              texwebsolution.in
            </a>
          </p>
        </div>

        {/* Right Section: System Status & Links */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          {/* System Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium text-emerald-400">All Systems Operational</span>
          </div>

          {/* Quick Info & Links */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="#/settings" className="hover:text-emerald-400 transition-colors">Settings</a>
            <span className="text-slate-800">&bull;</span>
            <a href="#/reports" className="hover:text-emerald-400 transition-colors">Reports</a>
            <span className="text-slate-800">&bull;</span>
            <span className="font-mono text-[10px] bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded text-slate-400">
              v2.4.0
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
