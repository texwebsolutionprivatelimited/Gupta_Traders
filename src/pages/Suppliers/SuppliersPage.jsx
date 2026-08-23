import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  recordSupplierTransaction,
  getSupplierStats
} from '../../hooks/supplierData'
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

function SuppliersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.143-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
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

function InvoiceIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function PaymentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
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

function DeleteConfirmModal({ supplier, onConfirm, onCancel }) {
  const hasBalance = supplier.outstandingBalance !== 0

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <WarningIcon />
        </div>

        <h3 className="text-xl font-bold text-slate-100 text-center mb-2">
          Delete Supplier?
        </h3>
        <p className="text-slate-400 text-center mb-4 text-sm">
          Are you sure you want to delete this supplier? This action cannot be undone.
        </p>
        <div className="text-center mb-6">
          <span className="text-slate-200 font-semibold text-lg">{supplier.companyName}</span>
          <p className="text-slate-500 text-xs mt-1">Contact: {supplier.contactPerson}</p>
        </div>

        {hasBalance && (
          <div className="text-rose-400 text-center text-xs mb-6 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            ⚠️ <strong>Warning:</strong> This supplier has a non-zero outstanding balance of <strong>{formatINR(supplier.outstandingBalance)}</strong>. Deleting them might result in accounting discrepancies.
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
            onClick={() => onConfirm(supplier.id)}
            className="flex-1 px-5 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/25 transition-all text-sm cursor-pointer"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ADD / EDIT SUPPLIER FORM MODAL ─────────────────────────────

function SupplierFormModal({ supplier, onSave, onCancel }) {
  const isEditing = !!supplier
  const [companyName, setCompanyName] = useState(supplier?.companyName || '')
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson || '')
  const [phone, setPhone] = useState(supplier?.phone || '')
  const [email, setEmail] = useState(supplier?.email || '')
  const [gstin, setGstin] = useState(supplier?.gstin || '')
  const [city, setCity] = useState(supplier?.city || '')
  const [address, setAddress] = useState(supplier?.address || '')
  const [status, setStatus] = useState(supplier?.status || 'active')
  const [openingBalance, setOpeningBalance] = useState('')
  const [productsInput, setProductsInput] = useState(supplier?.productsSupplied?.join(', ') || '')
  const [error, setError] = useState('')
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company Name is required')
      return
    }

    const products = productsInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    const payload = {
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      city: city.trim(),
      address: address.trim(),
      status,
      productsSupplied: products,
    }

    if (!isEditing) {
      payload.openingBalance = Number(openingBalance) || 0
    }

    const result = isEditing
      ? updateSupplier(supplier.id, payload)
      : addSupplier(payload)

    if (result.error) {
      setError(result.error)
      return
    }

    onSave(result.data, isEditing ? 'updated' : 'added')
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-lg w-full mx-4 shadow-2xl animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-slate-700/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <SuppliersIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {isEditing ? 'Edit Supplier Details' : 'Register New Supplier'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {isEditing ? 'Modify contact or billing information' : 'Add new vendor or supplier to ERP'}
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
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Company Name *
              </label>
              <input
                ref={nameRef}
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Garg Cement Agency"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Contact Person Name
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="e.g. Sanjay Garg"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                GSTIN Number (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                placeholder="e.g. 06AAACG5544K2Z1"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
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
                placeholder="e.g. +91 94160 54321"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
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
                placeholder="e.g. contact@company.com"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
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
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Address
              </label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Complete street address details..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm resize-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Products Supplied (Comma-separated)
              </label>
              <input
                type="text"
                value={productsInput}
                onChange={e => setProductsInput(e.target.value)}
                placeholder="e.g. Cement, Steel, Paints, Primer"
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 text-sm"
              />
            </div>

            {!isEditing && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 tracking-wider mb-1.5">
                  OPENING BALANCE (₹)
                  <span className="text-[10px] lowercase text-slate-500 ml-1.5 font-normal">
                    (Use positive if you owe them, negative for advance paid)
                  </span>
                </label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 border-dashed rounded-xl text-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-sm font-semibold"
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
              className="flex-1 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-medium transition-all text-sm cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {isEditing ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DETAILED LEDGER VIEW MODAL ──────────────────────────────────

function SupplierLedgerModal({ supplier, onTransactionRecorded, onClose }) {
  const [txnType, setTxnType] = useState('payment') // 'invoice' or 'payment' or 'adjustment'
  const [txnAmount, setTxnAmount] = useState('')
  const [txnDescription, setTxnDescription] = useState('')
  const [error, setError] = useState('')

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

    const payload = {
      type: txnType,
      amount: amt,
      description: txnDescription.trim(),
    }

    const result = recordSupplierTransaction(supplier.id, payload)
    if (result.error) {
      setError(result.error)
      return
    }

    // Clear form
    setTxnAmount('')
    setTxnDescription('')
    onTransactionRecorded(result.data, `Transaction recorded successfully`)
  }

  // Pre-fill description based on type for quick entry
  function handleTypeChange(type) {
    setTxnType(type)
    if (type === 'payment') {
      setTxnDescription('Payment made')
    } else if (type === 'invoice') {
      setTxnDescription('Purchase Invoice #')
    } else {
      setTxnDescription('Balance adjustment')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-4xl w-full mx-4 shadow-2xl animate-scaleIn overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[750px]" onClick={e => e.stopPropagation()}>

        {/* Left column: Supplier Profile & Transaction Recorder */}
        <div className="w-full md:w-80 border-r border-slate-800/80 bg-slate-950/20 p-6 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {supplier.id}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${supplier.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                {supplier.status}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-1 leading-tight">
              {supplier.companyName}
            </h2>
            <p className="text-xs text-indigo-400 font-medium mb-4">
              Contact: {supplier.contactPerson || 'Not provided'}
            </p>

            <div className="space-y-2 mb-6 text-xs text-slate-400">
              {supplier.phone && (
                <div>
                  <PhoneIcon />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="truncate">
                  <EmailIcon />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.city && (
                <div>
                  <MapIcon />
                  <span>{supplier.city}, {supplier.address}</span>
                </div>
              )}
              {supplier.gstin && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/40 text-[10px] font-mono text-slate-500">
                  GSTIN: {supplier.gstin}
                </div>
              )}
            </div>

            {/* Balances card */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 mb-6 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Outstanding Balance
              </div>
              <div className={`text-2xl font-black ${supplier.outstandingBalance > 0
                ? 'text-rose-400'
                : supplier.outstandingBalance < 0
                  ? 'text-emerald-400'
                  : 'text-slate-400'
                }`}>
                {formatINR(supplier.outstandingBalance)}
              </div>
              <div className="text-[9px] text-slate-500 mt-1">
                {supplier.outstandingBalance > 0
                  ? '⚠️ Accounts Payable (We owe them)'
                  : supplier.outstandingBalance < 0
                    ? '🤝 Advance Paid (Credit balance)'
                    : '✅ Accounts Settle/Clear'}
              </div>
            </div>
          </div>

          {/* Quick Action Transaction Form */}
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
                  className={`flex-1 text-[10px] py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${txnType === 'payment' ? 'bg-indigo-600 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  We Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('invoice')}
                  className={`flex-1 text-[10px] py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${txnType === 'invoice' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Purchase
                </button>
              </div>

              <div>
                <input
                  type="number"
                  value={txnAmount}
                  onChange={e => setTxnAmount(e.target.value)}
                  placeholder="Amount (₹)"
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500/60 text-xs"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={txnDescription}
                  onChange={e => setTxnDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500/60 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold rounded-lg text-xs tracking-wider transition-colors cursor-pointer"
              >
                Record Entry
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Ledger History */}
        <div className="flex-1 flex flex-col bg-slate-950/10 min-h-0">
          <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-md font-bold text-slate-200">
                Supplier Ledger Account
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial transaction history statement
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto min-h-0">
            {supplier.ledger && supplier.ledger.length > 0 ? (
              <div className="space-y-4">
                {supplier.ledger.map((entry) => {
                  let badgeColor = ''
                  let typeLabel = ''
                  let amtPrefix = ''
                  let amountColor = ''

                  switch (entry.type) {
                    case 'opening_balance':
                      badgeColor = 'bg-slate-800 text-slate-300'
                      typeLabel = 'Opening Bal'
                      amtPrefix = ''
                      amountColor = 'text-slate-300'
                      break
                    case 'invoice':
                      badgeColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                      typeLabel = 'Invoice'
                      amtPrefix = '+'
                      amountColor = 'text-rose-400'
                      break
                    case 'payment':
                      badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      typeLabel = 'Payment'
                      amtPrefix = '-'
                      amountColor = 'text-emerald-400'
                      break
                    case 'adjustment':
                      badgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                      typeLabel = 'Adjustment'
                      amtPrefix = entry.amount >= 0 ? '+' : '-'
                      amountColor = entry.amount >= 0 ? 'text-amber-400' : 'text-emerald-400'
                      break
                  }

                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 flex flex-col items-center justify-center shrink-0 border border-slate-800/80">
                          <span className="text-[10px] text-indigo-400/80 font-bold uppercase">
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
                <p className="text-xs text-slate-600 mt-1">Record a purchase or payment to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN SUPPLIERS PAGE ────────────────────────────────────────

export default function SuppliersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') || ''

  const [suppliers, setSuppliers] = useState([])
  const [stats, setStats] = useState({ totalSuppliers: 0, activeSuppliers: 0, totalPayables: 0, totalAdvances: 0 })
  const [search, setSearch] = useState(urlSearch)
  const [filterBalance, setFilterBalance] = useState('all') // 'all', 'payables', 'advances', 'clear'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'

  // Sync state if URL param changes
  useEffect(() => {
    setSearch(urlSearch)
  }, [urlSearch])

  const handleSearchChange = (val) => {
    setSearch(val)
    if (val) {
      setSearchParams({ search: val })
    } else {
      setSearchParams({})
    }
  }
  const [sortBy, setSortBy] = useState('date-desc') // default to latest first
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState(null)
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false)
  const [selectedLedgerSupplier, setSelectedLedgerSupplier] = useState(null)

  // Toast notifications state
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterBalance, filterStatus])

  // Load and refresh stats
  const refreshData = () => {
    setSuppliers(getSuppliers())
    setStats(getSupplierStats())
  }

  useEffect(() => {
    refreshData()
  }, [])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  function handleSaveSupplier(savedData, actionType) {
    setFormModalOpen(false)
    setSelectedSupplier(null)
    refreshData()
    showToast(`Supplier "${savedData.companyName}" successfully ${actionType}!`, 'success')
  }

  function handleDeleteConfirm(id) {
    const result = deleteSupplier(id)
    setDeleteModalOpen(false)
    setSupplierToDelete(null)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      refreshData()
      showToast('Supplier deleted successfully', 'success')
    }
  }

  function handleTransactionRecorded(updatedSupplier, message) {
    refreshData()
    setSelectedLedgerSupplier(updatedSupplier)
    showToast(message, 'success')
  }

  // Filter & sort logic
  const filteredSuppliers = suppliers
    .filter(sup => {
      const query = search.toLowerCase()
      const matchesSearch =
        sup.companyName.toLowerCase().includes(query) ||
        sup.contactPerson.toLowerCase().includes(query) ||
        (sup.phone && sup.phone.includes(query)) ||
        (sup.gstin && sup.gstin.toLowerCase().includes(query)) ||
        (sup.city && sup.city.toLowerCase().includes(query))

      // Balance filter matches
      let matchesBalance = true
      if (filterBalance === 'payables') {
        matchesBalance = sup.outstandingBalance > 0
      } else if (filterBalance === 'advances') {
        matchesBalance = sup.outstandingBalance < 0
      } else if (filterBalance === 'clear') {
        matchesBalance = sup.outstandingBalance === 0
      }

      // Status filter matches
      let matchesStatus = true
      if (filterStatus === 'active') {
        matchesStatus = sup.status === 'active'
      } else if (filterStatus === 'inactive') {
        matchesStatus = sup.status === 'inactive'
      }

      return matchesSearch && matchesBalance && matchesStatus
    })
    .sort((a, b) => {
      // Sort logic
      switch (sortBy) {
        case 'name-asc':
          return a.companyName.localeCompare(b.companyName)
        case 'name-desc':
          return b.companyName.localeCompare(a.companyName)
        case 'bal-desc':
          return b.outstandingBalance - a.outstandingBalance
        case 'bal-asc':
          return a.outstandingBalance - b.outstandingBalance
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt)
        default:
          return 0
      }
    })

  const ITEMS_PER_PAGE = 5
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)
  const activePage = Math.min(currentPage, Math.max(1, totalPages))
  const paginatedSuppliers = filteredSuppliers.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE)

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-indigo-500/15 border border-indigo-500/35 text-indigo-400">
              <SuppliersIcon />
            </span>
            Supplier Directory
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage vendor profiles, track outstanding balances (payables), and view purchase transaction ledgers.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedSupplier(null)
            setFormModalOpen(true)
          }}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold transition-all text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25 shrink-0"
        >
          <PlusIcon />
          Add Supplier
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Suppliers */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-5 -mt-5"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <SuppliersIcon />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Registered</p>
              <h3 className="text-2xl font-black text-slate-200 mt-1">
                {stats.totalSuppliers}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2: Total Outstanding Payables */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-5 -mt-5"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 font-bold text-lg">
              ₹
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Payables</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">
                {formatINR(stats.totalPayables)}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 3: Total Advances Paid */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-5 -mt-5"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold text-lg">
              ₹
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Advances/Credits</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">
                {formatINR(stats.totalAdvances)}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 4: Active Suppliers */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700/60 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -mr-5 -mt-5"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Suppliers</p>
              <h3 className="text-2xl font-black text-slate-200 mt-1">
                {stats.activeSuppliers} <span className="text-xs font-normal text-slate-500">active</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800/60 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">

          {/* Search */}
          <div className="relative w-full lg:flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-500">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by supplier name, contact person, city or GSTIN..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 text-sm"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Controls: Select filters & Sort */}
          <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full lg:w-auto">
            {/* Balance Status Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-40">
              <select
                value={filterBalance}
                onChange={e => setFilterBalance(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 focus:outline-none focus:border-indigo-500/60 text-xs font-medium cursor-pointer"
              >
                <option value="all">All Balances</option>
                <option value="payables">Outstanding Payables</option>
                <option value="advances">Advances/Credits</option>
                <option value="clear">Clear Balance (₹0)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-32">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 focus:outline-none focus:border-indigo-500/60 text-xs font-medium cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex flex-col gap-1 w-full sm:w-44 col-span-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-300 focus:outline-none focus:border-indigo-500/60 text-xs font-medium cursor-pointer"
              >
                <option value="name-asc">Sort: Name (A to Z)</option>
                <option value="name-desc">Sort: Name (Z to A)</option>
                <option value="bal-desc">Sort: Balance (High to Low)</option>
                <option value="bal-asc">Sort: Balance (Low to High)</option>
                <option value="date-desc">Sort: Date Registered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Summary / Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong>{filteredSuppliers.length}</strong> of <strong>{suppliers.length}</strong> suppliers
          </span>
          {(search || filterBalance !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setFilterBalance('all')
                setFilterStatus('all')
                setSortBy('name-asc')
              }}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop view table — hidden on mobile */}
      <div className="hidden lg:block bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20">
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Company & GSTIN</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Products Supplied</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Outstanding Balance</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSuppliers.length > 0 ? (
                paginatedSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-950/10 transition-colors group">
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-slate-200 group-hover:text-white transition-colors">
                        {sup.companyName}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5 font-medium">
                        {sup.contactPerson || '—'}
                      </div>
                      {sup.gstin && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 font-mono text-[9px] font-semibold mt-1.5 uppercase tracking-wider border border-slate-800">
                          {sup.gstin}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-xs text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <PhoneIcon />
                        <span>{sup.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <EmailIcon />
                        <span>{sup.email || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                        <span>{sup.city || '—'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {sup.address || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {sup.productsSupplied && sup.productsSupplied.length > 0 ? (
                          sup.productsSupplied.map((prod, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/10">
                              {prod}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs font-medium">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-right whitespace-nowrap">
                      <div className={`font-extrabold text-sm ${sup.outstandingBalance > 0 ? 'text-rose-400' : sup.outstandingBalance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {formatINR(sup.outstandingBalance)}
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
                        {sup.outstandingBalance > 0 ? 'Payable' : sup.outstandingBalance < 0 ? 'Advance' : 'Clear'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${sup.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-800'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sup.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {sup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setSelectedLedgerSupplier(sup); setLedgerModalOpen(true) }} title="View Ledger Statement" className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-100 border border-indigo-500/10 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer">
                          <LedgerIcon />
                          Ledger
                        </button>
                        <button onClick={() => { setSelectedSupplier(sup); setFormModalOpen(true) }} title="Edit Supplier" className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-slate-100 hover:bg-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                          <EditIcon />
                        </button>
                        <button onClick={() => { setSupplierToDelete(sup); setDeleteModalOpen(true) }} title="Delete Supplier" className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/10 text-rose-400 hover:text-slate-100 hover:bg-rose-500/80 transition-colors cursor-pointer">
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <SuppliersIcon />
                      <p className="text-slate-400 font-bold text-sm mt-4">No Suppliers Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view card grid — hidden on desktop */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredSuppliers.length > 0 ? (
          paginatedSuppliers.map((sup) => (
            <div key={sup.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-200 truncate">{sup.companyName}</h3>
                  {sup.contactPerson && (
                    <p className="text-xs text-slate-500 font-medium truncate">{sup.contactPerson}</p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${sup.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-800'}`}>
                  <span className={`w-1 h-1 rounded-full ${sup.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {sup.status}
                </span>
              </div>
              {sup.gstin && (
                <div className="mb-3">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 font-mono text-[9px] font-semibold uppercase tracking-wider border border-slate-800">
                    GSTIN: {sup.gstin}
                  </span>
                </div>
              )}
              <div className="space-y-1.5 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-800/40">
                {sup.phone && (
                  <div className="flex items-center gap-1.5">
                    <PhoneIcon />
                    <a href={`tel:${sup.phone}`} className="hover:underline">{sup.phone}</a>
                  </div>
                )}
                {sup.email && (
                  <div className="flex items-center gap-1.5">
                    <EmailIcon />
                    <a href={`mailto:${sup.email}`} className="hover:underline truncate">{sup.email}</a>
                  </div>
                )}
                {(sup.city || sup.address) && (
                  <div className="flex items-start gap-1.5 text-slate-500 text-[10px] mt-1">
                    <span className="shrink-0">📍</span>
                    <span className="line-clamp-1">{[sup.address, sup.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
              {sup.productsSupplied && sup.productsSupplied.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sup.productsSupplied.map((prod, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[9px] font-semibold border border-indigo-500/10">
                      {prod}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Balance</p>
                  <p className={`text-sm font-extrabold ${sup.outstandingBalance > 0 ? 'text-rose-400' : sup.outstandingBalance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {formatINR(sup.outstandingBalance)}
                  </p>
                  <span className="text-[9px] text-slate-500 font-medium capitalize mt-0.5 block">
                    {sup.outstandingBalance > 0 ? 'Payable' : sup.outstandingBalance < 0 ? 'Advance' : 'Clear'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setSelectedLedgerSupplier(sup); setLedgerModalOpen(true) }} className="px-2 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-100 border border-indigo-500/10 font-bold text-[9px] transition-all flex items-center gap-1 cursor-pointer">
                    <LedgerIcon />
                    Ledger
                  </button>
                  <button onClick={() => { setSelectedSupplier(sup); setFormModalOpen(true) }} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" title="Edit">
                    <EditIcon />
                  </button>
                  <button onClick={() => { setSupplierToDelete(sup); setDeleteModalOpen(true) }} className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-slate-200 transition-colors cursor-pointer" title="Delete">
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-16 text-center text-slate-500 col-span-full">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <SuppliersIcon />
              <p className="text-slate-400 font-bold text-sm mt-4">No Suppliers Found</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
            Showing <span className="text-slate-300 font-bold">{(activePage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-slate-300 font-bold">{Math.min(activePage * ITEMS_PER_PAGE, filteredSuppliers.length)}</span> of <span className="text-slate-300 font-bold">{filteredSuppliers.length}</span> entries
          </div>
          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={activePage === 1}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-semibold hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${activePage === pageNum
                    ? 'bg-indigo-600 text-slate-100 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={activePage === totalPages}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-semibold hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* CRUD MODALS & DIALOGS */}
      {formModalOpen && (
        <SupplierFormModal
          supplier={selectedSupplier}
          onSave={handleSaveSupplier}
          onCancel={() => {
            setFormModalOpen(false)
            setSelectedSupplier(null)
          }}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          supplier={supplierToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleteModalOpen(false)
            setSupplierToDelete(null)
          }}
        />
      )}

      {ledgerModalOpen && selectedLedgerSupplier && (
        <SupplierLedgerModal
          supplier={selectedLedgerSupplier}
          onTransactionRecorded={handleTransactionRecorded}
          onClose={() => {
            setLedgerModalOpen(false)
            setSelectedLedgerSupplier(null)
          }}
        />
      )}
    </div>
  )
}
