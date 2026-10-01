import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatINR } from '../utils/erp'
import { updateProductMRP } from '../services/erpService'

export default function MissingMrpAlertModal({
  isOpen,
  onClose,
  products = [],
  onAcknowledge,
  onProductUpdated,
  isBillingContext = false,
  onProceedAnyway,
}) {
  const navigate = useNavigate()
  const [inlineValues, setInlineValues] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [errorMap, setErrorMap] = useState({})
  const [successId, setSuccessId] = useState(null)

  if (!isOpen || !products || products.length === 0) return null

  const count = products.length
  const isSingle = count === 1

  const handleInputChange = (productId, val) => {
    setInlineValues(prev => ({ ...prev, [productId]: val }))
    if (errorMap[productId]) {
      setErrorMap(prev => ({ ...prev, [productId]: null }))
    }
  }

  const handleSaveInline = async (product) => {
    const rawVal = inlineValues[product.id]
    const num = Number(rawVal)
    if (!rawVal || isNaN(num) || num <= 0) {
      setErrorMap(prev => ({ ...prev, [product.id]: 'Please enter a valid MRP (> 0)' }))
      return
    }

    const rate = Number(product.rate ?? product.sellingPrice ?? product.price ?? 0)
    if (rate > 0 && num < rate) {
      setErrorMap(prev => ({ ...prev, [product.id]: `MRP (₹${num}) cannot be less than Rate (₹${rate})` }))
      return
    }

    setSavingId(product.id)
    setErrorMap(prev => ({ ...prev, [product.id]: null }))
    try {
      const updated = await updateProductMRP(product.id, num)
      setSuccessId(product.id)
      setTimeout(() => {
        setSuccessId(null)
        onProductUpdated?.(updated || { ...product, mrp: num })
      }, 500)
    } catch (err) {
      setErrorMap(prev => ({ ...prev, [product.id]: err.message || 'Failed to update MRP' }))
    } finally {
      setSavingId(null)
    }
  }

  const handleOpenProductEdit = (product) => {
    onClose?.()
    navigate(`/products?productId=${product.id}&action=edit-mrp`)
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-2xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800/80 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shadow-inner shrink-0">
              ⚠️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                  Missing MRP Alert
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {count} {isSingle ? 'Product' : 'Products'} Affected
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-amber-300/90 mt-1">
                {isSingle
                  ? '“MRP is missing for this product. Please add the MRP to continue.”'
                  : '“MRP is missing for these products. Please add the MRP to continue.”'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer shrink-0"
            title="Close Alert"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Informational Subtext */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>Enter the product's Maximum Retail Price to synchronize Receipts and Inventory.</span>
          <span className="text-[11px] text-slate-500">Rate ≤ MRP</span>
        </div>

        {/* Scrollable Product List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-800/40 flex-1">
          {products.map((product) => {
            const currentVal = inlineValues[product.id] ?? ''
            const isSaving = savingId === product.id
            const isSuccess = successId === product.id
            const error = errorMap[product.id]
            const rate = Number(product.rate ?? product.sellingPrice ?? product.price ?? 0)

            return (
              <div
                key={product.id}
                className={`pt-3.5 first:pt-0 rounded-2xl p-3 sm:p-4 transition-all duration-300 border ${
                  isSuccess
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-slate-100">
                        {product.name}
                      </span>
                      {product.packSize && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {product.packSize}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        MRP Missing
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-medium">
                      {product.brand && <span>Brand: <strong className="text-slate-300">{product.brand}</strong></span>}
                      {product.barcode && <span>BC: <code className="font-mono text-slate-400">{product.barcode}</code></span>}
                      <span>Rate (Our Price): <strong className="text-emerald-400">{formatINR(rate)}</strong></span>
                    </div>

                    {error && (
                      <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>
                    )}
                    {isSuccess && (
                      <p className="text-xs text-emerald-400 mt-1 font-semibold">✓ MRP Added Successfully!</p>
                    )}
                  </div>

                  {/* Actions: Quick Inline Input & Add MRP Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="MRP"
                        value={currentVal}
                        onChange={(e) => handleInputChange(product.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSaveInline(product)
                          }
                        }}
                        disabled={isSaving}
                        className="w-24 sm:w-28 pl-6 pr-2 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                      />
                    </div>

                    <button
                      onClick={() => handleSaveInline(product)}
                      disabled={isSaving || !currentVal}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 whitespace-nowrap"
                    >
                      {isSaving ? 'Saving…' : 'Save MRP'}
                    </button>

                    <button
                      onClick={() => handleOpenProductEdit(product)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                      title="Open full product edit form"
                    >
                      <span>Add MRP</span>
                      <span className="text-slate-400 text-[10px]">↗</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Once MRP is saved, the product is removed from this alert automatically.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isBillingContext && (
              <button
                type="button"
                onClick={onProceedAnyway}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
              >
                Proceed Without MRP
              </button>
            )}

            <button
              type="button"
              onClick={onAcknowledge}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              I Understand / Remind Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
