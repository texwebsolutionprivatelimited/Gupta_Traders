import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-cyan-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto w-full">
        {/* Hero Image Section */}
        <div className="relative mb-8 group flex items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <img 
              src={heroImg} 
              className="w-40 h-auto relative z-0 transition-transform duration-500 group-hover:scale-105 drop-shadow-2xl" 
              alt="Hero Illustration" 
            />
            <img 
              src={reactLogo} 
              className="absolute z-10 top-8 h-7 w-auto transition-all duration-300"
              style={{
                transform: 'perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg) scale(1.4)'
              }}
              alt="React logo" 
            />
            <img 
              src={viteLogo} 
              className="absolute z-0 top-24 h-6 w-auto transition-all duration-300"
              style={{
                transform: 'perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg) scale(0.8)'
              }}
              alt="Vite logo" 
            />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-4 max-w-md mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Get started
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Edit <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-sm">src/App.jsx</code> and save to test <code className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-sm">HMR</code>
          </p>
        </div>

        {/* Counter Button */}
        <button
          type="button"
          className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2 border border-cyan-400/30"
          onClick={() => setCount((count) => count + 1)}
        >
          <span>Count is</span>
          <span className="bg-slate-950/40 px-2 py-0.5 rounded-lg text-cyan-200 font-mono">{count}</span>
        </button>
      </main>

      {/* Decorative Divider */}
      <div className="relative w-full border-t border-slate-800/80">
        <div className="absolute -top-1 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-500/50" />
        <div className="absolute -top-1 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-500/50" />
      </div>

      {/* Next Steps Section */}
      <section className="bg-slate-900/40 backdrop-blur-md py-12 px-4 border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
          
          {/* Documentation */}
          <div className="space-y-4 pr-0 md:pr-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <svg className="w-5 h-5" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#documentation-icon"></use>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-100">Documentation</h2>
            </div>
            <p className="text-slate-400 text-sm">Your questions, answered</p>
            <ul className="flex flex-wrap gap-3 pt-2">
              <li className="flex-1 min-w-[140px]">
                <a 
                  href="https://vite.dev/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <img className="h-4.5 w-auto" src={viteLogo} alt="" />
                  <span>Explore Vite</span>
                </a>
              </li>
              <li className="flex-1 min-w-[140px]">
                <a 
                  href="https://react.dev/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <img className="h-4.5 w-4.5" src={reactLogo} alt="" />
                  <span>Learn more</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4 pt-8 md:pt-0 pl-0 md:pl-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <svg className="w-5 h-5" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#social-icon"></use>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-100">Connect with us</h2>
            </div>
            <p className="text-slate-400 text-sm">Join the Vite community</p>
            <ul className="grid grid-cols-2 gap-3 pt-2">
              <li>
                <a 
                  href="https://github.com/vitejs/vite" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4.5 h-4.5 text-slate-300" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#github-icon"></use>
                  </svg>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://chat.vite.dev/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4.5 h-4.5 text-slate-300" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#discord-icon"></use>
                  </svg>
                  <span>Discord</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://x.com/vite_js" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4.5 h-4.5 text-slate-300" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#x-icon"></use>
                  </svg>
                  <span>X.com</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://bsky.app/profile/vite.dev" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-4.5 h-4.5 text-slate-300" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#bluesky-icon"></use>
                  </svg>
                  <span>Bluesky</span>
                </a>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Footer / Spacer */}
      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        Gupta Traders • Powered by React & Tailwind CSS
      </footer>
    </div>
  )
}

export default App

