import { useState, useEffect } from 'react'
import { formatINR } from '../../utils/erp'
import {
  FaBox,
  FaTag,
  FaBarcode,
  FaWarehouse,
  FaPlus,
  FaMinus,
  FaShoppingCart,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaCopy,
  FaCheck,
  FaMoneyBillWave,
  FaInfoCircle,
} from 'react-icons/fa'

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [copiedBarcode, setCopiedBarcode] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setCopiedBarcode(false)
    }
  }, [isOpen, product])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const stock = Number(product.currentStock ?? product.stock ?? 0)
  const minStock = Number(product.minStock || 5)
  const isOutOfStock = stock <= 0
  const isLowStock = !isOutOfStock && stock <= minStock

  const sellingPrice = Number(product.rate ?? product.price ?? product.sellingPrice ?? 0)
  const mrp = Number(product.mrp ?? sellingPrice)
  const purchasePrice = Number(product.purchasePrice ?? 0)

  const savings = mrp > sellingPrice ? mrp - sellingPrice : 0
  const savingsPercent = mrp > sellingPrice && mrp > 0 ? Math.round((savings / mrp) * 100) : 0

  const margin = sellingPrice > 0 && purchasePrice > 0 ? sellingPrice - purchasePrice : null
  const marginPercent = margin !== null && purchasePrice > 0 ? ((margin / purchasePrice) * 100).toFixed(1) : null

  const brandName = product.brand?.trim() || 'Generic / Unbranded'
  const categoryName = product.categoryName || product.category || 'General'
  const unit = product.unit || (product.type === 'loose' ? (product.looseUnit || 'kg') : 'pcs')
  const packSize = product.packSize?.trim()
  const barcode = product.barcode?.trim()
  const sku = product.sku || product.productCode
  const hsn = product.hsnCode?.trim()
  const gstRate = product.gstRate !== undefined ? Number(product.gstRate) : 0
  const isLoose = product.type === 'loose'
  const status = product.status || 'active'

  const handleIncrement = () => {
    setQuantity(prev => (isLoose ? Math.round((prev + 0.25) * 100) / 100 : prev + 1))
  }

  const handleDecrement = () => {
    setQuantity(prev => {
      const step = isLoose ? 0.25 : 1
      const next = prev - step
      return next > 0 ? (isLoose ? Math.round(next * 100) / 100 : next) : prev
    })
  }

  const handleAddToCart = () => {
    if (quantity <= 0) return
    if (onAddToCart) {
      onAddToCart({
        ...product,
        quantity: Number(quantity),
      })
    }
    onClose()
  }

  const handleCopyBarcode = (e) => {
    e.stopPropagation()
    if (!barcode) return
    navigator.clipboard?.writeText(barcode)
    setCopiedBarcode(true)
    setTimeout(() => setCopiedBarcode(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 md:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-black/90 animate-scaleIn flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-start gap-4 min-w-0 pr-3">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-700/80 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <FaBox className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {brandName}
                </span>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <FaTag className="w-2.5 h-2.5" />
                  {categoryName}
                </span>
                <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {isLoose ? 'Loose / By Weight' : 'Packaged Item'}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                  {status}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-50 leading-snug break-words">
                {product.name}
              </h3>
              {product.nameHi && (
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">{product.nameHi}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer shrink-0"
            title="Close Product Details (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto scrollbar-thin max-h-[calc(92vh-140px)]">

          {/* Section 1: Pricing & Commercials Overview */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <FaMoneyBillWave className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pricing & Commercials (मूल्य एवं दर)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Rate / Our Price */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-850 to-slate-900 border border-emerald-500/30 shadow-sm">
                <span className="text-xs text-emerald-400 font-semibold block mb-1">
                  Rate (Our Selling Price)
                </span>
                <div className="text-2xl font-black text-emerald-400 tabular-nums">
                  {formatINR(sellingPrice)}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ {unit}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">बिक्री दर (Billing Rate)</p>
              </div>

              {/* MRP & Customer Savings */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/60">
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  Maximum Retail Price (MRP)
                </span>
                <div className="text-xl font-bold text-slate-200 tabular-nums">
                  {formatINR(mrp)}
                </div>
                {mrp > sellingPrice ? (
                  <div className="mt-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                    Save {formatINR(savings)} ({savingsPercent}% OFF)
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">At MRP price</p>
                )}
              </div>

              {/* Purchase Price (Cost) */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/60">
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  Purchase Price (खरीद मूल्य)
                </span>
                <div className="text-xl font-bold text-slate-200 tabular-nums">
                  {purchasePrice > 0 ? formatINR(purchasePrice) : '₹0.00 (Not Set)'}
                </div>
                {margin !== null ? (
                  <div className={`mt-1 text-[11px] font-bold inline-block px-2 py-0.5 rounded ${margin >= 0 ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    Margin: {margin >= 0 ? '+' : ''}{formatINR(margin)} ({marginPercent}%)
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Cost not registered</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Stock & Inventory Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <FaWarehouse className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Stock & Inventory (स्टॉक स्थिति)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Available Stock Card */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1">Available Quantity</span>
                  <div className="text-2xl font-black text-slate-100 tabular-nums">
                    {stock.toLocaleString('en-IN', { maximumFractionDigits: 3 })} {unit}
                  </div>
                  {packSize && (
                    <span className="text-[11px] text-slate-400 mt-1 block">Pack Size: <strong className="text-slate-200">{packSize}</strong></span>
                  )}
                </div>
                <div>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <FaTimesCircle className="w-3.5 h-3.5" /> Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <FaExclamationTriangle className="w-3.5 h-3.5" /> Low Stock ({stock} left)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <FaCheckCircle className="w-3.5 h-3.5" /> In Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Threshold & Unit Config */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/60">
                <div className="flex items-center justify-between py-1 border-b border-slate-700/40 text-xs">
                  <span className="text-slate-400">Min Stock (Reorder Level):</span>
                  <span className="text-slate-200 font-bold">{minStock} {unit}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-700/40 text-xs">
                  <span className="text-slate-400">Item Unit:</span>
                  <span className="text-slate-200 font-bold uppercase">{unit}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-xs">
                  <span className="text-slate-400">Product Form:</span>
                  <span className="text-emerald-400 font-bold">{isLoose ? 'Loose (वजन के अनुसार)' : 'Packaged Item (बंद पैकेट)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Barcode, Identifiers & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <FaBarcode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identifiers & Tax Information</span>
            </h4>
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Barcode with Copy Action */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block font-medium">Barcode / EAN:</span>
                    <span className="font-mono text-sm font-bold text-slate-200 truncate block">
                      {barcode || 'None'}
                    </span>
                  </div>
                  {barcode && (
                    <button
                      type="button"
                      onClick={handleCopyBarcode}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ml-2"
                      title="Copy Barcode"
                    >
                      {copiedBarcode ? <FaCheck className="w-3 h-3 text-emerald-400" /> : <FaCopy className="w-3 h-3 text-slate-400" />}
                      <span>{copiedBarcode ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                {/* SKU */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block font-medium">SKU / Item Code:</span>
                  <span className="font-mono text-sm font-bold text-slate-200 truncate block">
                    {sku || 'None'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* HSN Code */}
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                  <span className="text-slate-400 block">HSN Code:</span>
                  <span className="text-slate-200 font-bold font-mono">{hsn || 'N/A'}</span>
                </div>

                {/* GST Rate */}
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                  <span className="text-slate-400 block">GST Tax Rate:</span>
                  <span className="text-slate-200 font-bold">{gstRate}% GST</span>
                </div>

                {/* Category */}
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                  <span className="text-slate-400 block">Category:</span>
                  <span className="text-emerald-400 font-bold truncate block">{categoryName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Description & Notes */}
          {product.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FaInfoCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Description & Notes</span>
              </h4>
              <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-700/50 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {/* Section 5: POS Quantity Selector (Only when onAddToCart is passed) */}
          {onAddToCart && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-850 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Quantity to Add (बिल में जोड़ें):</span>
                <span className="text-xs text-emerald-400 font-semibold">
                  Subtotal: {formatINR(sellingPrice * quantity)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center transition-all cursor-pointer shadow"
                >
                  <FaMinus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  step={isLoose ? '0.001' : '1'}
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center text-slate-100 font-black text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center transition-all cursor-pointer shadow"
                >
                  <FaPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          {onAddToCart ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaShoppingCart className="w-4 h-4" />
                <span>Add {quantity} {unit} to Cart • {formatINR(sellingPrice * quantity)}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Close Product Details</span>
              <span className="text-xs text-slate-500">(Esc)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

