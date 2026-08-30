import { useState } from 'react'
import { formatINR } from '../../utils/erp'
import { FaShoppingCart as CartIcon, FaBalanceScale as ScaleIcon, FaTag } from 'react-icons/fa'

// ─── Cart Component ──────────────────────────────────────────────
export default function Cart({ items, onUpdateQuantity, onUpdateDiscount, onRemoveItem, onClearCart }) {
  const [editingDiscount, setEditingDiscount] = useState(null)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-slate-600 mb-4 opacity-30">
          <CartIcon className="w-16 h-16" />
        </div>
        <p className="text-slate-400 text-lg font-semibold">Cart is Empty</p>
        <p className="text-slate-500 text-sm mt-1">Search or scan products to add</p>
        <p className="text-slate-600 text-xs mt-3">टोकरी खाली है — सामान जोड़ें</p>
      </div>
    )
  }

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <CartIcon className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Cart
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            {items.length} items • {Number(totalItems.toFixed(3))} qty
          </span>
        </div>
        <button
          onClick={onClearCart}
          className="text-xs font-medium text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-all"
          title="Clear all items"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.map((item, index) => {
          const isLoose = item.isLoose || item.unit === 'kg' || item.unit === 'g' || item.unit === 'ltr'
          const isCustom = item.isCustomItem || String(item.id || '').startsWith('loose-')

          return (
            <div
              key={item.cartId}
              className="px-4 py-3 border-b border-slate-800/30 hover:bg-slate-800/20 transition-all group animate-slideIn"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Top row: Name + Tag + Remove */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-slate-200 truncate">{item.name}</p>
                    {isCustom && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <span>{formatINR(item.price)} × {item.quantity} {item.unit || 'Pcs'}</span>
                    {isLoose && <ScaleIcon className="w-3.5 h-3.5 text-violet-400" title="Loose Item" />}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.cartId)}
                  className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  title="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Bottom row: Qty controls + Discount + Line total */}
              <div className="flex items-center justify-between gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center gap-0 border border-slate-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      const step = isLoose ? 0.25 : 1
                      const minVal = isLoose ? 0.05 : 1
                      const nextQty = Math.max(minVal, Number((item.quantity - step).toFixed(3)))
                      onUpdateQuantity(item.cartId, nextQty)
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-lg font-bold select-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    step={isLoose ? '0.001' : '1'}
                    min={isLoose ? '0.001' : '1'}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val) && val > 0) onUpdateQuantity(item.cartId, val)
                    }}
                    className="w-14 h-8 text-center bg-slate-900/80 text-slate-200 text-sm font-semibold border-x border-slate-700/50 focus:outline-none focus:bg-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => {
                      const step = isLoose ? 0.25 : 1
                      const nextQty = Number((item.quantity + step).toFixed(3))
                      onUpdateQuantity(item.cartId, nextQty)
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800/80 text-slate-300 hover:bg-emerald-600 hover:text-white transition-all text-lg font-bold select-none"
                  >
                    +
                  </button>
                </div>

                {/* Per-item Discount */}
                <div className="flex items-center gap-1">
                  {editingDiscount === item.cartId ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={item.price}
                      defaultValue={item.itemDiscount || 0}
                      className="w-16 h-7 px-1.5 text-center rounded-md bg-slate-800/80 border border-amber-500/30 text-amber-300 text-xs font-medium focus:outline-none focus:border-amber-500/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        onUpdateDiscount(item.cartId, isNaN(val) || val < 0 ? 0 : val)
                        setEditingDiscount(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat(e.target.value)
                          onUpdateDiscount(item.cartId, isNaN(val) || val < 0 ? 0 : val)
                          setEditingDiscount(null)
                        }
                      }}
                      placeholder="Disc"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingDiscount(item.cartId)}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-all ${
                        item.itemDiscount > 0
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/40'
                      }`}
                      title="Click to add per-item discount"
                    >
                      {item.itemDiscount > 0 ? `-₹${item.itemDiscount}` : 'Disc'}
                    </button>
                  )}
                </div>

                {/* Line Total */}
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-100">
                    {formatINR((item.price - (item.itemDiscount || 0)) * item.quantity)}
                  </p>
                  {item.itemDiscount > 0 && (
                    <p className="text-[10px] text-amber-400/70 line-through">
                      {formatINR(item.price * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
