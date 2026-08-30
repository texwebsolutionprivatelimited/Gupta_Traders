import React, { useState } from 'react'
import { CloseIcon, WarningIcon } from './Icons'
import { setMinimumStock } from '../../services/erpService'

export default function MinStockModal({ product, onSave, onCancel }) {
  const [minStock, setMinStock] = useState(product.minStock || 10)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const num = Number(minStock)
    if (minStock === '' || isNaN(num) || num < 0) {
      setError('Please enter a valid threshold limit')
      return
    }

    try{await setMinimumStock(product.id,num);onSave({...product,minStock:num},`Minimum stock threshold limit updated for ${product.name}`)}catch(error){setError(error.message)}
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-sm w-full mx-4 shadow-2xl animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-slate-700/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Set Minimum Alert Level</h2>
            <p className="text-xs text-slate-400 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <WarningIcon />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Threshold</label>
            <div className="relative">
              <input
                type="number"
                value={minStock}
                onChange={e => setMinStock(e.target.value)}
                placeholder="e.g. 10"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                {product.unit}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              When current stock falls below or equal to this limit, a low stock warning indicator will trigger.
            </p>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-700/40 flex gap-3 bg-slate-900/80">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 cursor-pointer"
          >
            Save Limit
          </button>
        </div>
      </div>
    </div>
  )
}
