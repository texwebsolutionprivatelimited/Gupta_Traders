import React, { useState, useEffect } from 'react'
import { CloseIcon, WarningIcon } from './Icons'
import { adjustStock } from '../../hooks/inventoryData'

const predefinedReasons = {
  inward: [
    'New Supplier Shipment Received',
    'Customer Return (Restock)',
    'Found extra stock during audit',
    'Internal Transfer Inward',
  ],
  outward: [
    'Damaged / Expired goods disposal',
    'Theft / Shortage write-off',
    'Internal consumption / sampling',
    'Inventory count reconciliation write-down',
  ],
  reconcile: [
    'Monthly physical inventory audit count',
    'Initial stock setup calibration',
    'Ad-hoc storage correction count',
  ],
}

export default function StockAdjustmentModal({ product, onSave, onCancel }) {
  const [qty, setQty] = useState('')
  const [type, setType] = useState('inward') // 'inward' | 'outward' | 'reconcile'
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const numericQty = Number(qty)
    if (qty === '' || isNaN(numericQty) || (type !== 'reconcile' && numericQty <= 0)) {
      setError('Please enter a valid positive quantity amount')
      return
    }

    const finalReason = reason === 'Other' ? note.trim() : reason
    if (!finalReason) {
      setError('Please select or specify a reason for adjustment')
      return
    }

    const res = adjustStock(product.id, numericQty, type, finalReason, 'Manager (Gupta Traders)')
    if (res.error) {
      setError(res.error)
      return
    }

    onSave(res.product, `Stock adjusted successfully for ${product.name}`)
  }

  // Auto-set default reason when type changes
  useEffect(() => {
    setReason(predefinedReasons[type][0])
    setError('')
  }, [type])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-md w-full mx-4 shadow-2xl animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-700/40 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Adjust Stock Level</h2>
            <p className="text-xs text-slate-400 mt-0.5">{product.name} ({product.sku || product.productCode})</p>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <CloseIcon />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <WarningIcon />
              {error}
            </div>
          )}

          {/* Current Stock Reference */}
          <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <span className="text-xs text-slate-400 font-semibold">Current stock level:</span>
            <span className="text-sm font-bold text-slate-200">{product.currentStock} {product.unit}</span>
          </div>

          {/* Mode Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Adjustment Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('inward')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${type === 'inward'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
              >
                ● Stock In (Add)
              </button>
              <button
                type="button"
                onClick={() => setType('outward')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${type === 'outward'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
              >
                ○ Stock Out (Reduce)
              </button>
              <button
                type="button"
                onClick={() => setType('reconcile')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${type === 'reconcile'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
              >
                ⚙ Audit (Reset)
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              {type === 'reconcile' ? 'New Stock Quantity Count' : 'Adjustment Quantity amount'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="e.g. 15"
                min={type === 'reconcile' ? 0 : 1}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 capitalize">
                {product.unit}
              </span>
            </div>
            {type === 'reconcile' && (
              <p className="text-[10px] text-blue-400/80">Reconciliation will overwrite current stock directly to this new amount.</p>
            )}
          </div>

          {/* Reason Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Reason for change</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700/60 text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              {predefinedReasons[type].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="Other">Write my own reason...</option>
            </select>
          </div>

          {/* Custom Note input if 'Other' is chosen */}
          {reason === 'Other' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Specify Reason / Note</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Write reason here..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700/60 text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>
          )}
        </form>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-700/40 flex gap-3 bg-slate-900/80">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 cursor-pointer"
          >
            Adjust Level
          </button>
        </div>
      </div>
    </div>
  )
}
