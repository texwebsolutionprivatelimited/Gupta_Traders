import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  recordCustomerTransaction,
  getCustomerStats
} from '../../hooks/customerData'
import { formatINR } from '../../hooks/productData'

// ─── SVG Icons ──────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function CustomersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function LedgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function POSIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 inline mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.622c0-1.293 1.05-2.343 2.343-2.343h.718c.213 0 .415.093.55.253l1.71 2.052a.5.5 0 0 1-.035.688l-1.05 1.05a1.5 1.5 0 0 0-.41 1.258c.261 1.144.877 2.183 1.696 3.002.819.819 1.858 1.438 3.002 1.696.536.122 1.096-.067 1.258-.41l1.05-1.05a.5.5 0 0 1 .688-.035l2.052 1.71c.16.135.253.337.253.55v.718c0 1.293-1.05 2.343-2.343 2.343h-.718c-6.844 0-12.427-5.583-12.427-12.427v-.718Z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 inline mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 inline mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.394 48.394 0 0 1 12.5 0m-12.5 0V5.625c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v2.009" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
    </svg>
  )
}

// ─── TOAST ──────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bg = type === 'success'
    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
    : type === 'error'
      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slideIn ${bg}`}>
      {type === 'success' && <CheckIcon />}
      {type === 'error' && <CloseIcon />}
      {type === 'warning' && <WarningIcon />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
        <CloseIcon />
      </button>
    </div>
  )
}

// ─── DELETE CONFIRMATION MODAL ──────────────────────────────────
function DeleteConfirmModal({ customer, onConfirm, onCancel }) {
  const hasBalance = customer.outstandingBalance !== 0

  useEffect(() => {
    const mainEl = document.querySelector('main')
    const originalBodyOverflow = document.body.style.overflow
    const originalMainOverflow = mainEl ? mainEl.style.overflow : ''

    document.body.style.overflow = 'hidden'
    if (mainEl) mainEl.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalBodyOverflow
      if (mainEl) mainEl.style.overflow = originalMainOverflow
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <WarningIcon />
        </div>

        <h3 className="text-xl font-bold text-slate-100 text-center mb-2">
          Delete Customer?
        </h3>
        <p className="text-slate-400 text-center mb-4 text-sm">
          Are you sure you want to delete this customer? This action cannot be undone.
        </p>
        <div className="text-center mb-6">
          <span className="text-slate-200 font-semibold text-lg">{customer.name}</span>
          <p className="text-slate-500 text-xs mt-1">Phone: {customer.phone || 'N/A'}</p>
        </div>

        {hasBalance && (
          <div className="text-rose-400 text-center text-xs mb-6 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            ⚠️ <strong>Warning:</strong> This customer has an outstanding balance of <strong>{formatINR(customer.outstandingBalance)}</strong>. Deleting them might cause invoice accounting issues.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 font-medium hover:bg-slate-700 transition-all text-sm cursor-pointer"
          >
            No, Cancel
          </button>
          <button
            onClick={() => onConfirm(customer.id)}
            className="flex-1 px-5 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/25 transition-all text-sm cursor-pointer"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ADD / EDIT CUSTOMER FORM MODAL ─────────────────────────────
function CustomerFormModal({ customer, onSave, onCancel }) {
  const isEditing = !!customer
  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [gstin, setGstin] = useState(customer?.gstin || '')
  const [city, setCity] = useState(customer?.city || '')
  const [address, setAddress] = useState(customer?.address || '')
  const [customerType, setCustomerType] = useState(customer?.customerType || 'retail')
  const [creditLimit, setCreditLimit] = useState(customer?.creditLimit || 25000)
  const [status, setStatus] = useState(customer?.status || 'active')
  const [profilePic, setProfilePic] = useState(customer?.profilePic || '')
  const [openingBalance, setOpeningBalance] = useState('')
  const [error, setError] = useState('')
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  useEffect(() => {
    const mainEl = document.querySelector('main')
    const originalBodyOverflow = document.body.style.overflow
    const originalMainOverflow = mainEl ? mainEl.style.overflow : ''

    document.body.style.overflow = 'hidden'
    if (mainEl) mainEl.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalBodyOverflow
      if (mainEl) mainEl.style.overflow = originalMainOverflow
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Customer Name is required')
      return
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      city: city.trim(),
      address: address.trim(),
      customerType,
      creditLimit: Number(creditLimit) || 0,
      status,
      profilePic,
    }

    if (!isEditing) {
      payload.openingBalance = Number(openingBalance) || 0
    }

    const result = isEditing
      ? updateCustomer(customer.id, payload)
      : addCustomer(payload)

    if (result.error) {
      setError(result.error)
      return
    }

    onSave(result.data, isEditing ? 'updated' : 'added')
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-lg w-full mx-4 shadow-2xl animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-8 pt-8 pb-5 border-b border-slate-700/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CustomersIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {isEditing ? 'Edit Customer Details' : 'Register New Customer'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {isEditing ? 'Modify account and credit configurations' : 'Add new contractor, wholesaler, or regular client'}
              </p>
            </div>
            <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col items-center gap-3 p-4 bg-slate-950/20 border border-slate-800/80 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start">
                Profile Picture
              </span>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file) {
                    if (!file.type.startsWith('image/')) {
                      setError('Only image files are allowed')
                      return
                    }
                    if (file.size > 2 * 1024 * 1024) {
                      setError('Image size should be less than 2MB')
                      return
                    }
                    const reader = new FileReader()
                    reader.onloadend = () => setProfilePic(reader.result)
                    reader.readAsDataURL(file)
                  }
                }}
                onClick={() => document.getElementById('profilePicInput').click()}
                className="group relative w-20 h-20 rounded-full border-2 border-dashed border-slate-700 hover:border-teal-500/80 bg-slate-950/40 flex items-center justify-center overflow-hidden cursor-pointer transition-all shrink-0"
              >
                {profilePic ? (
                  <>
                    <img src={profilePic} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] text-teal-300 font-bold uppercase">Change</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-500 group-hover:text-teal-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-auto opacity-70 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="text-[9px] font-bold block leading-tight">Drag / Upload</span>
                  </div>
                )}
              </div>
              <input
                id="profilePicInput"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (!file.type.startsWith('image/')) {
                      setError('Only image files are allowed')
                      return
                    }
                    if (file.size > 2 * 1024 * 1024) {
                      setError('Image size should be less than 2MB')
                      return
                    }
                    const reader = new FileReader()
                    reader.onloadend = () => setProfilePic(reader.result)
                    reader.readAsDataURL(file)
                  }
                }}
                className="hidden"
              />
              {profilePic && (
                <button
                  type="button"
                  onClick={() => setProfilePic('')}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-350 transition-colors cursor-pointer"
                >
                  Remove Image
                </button>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Customer Name *
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sunil Gupta"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 94161 22334"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                placeholder="e.g. 06AABCS4455P1Z3"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. email@domain.com"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                City / Town
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Rohtak"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Customer Type
              </label>
              <select
                value={customerType}
                onChange={e => setCustomerType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm font-semibold"
              >
                <option value="retail">Retail Client (Cash/Walk-in)</option>
                <option value="regular">Regular Buyer (Small Credit)</option>
                <option value="contractor">Contractor / Builder (Bulk Credit)</option>
                <option value="wholesaler">Wholesaler / Distributor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                placeholder="25000"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm font-semibold"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm font-semibold"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Billing Address
              </label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Complete street address details..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 text-sm resize-none"
              />
            </div>

            {!isEditing && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5">
                  OPENING BALANCE (₹)
                  <span className="text-[10px] lowercase text-slate-500 ml-1.5 font-normal">
                    (Use positive if they owe you, negative for advance deposit/credits)
                  </span>
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 border-dashed rounded-xl text-teal-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 text-sm font-semibold"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-800/40">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 font-medium hover:bg-slate-700 transition-all text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-100 font-medium transition-all text-sm cursor-pointer shadow-lg shadow-teal-600/20"
            >
              {isEditing ? 'Save Changes' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DETAILED LEDGER VIEW MODAL ──────────────────────────────────

function CustomerLedgerModal({ customer, onTransactionRecorded, onClose }) {
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'Admin'
  const [txnAmount, setTxnAmount] = useState('')
  const [txnType, setTxnType] = useState('payment') // 'payment', 'invoice', or 'adjustment'
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [refNo, setRefNo] = useState('')
  const [txnDescription, setTxnDescription] = useState('Payment received')
  const [error, setError] = useState('')
  const listEndRef = useRef(null)

  useEffect(() => {
    const mainEl = document.querySelector('main')
    const originalBodyOverflow = document.body.style.overflow
    const originalMainOverflow = mainEl ? mainEl.style.overflow : ''

    document.body.style.overflow = 'hidden'
    if (mainEl) mainEl.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalBodyOverflow
      if (mainEl) mainEl.style.overflow = originalMainOverflow
    }
  }, [])

  function handleRecordTxn(e) {
    e.preventDefault()
    setError('')

    const amt = Number(txnAmount)
    if (!txnAmount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    if (!txnDescription.trim()) {
      setError('Please enter a brief transaction description')
      return
    }

    let finalDesc = txnDescription.trim()
    if (txnType === 'payment') {
      finalDesc += ` via ${paymentMode} ${refNo ? `(Ref: ${refNo})` : ''}`
    }

    const payload = {
      type: txnType,
      amount: amt,
      description: finalDesc,
    }

    const result = recordCustomerTransaction(customer.id, payload)
    if (result.error) {
      setError(result.error)
      return
    }

    // Clear form
    setTxnAmount('')
    setTxnDescription('')
    setRefNo('')
    onTransactionRecorded(result.data, `Transaction recorded successfully`)
  }

  function handleTypeChange(type) {
    setTxnType(type)
    if (type === 'payment') {
      setTxnDescription('Payment received')
    } else if (type === 'invoice') {
      setTxnDescription('Sales Invoice #GT-')
    } else {
      setTxnDescription('Balance adjustment')
    }
  }

  function handlePrintStatement() {
    const printWindow = window.open('', '_blank')
    const ledgerHTML = `
      <html>
        <head>
          <title>Gupta Traders - Customer Account Statement</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .meta { font-size: 14px; text-align: right; }
            .cust-info { margin: 20px 0; font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .debit { color: #dc2626; font-weight: bold; }
            .credit { color: #16a34a; font-weight: bold; }
            .summary { margin-top: 30px; text-align: right; font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">GUPTA TRADERS</div>
              <div>Main Market, Rohtak, Haryana</div>
              <div>Phone: +91 98123 45678 | Email: billing@guptatraders.com</div>
            </div>
            <div class="meta">
              <h2>Customer Statement</h2>
              <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
              <div>Account ID: ${customer.id}</div>
            </div>
          </div>
          <div class="cust-info">
            <strong>Customer Details:</strong><br>
            Name: ${customer.name}<br>
            Phone: ${customer.phone || 'N/A'}<br>
            Email: ${customer.email || 'N/A'}<br>
            City: ${customer.city || 'N/A'}<br>
            GSTIN: ${customer.gstin || 'N/A'}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th class="text-right">Debit (Invoiced)</th>
                <th class="text-right">Credit (Received)</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${customer.ledger.map(entry => {
      const isInvoice = entry.type === 'invoice' || (entry.type === 'opening_balance' && entry.amount >= 0)
      const isPayment = entry.type === 'payment' || (entry.type === 'opening_balance' && entry.amount < 0)
      const debit = isInvoice ? formatINR(Math.abs(entry.amount)) : ''
      const credit = isPayment ? formatINR(Math.abs(entry.amount)) : ''

      return `
                  <tr>
                    <td>${new Date(entry.date).toLocaleDateString('en-IN')}</td>
                    <td>${entry.type.toUpperCase().replace('_', ' ')}</td>
                    <td>${entry.description}</td>
                    <td class="text-right debit">${debit}</td>
                    <td class="text-right credit">${credit}</td>
                    <td class="text-right">${formatINR(entry.balanceAfter)}</td>
                  </tr>
                `
    }).join('')}
            </tbody>
          </table>
          <div class="summary">
            Current Outstanding Balance: ${formatINR(customer.outstandingBalance)}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `
    printWindow.document.write(ledgerHTML)
    printWindow.document.close()
  }

  // Credit limit progress stats
  const creditUsagePct = Math.min(Math.round((customer.outstandingBalance / customer.creditLimit) * 100), 100)
  const isOverLimit = customer.outstandingBalance > customer.creditLimit
  const progressBg = isOverLimit ? 'bg-rose-500' : creditUsagePct > 80 ? 'bg-amber-500' : 'bg-teal-500'

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-0 animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-5xl w-full shadow-2xl animate-scaleIn overflow-hidden flex flex-col md:flex-row h-auto md:h-[85vh] md:max-h-[750px] my-auto" onClick={e => e.stopPropagation()}>

        {/* Left column: Customer Profile & Transaction Recorder */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/20 p-6 flex flex-col justify-between shrink-0 md:overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {customer.id}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${customer.status === 'active' ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                {customer.status}
              </span>
            </div>

            {customer.profilePic && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-800 mb-4 shadow-lg shrink-0">
                <img src={customer.profilePic} alt={customer.name} className="w-full h-full object-cover" />
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-100 mb-1 leading-tight">
              {customer.name}
            </h2>
            <div className="flex gap-1.5 mb-4">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${customer.customerType === 'contractor' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                customer.customerType === 'wholesaler' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20' :
                  customer.customerType === 'regular' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' :
                    'bg-slate-500/15 text-slate-400 border border-slate-800'
                }`}>
                {customer.customerType}
              </span>
            </div>

            <div className="space-y-2 mb-6 text-xs text-slate-400">
              {customer.phone && (
                <div className="flex items-center">
                  <PhoneIcon />
                  <span className="select-all">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="truncate flex items-center">
                  <EmailIcon />
                  <span className="select-all">{customer.email}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-start">
                  <span className="shrink-0 mt-0.5"><MapIcon /></span>
                  <span>{customer.address ? `${customer.address}, ` : ''}{customer.city}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/40 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>GSTIN: <span className="text-slate-300 font-semibold">{customer.gstin}</span></span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(customer.gstin)
                  }} className="cursor-pointer hover:bg-slate-800 p-0.5 rounded transition-colors">
                    <CopyIcon />
                  </button>
                </div>
              )}
            </div>

            {/* Balances card */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 mb-5 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Outstanding Balance
              </div>
              <div className={`text-2xl font-black ${customer.outstandingBalance > 0
                ? 'text-rose-400'
                : customer.outstandingBalance < 0
                  ? 'text-emerald-400'
                  : 'text-slate-400'
                }`}>
                {formatINR(customer.outstandingBalance)}
              </div>
              <div className="text-[9px] text-slate-500 mt-1.5">
                {customer.outstandingBalance > 0
                  ? '⚠️ Receivables (Customer owes us)'
                  : customer.outstandingBalance < 0
                    ? '🤝 Customer Credit (Advance deposit)'
                    : '✅ Accounts Settle/Clear'}
              </div>
            </div>

            {/* Credit Limit utilization status */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5">
                <span>CREDIT LIMIT USED</span>
                <span className={isOverLimit ? 'text-rose-400' : 'text-slate-300'}>
                  {creditUsagePct}% ({formatINR(Math.max(0, customer.outstandingBalance))})
                </span>
              </div>
              <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full ${progressBg} transition-all duration-500`}
                  style={{ width: `${Math.max(0, Math.min(100, customer.outstandingBalance > 0 ? creditUsagePct : 0))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>Limit: {formatINR(customer.creditLimit)}</span>
                {isOverLimit && <span className="text-rose-400 font-bold">BREACHED!</span>}
              </div>
            </div>
          </div>

          {/* Quick Action Transaction Form */}
          {userRole !== 'Cashier' && (
            <div className="border-t border-slate-800/80 pt-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Record Transaction
              </h4>

              <form onSubmit={handleRecordTxn} className="space-y-3">
                {error && (
                  <p className="text-[10px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    {error}
                  </p>
                )}

                <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('payment')}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${txnType === 'payment' ? 'bg-teal-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Received Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('invoice')}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${txnType === 'invoice' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Bill Debit
                  </button>
                </div>

                <div>
                  <input
                    type="number"
                    value={txnAmount}
                    onChange={e => setTxnAmount(e.target.value)}
                    placeholder="Amount (₹)"
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-teal-500/60 text-xs font-semibold"
                  />
                </div>

                {txnType === 'payment' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="px-2 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 text-[11px] focus:outline-none focus:border-teal-500/60"
                    >
                      <option value="UPI">UPI (GPay/Paytm)</option>
                      <option value="Cash">Cash Hand</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="Cheque">Cheque Deposit</option>
                    </select>
                    <input
                      type="text"
                      value={refNo}
                      onChange={e => setRefNo(e.target.value)}
                      placeholder="Ref # (Optional)"
                      className="w-full px-2 py-1.5 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500/60 text-[11px]"
                    />
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={txnDescription}
                    onChange={e => setTxnDescription(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-teal-500/60 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-100 font-bold rounded-lg text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Record Entry
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Ledger History */}
        <div className="flex-1 flex flex-col bg-slate-950/10 min-h-0">
          <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-md font-bold text-slate-200">
                Customer Ledger Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial transaction history statement
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrintStatement}
                className="text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-900/60 p-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
              >
                <PrintIcon />
                <span>Statement</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 transition-colors p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto min-h-0 max-h-[400px] md:max-h-[none] scrollbar-thin">
            {customer.ledger && customer.ledger.length > 0 ? (
              <div className="space-y-4">
                {customer.ledger.map((entry) => {
                  let badgeColor = ''
                  let typeLabel = ''
                  let amtPrefix = ''
                  let amountColor = ''

                  switch (entry.type) {
                    case 'opening_balance':
                      badgeColor = 'bg-slate-800 text-slate-300'
                      typeLabel = 'Opening Bal'
                      amtPrefix = entry.amount >= 0 ? '' : ''
                      amountColor = 'text-slate-300 font-semibold'
                      break
                    case 'invoice':
                      badgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                      typeLabel = 'Invoice'
                      amtPrefix = '+'
                      amountColor = 'text-rose-400 font-bold'
                      break
                    case 'payment':
                      badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      typeLabel = 'Payment'
                      amtPrefix = '-'
                      amountColor = 'text-emerald-400 font-bold'
                      break
                    case 'adjustment':
                      badgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                      typeLabel = 'Adjustment'
                      amtPrefix = entry.amount >= 0 ? '+' : '-'
                      amountColor = entry.amount >= 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'
                      break
                  }

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 flex flex-col items-center justify-center shrink-0 border border-slate-800/80">
                          <span className="text-[10px] text-teal-400/80 font-bold uppercase">
                            {new Date(entry.date).toLocaleString('en', { month: 'short' })}
                          </span>
                          <span className="text-slate-200 font-extrabold text-sm leading-none mt-0.5">
                            {new Date(entry.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                              {typeLabel}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-200 mt-1">
                            {entry.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between items-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                        <span className="text-xs text-slate-500 sm:hidden">Amount & Balance</span>
                        <div className="text-right">
                          <div className={`font-bold text-sm ${amountColor}`}>
                            {amtPrefix}{formatINR(Math.abs(entry.amount))}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Bal: {formatINR(entry.balanceAfter)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <LedgerIcon />
                <p className="text-sm font-semibold mt-3">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN CUSTOMER PAGE COMPONENT ───────────────────────────────

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'Admin'

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Lists & Stats
  const [customers, setCustomers] = useState([])

  // Reset page to 1 when filters or sort order change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, statusFilter, sortBy])
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalReceivables: 0,
    totalAdvances: 0,
    totalCreditLimit: 0,
    utilisedCredit: 0,
    overdueCount: 0
  })

  // Modals & UI Controls
  const [showFormModal, setShowFormModal] = useState(false)
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Toast notifications
  const [toast, setToast] = useState(null)

  // Sync Search Query from URL Search Params (e.g. from POS clicking view customer)
  useEffect(() => {
    const searchVal = searchParams.get('search')
    if (searchVal !== null) {
      setSearchQuery(searchVal)
    }
  }, [searchParams])

  // Load Data
  const loadData = () => {
    const list = getCustomers()
    setCustomers(list)
    setStats(getCustomerStats())

    // If ledger modal is open, update selected customer details to match updated stats
    if (showLedgerModal && selectedCustomer) {
      const updatedCust = list.find(c => c.id === selectedCustomer.id)
      if (updatedCust) {
        setSelectedCustomer(updatedCust)
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [showLedgerModal])

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleSaveCustomer = (data, action) => {
    if (userRole === 'Cashier') {
      triggerToast('Permission Denied: Cashier cannot register or edit customers', 'error')
      return
    }
    setShowFormModal(false)
    setSelectedCustomer(null)
    loadData()
    triggerToast(
      `Customer "${data.name}" ${action === 'updated' ? 'details updated' : 'registered successfully'}`,
      'success'
    )
  }

  const handleDeleteConfirm = (id) => {
    if (userRole === 'Cashier') {
      triggerToast('Permission Denied: Cashier cannot delete customers', 'error')
      return
    }
    const res = deleteCustomer(id)
    setShowDeleteModal(false)
    setSelectedCustomer(null)
    if (res.error) {
      triggerToast(res.error, 'error')
    } else {
      loadData()
      triggerToast('Customer deleted successfully', 'success')
    }
  }

  const handleTransactionRecorded = (updatedCust, message) => {
    loadData()
    setSelectedCustomer(updatedCust)
    triggerToast(message, 'success')
  }

  // Clear Filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setStatusFilter('all')
    setSortBy('newest')
    setCurrentPage(1)
    setSearchParams({})
  }

  // Filter & Search logic
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query ||
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.gstin && c.gstin.toLowerCase().includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      c.id.toLowerCase().includes(query)

    const matchesType = typeFilter === 'all' || c.customerType === typeFilter

    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = c.status === 'active'
    else if (statusFilter === 'inactive') matchesStatus = c.status === 'inactive'
    else if (statusFilter === 'receivables') matchesStatus = c.status === 'active' && c.outstandingBalance > 0
    else if (statusFilter === 'advances') matchesStatus = c.status === 'active' && c.outstandingBalance < 0
    else if (statusFilter === 'overdue') matchesStatus = c.status === 'active' && c.outstandingBalance > c.creditLimit

    return matchesSearch && matchesType && matchesStatus
  })

  // Sort logic
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name)
    }
    return 0
  })

  // Pagination logic
  const totalItems = sortedCustomers.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Ensure current page doesn't exceed total pages if list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Format type badges
  const renderTypeBadge = (type) => {
    let classes = ''
    switch (type) {
      case 'contractor':
        classes = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        break
      case 'wholesaler':
        classes = 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
        break
      case 'regular':
        classes = 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
        break
      default:
        classes = 'bg-slate-500/10 text-slate-400 border border-slate-800'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${classes}`}>
        {type}
      </span>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 font-semibold text-slate-400">
              ERP Module
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer credit, outstanding invoices, advances, and transaction ledgers.
          </p>
        </div>
        {userRole !== 'Cashier' && (
          <button
            onClick={() => {
              setSelectedCustomer(null)
              setShowFormModal(true)
            }}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-100 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <PlusIcon />
            <span>Register Customer</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <CustomersIcon />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Clients</p>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{stats.totalCustomers}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">
              {stats.activeCustomers} Active Profiles
            </p>
          </div>
        </div>

        {/* Card 2: Receivables */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.727.054a3.5 3.5 0 1 0 0-7.09l-.727.054M15 6.341C14.5 5.5 13 4.5 12 4.5c-1 0-2.5 1-3 1.841M15 17.66c-.5.84-2 1.84-3 1.84-1 0-2.5-1-3-1.841" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Owed Receivables</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">{formatINR(stats.totalReceivables)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Outstanding credit balance
            </p>
          </div>
        </div>

        {/* Card 3: Advances */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Advances Held</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatINR(stats.totalAdvances)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Deposit credits/advance pay
            </p>
          </div>
        </div>

        {/* Card 4: Limit Breaches */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Limit Breaches</p>
            <h3 className={`text-2xl font-black mt-1 ${stats.overdueCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {stats.overdueCount}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Outstanding exceeds limit
            </p>
          </div>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setSearchParams(e.target.value ? { search: e.target.value } : {})
            }}
            placeholder="Search by Name, Contact, GSTIN, or City..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-teal-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchParams({}); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/85 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="retail">Retail Clients</option>
              <option value="regular">Regular</option>
              <option value="contractor">Contractors</option>
              <option value="wholesaler">Wholesalers</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/85 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Balance:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="receivables">Owed/Receivables (&gt;0)</option>
              <option value="advances">Advances/Credits (&lt;0)</option>
              <option value="overdue">Credit Breached</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/85 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer text-slate-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>

          {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-semibold text-teal-400 hover:text-teal-300 border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 rounded-xl cursor-pointer transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      {/* Desktop view table — hidden on mobile */}
      <div className="hidden lg:block bg-slate-900 border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Client Type</th>
                <th className="px-6 py-4">Credit Utilisation</th>
                <th className="px-6 py-4 text-right">Outstanding Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((cust) => {
                  const creditLimit = cust.creditLimit || 1
                  const usagePct = Math.min(Math.round((cust.outstandingBalance / creditLimit) * 100), 100)
                  const isBreach = cust.outstandingBalance > creditLimit
                  const barColor = isBreach ? 'bg-rose-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-teal-500'

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-950/20 transition-colors group"
                    >
                      {/* Column 1: Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 text-slate-400 border border-slate-850 flex items-center justify-center text-xs font-bold leading-none shrink-0 group-hover:border-teal-500/35 overflow-hidden transition-colors">
                            {cust.profilePic ? (
                              <img src={cust.profilePic} alt={cust.name} className="w-full h-full object-cover" />
                            ) : (
                              cust.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-200 group-hover:text-slate-100 transition-colors">
                                {cust.name}
                              </span>
                              <span className="text-[9px] font-bold font-mono text-slate-500 bg-slate-800/40 border border-slate-800 px-1.5 py-0.2 rounded">
                                {cust.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium space-x-2 mt-1">
                              {cust.phone && <span>📞 {cust.phone}</span>}
                              {cust.city && <span>📍 {cust.city}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Type */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {renderTypeBadge(cust.customerType)}
                          {cust.gstin && (
                            <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase">
                              GSTIN: {cust.gstin}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Credit Usage */}
                      <td className="px-6 py-4 min-w-[180px]">
                        {cust.outstandingBalance > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-400 leading-none">
                              <span>Used: {usagePct}%</span>
                              <span>Lim: {formatINR(cust.creditLimit)}</span>
                            </div>
                            <div className="w-full bg-slate-950 border border-slate-850 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barColor} transition-all duration-300`}
                                style={{ width: `${usagePct}%` }}
                              ></div>
                            </div>
                            {isBreach && (
                              <p className="text-[9px] text-rose-400 font-bold leading-none animate-pulse">
                                Over credit limit!
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium italic">
                            No credit used
                          </span>
                        )}
                      </td>

                      {/* Column 4: Outstanding Balance */}
                      <td className="px-6 py-4 text-right">
                        <div className="font-mono">
                          <span className={`text-sm font-black ${cust.outstandingBalance > 0
                            ? 'text-rose-400'
                            : cust.outstandingBalance < 0
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                            }`}>
                            {formatINR(cust.outstandingBalance)}
                          </span>
                          <p className="text-[9px] text-slate-500 font-sans mt-0.5">
                            {cust.outstandingBalance > 0
                              ? 'receivables'
                              : cust.outstandingBalance < 0
                                ? 'advance deposit'
                                : 'settled'}
                          </p>
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cust.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-500/10 text-slate-400'
                          }`}>
                          {cust.status}
                        </span>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(cust)
                              setShowLedgerModal(true)
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-teal-400 hover:bg-slate-850 hover:text-teal-300 transition-all cursor-pointer"
                            title="Account Ledger Statement"
                          >
                            <LedgerIcon />
                          </button>

                          <button
                            onClick={() => {
                              navigate(`/pos?customerName=${encodeURIComponent(cust.name)}`)
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-emerald-400 hover:bg-slate-850 hover:text-emerald-300 transition-all cursor-pointer"
                            title="Generate Bill for Customer"
                          >
                            <POSIcon />
                          </button>

                          {userRole !== 'Cashier' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust)
                                  setShowFormModal(true)
                                }}
                                className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-blue-400 hover:bg-slate-850 hover:text-blue-300 transition-all cursor-pointer"
                                title="Edit Customer Details"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust)
                                  setShowDeleteModal(true)
                                }}
                                className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-rose-500 hover:bg-slate-850 hover:text-rose-400 transition-all cursor-pointer"
                                title="Delete Customer"
                              >
                                <DeleteIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-550">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-650 mx-auto mb-3">
                      <CustomersIcon />
                    </div>
                    <p className="text-sm font-semibold">No customers found</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Try adjusting your keywords, type filter, or add a new customer.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view card grid — hidden on desktop */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paginatedCustomers.length > 0 ? (
          paginatedCustomers.map((cust) => {
            const creditLimit = cust.creditLimit || 1
            const usagePct = Math.min(Math.round((cust.outstandingBalance / creditLimit) * 100), 100)
            const isBreach = cust.outstandingBalance > creditLimit
            const barColor = isBreach ? 'bg-rose-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-teal-500'

            return (
              <div key={cust.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200 space-y-3">
                {/* Top Row: Profile, Name, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 text-slate-400 border border-slate-850 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                      {cust.profilePic ? (
                        <img src={cust.profilePic} alt={cust.name} className="w-full h-full object-cover" />
                      ) : (
                        cust.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-200 truncate">{cust.name}</h3>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {cust.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${cust.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-500/10 text-slate-400'
                    }`}>
                    {cust.status}
                  </span>
                </div>

                {/* Client Type & GSTIN */}
                <div className="flex flex-wrap items-center gap-2">
                  {renderTypeBadge(cust.customerType)}
                  {cust.gstin && (
                    <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 uppercase tracking-wider">
                      GSTIN: {cust.gstin}
                    </span>
                  )}
                </div>

                {/* Contact & Location Details */}
                {(cust.phone || cust.city) && (
                  <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/40">
                    {cust.phone && (
                      <div className="flex items-center gap-1.5">
                        <span>📞</span>
                        <a href={`tel:${cust.phone}`} className="hover:underline font-medium">{cust.phone}</a>
                      </div>
                    )}
                    {cust.city && (
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{cust.city}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Credit Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 leading-none">
                    <span>Credit Used: {cust.outstandingBalance > 0 ? `${usagePct}%` : '0%'}</span>
                    <span>Limit: {formatINR(creditLimit)}</span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-850 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-300`}
                      style={{ width: `${cust.outstandingBalance > 0 ? usagePct : 0}%` }}
                    ></div>
                  </div>
                  {cust.outstandingBalance > creditLimit && (
                    <p className="text-[9px] text-rose-400 font-bold leading-none animate-pulse">
                      Over credit limit!
                    </p>
                  )}
                </div>

                {/* Balance & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                  <div>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider leading-none mb-1">Outstanding</p>
                    <div className="font-mono">
                      <span className={`text-sm font-black ${cust.outstandingBalance > 0
                        ? 'text-rose-400'
                        : cust.outstandingBalance < 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                        }`}>
                        {formatINR(cust.outstandingBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedCustomer(cust)
                        setShowLedgerModal(true)
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-500/10 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-100 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <LedgerIcon />
                      Ledger
                    </button>

                    <button
                      onClick={() => {
                        navigate(`/pos?customerName=${encodeURIComponent(cust.name)}`)
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-500/10 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-450 hover:text-slate-100 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <POSIcon />
                      Bill
                    </button>

                    {userRole !== 'Cashier' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCustomer(cust)
                            setShowFormModal(true)
                          }}
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-blue-400 hover:text-slate-200 transition-all cursor-pointer"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(cust)
                            setShowDeleteModal(true)
                          }}
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-rose-500 hover:text-slate-200 transition-all cursor-pointer"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-16 text-center text-slate-500 col-span-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-650 mx-auto mb-3">
              <CustomersIcon />
            </div>
            <p className="text-sm font-semibold">No customers found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400">
            Showing <span className="text-slate-200">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to{' '}
            <span className="text-slate-200">{Math.min(totalItems, currentPage * pageSize)}</span> of{' '}
            <span className="text-slate-200">{totalItems}</span> customers
          </div>

          <div className="flex items-center gap-1.5">
            {/* Prev Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border border-slate-800 bg-slate-950/40 text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${currentPage === 1
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-350 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-900'
                }`}
              title="Previous Page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (
                totalPages <= 5 ||
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              ) {
                const isActive = page === currentPage
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isActive
                      ? 'bg-teal-600 border-teal-500/30 text-slate-100 shadow-md shadow-teal-600/20'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                  >
                    {page}
                  </button>
                )
              }
              if (page === 2 || page === totalPages - 1) {
                return (
                  <span key={page} className="px-1 text-slate-500 text-xs font-bold">
                    ...
                  </span>
                )
              }
              return null
            })}

            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border border-slate-800 bg-slate-950/40 text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${currentPage === totalPages
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-350 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-900'
                }`}
              title="Next Page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Form Dialog Modal */}
      {showFormModal && (
        <CustomerFormModal
          customer={selectedCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setShowFormModal(false)
            setSelectedCustomer(null)
          }}
        />
      )}

      {/* Ledger Modal Drawer */}
      {showLedgerModal && selectedCustomer && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          onTransactionRecorded={handleTransactionRecorded}
          onClose={() => {
            setShowLedgerModal(false)
            setSelectedCustomer(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && selectedCustomer && (
        <DeleteConfirmModal
          customer={selectedCustomer}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false)
            setSelectedCustomer(null)
          }}
        />
      )}

    </div>
  )
}
