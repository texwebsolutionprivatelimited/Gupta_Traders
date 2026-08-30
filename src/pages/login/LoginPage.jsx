import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import guptaTradersShowcase from '../../assets/Gupta traders.png'
import guptaTradersLogo from '../../assets/gupta traders logo.png'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, profile, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('Admin')
  const [modalType, setModalType] = useState(null) // 'terms' | 'privacy' | null

  // Theme state synchronized with local storage
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (user && profile) navigate(profile.role === 'cashier' ? '/pos' : '/', { replace: true })
  }, [user, profile, navigate])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleTabChange = (role) => {
    setActiveTab(role)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signIn(email.trim(), password)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center md:justify-end p-4 sm:p-6 md:pr-12 lg:pr-20 xl:pr-32 transition-colors duration-300 relative font-sans overflow-hidden">

      {/* Background Mascot Image */}
      <img
        src={guptaTradersShowcase}
        alt="Gupta Traders Store Background"
        className="absolute inset-0 w-full h-full object-cover object-center select-none"
      />
      <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${theme === 'light'
        ? 'bg-slate-950/20 backdrop-blur-[0.5px]'
        : 'bg-slate-950/60 backdrop-blur-[2px]'
        }`} />

      {/* Subtle vignettes for visual contrast */}
      <div className={`absolute inset-0 transition-all duration-300 pointer-events-none ${theme === 'light'
        ? 'bg-gradient-to-t from-slate-950/20 via-transparent to-slate-950/10'
        : 'bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30'
        }`} />

      {/* Floating Theme Toggle (Top Right of Page) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 border border-slate-800/80 bg-slate-900/60 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          )}
        </button>
      </div>

      {/* Floating Glassmorphic Login Card */}
      <div className="w-full max-w-[440px] bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] relative z-10 animate-scaleIn transition-all duration-300">

        {/* Brand / Logo */}
        <div className="flex items-center gap-4 justify-center mb-6 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
          <img
            src={guptaTradersLogo}
            alt="Gupta Traders Logo"
            className="w-14 h-14 object-contain rounded-xl shadow-lg shadow-emerald-500/10 border border-slate-800/80 bg-slate-900/50 p-1 flex-shrink-0"
          />
          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-100 leading-none tracking-tight font-gupta">Gupta Traders</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Management Workspace</p>
          </div>
        </div>

        {/* Role Quick-Select Tabs */}
        <div className="mb-6 bg-slate-950/40 p-1 rounded-xl border border-slate-800/60 grid grid-cols-3 gap-1">
          {['Admin', 'Manager', 'Cashier'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleTabChange(role)}
              disabled={loading || success}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === role
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Central Form Title */}
        <div className="mb-5 text-center">
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
            {activeTab === 'Admin' ? 'Admin / Owner Portal' : activeTab === 'Manager' ? 'Manager Portal' : 'Cashier Terminal'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Fill authorization to view designated panels.
          </p>
        </div>

        {/* Action Notifications */}
        {error && (
          <div className="mb-4.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-scaleIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4.5 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-scaleIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>Authorization granted! Loading session...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4.5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Username or Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); setActiveTab('') }}
                placeholder="e.g. admin@guptatraders.com"
                disabled={loading || success}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-950/20 border border-slate-800/80 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-55"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); setActiveTab('') }}
                placeholder="••••••••"
                disabled={loading || success}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium bg-slate-950/20 border border-slate-800/80 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-55"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || success}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex justify-end">
              <a href="#forgot" className="text-[10px] font-bold text-emerald-500 hover:text-emerald-450 transition-colors">
                Forgot Password?
              </a>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-0.5">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading || success}
              className="h-4.5 w-4.5 rounded border-slate-700/60 bg-slate-800/80 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer disabled:opacity-55 accent-emerald-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-400 cursor-pointer select-none">
              Remember my session
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-55 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authorizing...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold border-t border-slate-800/30 pt-4 mt-6">
          <span>&copy; {new Date().getFullYear()} Gupta Traders</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModalType('terms')}
              className="hover:text-slate-400 transition-colors cursor-pointer bg-transparent border-0 p-0 text-[10px] font-semibold text-slate-500"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setModalType('privacy')}
              className="hover:text-slate-400 transition-colors cursor-pointer bg-transparent border-0 p-0 text-[10px] font-semibold text-slate-500"
            >
              Privacy
            </button>
          </div>
        </div>

      </div>

      {/* Terms & Privacy Modal Overlay */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" onClick={() => setModalType(null)}>
          {/* Modal Container */}
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] text-slate-200 transition-all duration-300 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                  {modalType === 'terms' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 leading-tight">
                    {modalType === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Gupta Traders &bull; Effective August 2026</p>
                </div>
              </div>

              {/* Close Icon Button */}
              <button
                onClick={() => setModalType(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent hover:border-slate-800/80 transition-all cursor-pointer"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Switch Tabs inside the modal */}
            <div className="px-6 pt-3.5 flex gap-4 border-b border-slate-800/60 bg-slate-950/20">
              <button
                type="button"
                onClick={() => setModalType('terms')}
                className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${modalType === 'terms'
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setModalType('privacy')}
                className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${modalType === 'privacy'
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Privacy Policy
              </button>
            </div>

            {/* Scrollable content area */}
            <div className="p-6 overflow-y-auto space-y-5 max-h-[50vh] scrollbar-thin text-slate-300">
              {modalType === 'terms' ? (
                <>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">1. Agreement to Terms</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      By accessing or using the Gupta Traders Management Workspace, you agree to be bound by these terms. This system is created solely for internal use by authorized administrators, managers, and cashiers of Gupta Traders. If you do not agree to these terms, you are not permitted to access or use the application.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">2. System Access & Security</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Users are responsible for safeguarding their authentication credentials. Under no circumstances should passwords or user accounts be shared with unauthorized parties or external individuals. Any breach of security or unauthorized sharing of login credentials will result in immediate suspension of access rights.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">3. Acceptable Use Policy</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      You agree to use this platform only for its intended operational purposes, such as tracking stock, checking customer details, editing categories, processing bills, and managing suppliers. Actions including automated scraping, denial of service attempts, or code injection are strictly illegal.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">4. Data Reliability</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Employees are expected to input and update accurate inventory amounts, correct cost metrics, and proper supplier/customer profiles. Gupta Traders is not liable for business losses resulting from incorrect data inputted by system operators.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">5. Liability & Warranties</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      This application is provided "as is" and "as available" without warranties of any kind. Gupta Traders does not guarantee that the workspace will be completely uninterrupted or free from errors, but we make all reasonable efforts to maintain 100% operational uptime.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">6. Updates to Terms</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      We reserve the right to modify these Terms of Service at any time to reflect changes in compliance, store workflows, or system features. Continued usage of the workspace constitutes acceptance of any updated terms.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">1. Information We Collect</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      We collect and store operational metadata related to store activities. This includes operator login times, specific transaction histories, billing details (customer name, phone number, and items purchased), supplier contact info, and product details. We do not collect personal demographic data unrelated to store operations.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">2. How We Use Stored Information</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      The collected data is strictly used for internal bookkeeping, inventory control, automated sales reporting, financial accounting, and checking employee system activity. This data is private and is never distributed, sold, or shared with third-party advertisers.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">3. Security Measures</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      All connection records, passwords, and sessions are encrypted. We implement strict server-side authentication validation rules to prevent data leaks. Database access is strictly restricted to senior admin staff of Gupta Traders.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">4. Use of LocalStorage & SessionStorage</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      We utilize browser local storage and session storage to maintain authentication status (so you do not have to sign in every time you refresh), to store your theme preferences (dark/light mode), and to track the current active session. No persistent tracking beacons are deployed.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">5. Access Rights</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Employees have the right to request access to their logged actions and request profile updates. Administrators can view, edit, or delete logged metadata if it is found to be erroneous or no longer required for business record keeping.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">6. Policy Updates</h4>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Any updates to our Privacy Policy will be posted here. We recommend reviewing this section periodically to stay updated on how we handle store data security.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex justify-end">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                Acknowledge
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
