import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { searchProductsByQuery, formatINR } from '../hooks/productData'
import Footer from './footer'
import { createPortal } from 'react-dom'

// ─── Navigation Items ───────────────────────────────────────────
const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: 'POS Billing',
    path: '/pos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
      </svg>
    ),
  },
  { type: 'divider', label: 'Inventory' },
  {
    label: 'Products',
    path: '/products',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  { type: 'divider', label: 'Transactions' },
  {
    label: 'Purchase',
    path: '/purchase',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
  },
  {
    label: 'Sales',
    path: '/sales',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  { type: 'divider', label: 'People' },
  {
    label: 'Suppliers',
    path: '/suppliers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.143-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  { type: 'divider', label: 'Finance' },
  {
    label: 'Expenses',
    path: '/expenses',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  { type: 'divider', label: 'Administration' },
  {
    label: 'Admin Control',
    path: '/admin',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    label: 'User Management',
    path: '/users',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    label: 'Hardware',
    path: '/hardware',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.394 48.394 0 0 1 12.5 0m-12.5 0V5.625c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v2.009" />
      </svg>
    ),
  },
]

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

// ─── Header Admin Profile Dropdown ───────────────────────────────
function AdminProfileDropdown({ navigate }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
          A
        </div>
        <div className="hidden md:block text-left pr-1">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">Admin</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Administrator</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[100] divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-3">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Gupta Admin</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">admin@guptatraders.com</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); navigate('/admin'); }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Admin Panel
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/settings'); }}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Settings
            </button>
          </div>
          <div className="py-1">
            <button
              onClick={() => alert("Logged out successfully!")}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Global Search (Left Aligned) ───────────────────────────────
function HeaderSearch({ navigate, setIsSearchActive }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const extraData = [
    { id: 'cat-1', type: 'Category', name: 'Groceries & Staples', path: '/categories' },
    { id: 'cat-2', type: 'Category', name: 'Spices & Masala', path: '/categories' },
    { id: 'cust-1', type: 'Customer', name: 'Rahul Sharma', subtext: '+91 98765 43210', path: '/customers' },
    { id: 'cust-2', type: 'Customer', name: 'Anita Verma', subtext: '+91 91234 56789', path: '/customers' },
    { id: 'sup-1', type: 'Supplier', name: 'Rajesh Wholesalers', subtext: 'Delhi Depot', path: '/suppliers' },
    { id: 'sup-2', type: 'Supplier', name: 'National Foods Ltd', subtext: 'Mumbai Branch', path: '/suppliers' },
  ]

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
        setIsSearchActive(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setIsSearchActive])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setSuggestions([])
      setShowDropdown(false)
      setIsSearchActive(false)
      return
    }

    let combined = []

    const matchedPages = navItems
      .filter(item => item.label && item.label.toLowerCase().includes(q))
      .map(item => ({
        id: `page-${item.path}`,
        type: 'Page',
        name: item.label,
        path: item.path,
        subtext: 'Navigation Link'
      }))
    combined.push(...matchedPages)

    const prodResults = searchProductsByQuery(query, 'all').slice(0, 5)
    const formattedProds = prodResults.map(p => ({
      id: `prod-${p.id}`,
      type: 'Product',
      name: p.name,
      price: formatINR(p.sellingPrice),
      stock: `${p.currentStock} ${p.unit}`,
      path: '/products'
    }))
    combined.push(...formattedProds)

    const matchedExtras = extraData.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.subtext && item.subtext.toLowerCase().includes(q))
    )
    combined.push(...matchedExtras)

    setSuggestions(combined.slice(0, 8))
    setShowDropdown(true)
    setIsSearchActive(true)
  }, [query, setIsSearchActive])

  const pickItem = (item) => {
    setQuery('')
    setShowDropdown(false)
    setIsSearchActive(false)
    if (item.path) {
      navigate(item.path)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    setIsSearchActive(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        pickItem(suggestions[highlightIdx])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setIsSearchActive(false)
      inputRef.current?.blur()
    }
  }

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'Product': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      case 'Page': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      case 'Customer': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      case 'Supplier': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      case 'Category': return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md z-[100]">
      <div className="relative flex items-center w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setHighlightIdx(-1)
          }}
          onFocus={() => { 
            if (query.trim() && suggestions.length > 0) {
              setShowDropdown(true)
              setIsSearchActive(true)
            } 
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search products, pages, customers, suppliers..."
          className="w-full pl-10 pr-8 py-2 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />

        {query && (
          <button onClick={clearSearch} className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[101]">
          {suggestions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => pickItem(item)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all ${idx === highlightIdx
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTypeBadgeColor(item.type)}`}>
                      {item.type}
                    </span>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                      {item.subtext && <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.subtext}</p>}
                    </div>
                  </div>

                  {item.price && (
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.price}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.stock}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="px-4 py-6 text-center">
              <p className="text-slate-500 text-sm">No results found across system</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─── Date Filter & Export Controls ──────────────────────────────
function ControlsToolbar({ exportData }) {
  const [dateFilter, setDateFilter] = useState('7days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [downloadDropdown, setDownloadDropdown] = useState(false)
  const downloadRef = useRef(null)

  const activeData = exportData || [
    { Name: 'Hindustan Distributors', Contact: '9876543210', Balance: '₹0' },
    { Name: 'Gupta FMCG', Contact: '9123456780', Balance: '₹0' }
  ]

  useEffect(() => {
    const handler = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setDownloadDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFilterChange = (e) => {
    const val = e.target.value
    setDateFilter(val)
    if (val === 'custom') {
      setShowCustomModal(true)
    }
  }

  const handleDownload = (format) => {
    setDownloadDropdown(false)

    if (format === 'excel') {
      if (!activeData || activeData.length === 0) {
        alert("Export karne ke liye koi data nahi hai!")
        return
      }

      const headers = Object.keys(activeData[0]).join(',')
      const rows = activeData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
      const csvContent = `${headers}\n${rows}`

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Report_${dateFilter}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else if (format === 'pdf') {
      const headers = Object.keys(activeData[0])
      const printWindow = window.open('', '', 'height=600,width=800')

      printWindow.document.write(`
        <html>
          <head>
            <title>Report_${dateFilter}</title>
            <style>
              body { font-family: sans-serif; padding: 24px; color: #1e293b; }
              h2 { margin-bottom: 4px; color: #0f172a; }
              p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; text-align: left; }
              th, td { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 13px; }
              th { background-color: #f1f5f9; font-weight: bold; }
            </style>
          </head>
          <body>
            <h2>Gupta Traders - Business Report</h2>
            <p>Filter: ${dateFilter.toUpperCase()} | Generated on: ${new Date().toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${activeData.map(row => `
                  <tr>
                    ${headers.map(h => `<td>${row[h]}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <div className="flex items-center gap-2 relative z-50">
      <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 dark:text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
        </svg>
        <select
          value={dateFilter}
          onChange={handleFilterChange}
          className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
        >
          <option value="today" className=" bg-white ">Today</option>
          <option value="7days" className="bg-white ">Last 7 Days</option>
          <option value="30days" className="bg-white">Last 30 Days</option>
          <option value="custom" className="bg-white ">Custom Range</option>
        </select>
      </div>

      <div ref={downloadRef} className="relative">
        <button
          onClick={() => setDownloadDropdown(!downloadDropdown)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span className="hidden sm:inline">Download</span>
        </button>

        {downloadDropdown && (
          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[100]">
            <button
              onClick={() => handleDownload('excel')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Excel (.csv)
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              PDF Document
            </button>
          </div>
        )}
      </div>

      {showCustomModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-100">Select Custom Date Range</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 text-xs text-slate-100 focus:outline-none border border-slate-700 focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 text-xs text-slate-100 focus:outline-none border border-slate-700 focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-colors"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Main Layout Component ───────────────────────────────────────
export default function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(false)

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200 relative">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 z-40 h-full flex flex-col flex-shrink-0
          bg-white dark:bg-slate-950
          border-r border-slate-200 dark:border-slate-800/60
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className={`flex items-center h-16 border-b border-slate-200 dark:border-slate-800/60 flex-shrink-0 ${sidebarOpen ? 'px-5 gap-3' : 'px-0 justify-center'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-500/20 flex-shrink-0">
            G
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-tight truncate">Gupta Traders</h1>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div key={index} className="pt-3 pb-1 px-3">
                  {sidebarOpen ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</span>
                  ) : (
                    <hr className="border-slate-200 dark:border-slate-800" />
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150
                  ${isActive 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'}
                  ${!sidebarOpen && 'justify-center px-0'}
                `}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Bottom Collapse Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/60 hidden lg:block">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`
              w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold 
              text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 
              hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer
              ${!sidebarOpen && 'justify-center px-0'}
            `}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`w-5 h-5 transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {sidebarOpen && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header (Left Aligned Search & Right Side Theme + Admin Profile) */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-30 flex-shrink-0 gap-4">
          
          <div className="flex items-center gap-3 flex-1">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              <MenuIcon />
            </button>

            {/* Left Search Bar */}
            <HeaderSearch navigate={navigate} setIsSearchActive={setIsSearchActive} />
          </div>

          <div className="flex items-center gap-2.5">
            <ControlsToolbar />

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-all shadow-sm cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Admin Profile Dropdown (Right Next To Theme Toggle) */}
            <AdminProfileDropdown navigate={navigate} />
          </div>
        </header>

        {/* Content Body */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ${
          isSearchActive ? 'blur-md pointer-events-none select-none opacity-40' : ''
        }`}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}