import { useState, useRef, useEffect } from 'react'
import { listUIProducts, subscribeToTable } from '../../services/erpService'

// ─── Product Selector Component ─────────────────────────────────
export default function ProductSelector({ onSelect, selectedProduct, onClear }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState([])
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Load all products on mount
  useEffect(() => {
    const load=()=>listUIProducts().then(setProducts).catch(console.error);load();return subscribeToTable('products',load)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = query.trim()
    ? products.filter(p => {
        const q = query.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.nameHi && p.nameHi.includes(query)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.productCode && p.productCode.toLowerCase().includes(q))
        )
      })
    : products

  const handleSelect = (product) => {
    onSelect(product)
    setQuery('')
    setIsOpen(false)
  }

  // ─── Selected Product Display ─────────────────────────────────
  if (selectedProduct) {
    return (
      <div className="bg-slate-900/70 border border-emerald-500/20 rounded-2xl p-4 mb-5 animate-fadeIn">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Product Selected
          </span>
          <button
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
        <p className="text-sm font-semibold text-slate-100">{selectedProduct.name}</p>
        {selectedProduct.nameHi && (
          <p className="text-xs text-slate-400 mt-0.5">{selectedProduct.nameHi}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
          {selectedProduct.brand && selectedProduct.brand !== 'General' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400">{selectedProduct.brand}</span>
          )}
          {selectedProduct.barcode && (
            <span className="font-mono">Barcode: {selectedProduct.barcode}</span>
          )}
          <span>₹{selectedProduct.sellingPrice || selectedProduct.mrp || '—'}</span>
          {selectedProduct.packSize && <span>{selectedProduct.packSize}</span>}
        </div>
      </div>
    )
  }

  // ─── Search & Dropdown ────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="relative mb-5">
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        Select Existing Product
        <span className="text-slate-600 ml-1">(optional)</span>
      </label>
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by name, barcode, brand, SKU..."
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          id="barcode-product-search"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-2xl shadow-black/40 max-h-72 overflow-y-auto scrollbar-thin">
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-800/40">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </div>
          {filtered.slice(0, 30).map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-800/60 transition-colors flex items-center justify-between border-b border-slate-800/20 last:border-none cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{p.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {p.brand && p.brand !== 'General' ? `${p.brand} • ` : ''}
                  {p.barcode || 'No barcode'}
                  {p.packSize ? ` • ${p.packSize}` : ''}
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 ml-3 flex-shrink-0">
                ₹{p.sellingPrice || p.mrp || '—'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-slate-900 border border-slate-800/80 rounded-xl shadow-2xl p-4 text-center">
          <p className="text-sm text-slate-500">No products found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-slate-600 mt-1">You can enter product details manually below</p>
        </div>
      )}
    </div>
  )
}
