import React, { useEffect } from 'react'
import { WarningIcon } from './Icons'
import { formatINR } from '../../utils/erp'

export default function DeleteConfirmModal({ customer, onConfirm, onCancel }) {
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
