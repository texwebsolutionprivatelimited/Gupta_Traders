import React, { useState, useEffect, useRef } from 'react'
import { CloseIcon, CustomersIcon } from './Icons'
import { addCustomer, updateCustomer } from '../../hooks/customerData'

export default function CustomerFormModal({ customer, onSave, onCancel }) {
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
