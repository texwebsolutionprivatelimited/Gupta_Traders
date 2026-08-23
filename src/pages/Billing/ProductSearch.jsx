import { useState, useRef, useEffect } from 'react'
import { searchProducts, lookupBarcode, categories } from '../../hooks/posData'
import {
  FaSearch as MagnifyingGlassIcon,
  FaBalanceScale as ScaleIcon,
  FaThLarge,
  FaShoppingBag,
  FaEgg,
  FaUtensils,
  FaCoffee,
  FaHome,
  FaSmile,
  FaPepperHot,
  FaTint,
  FaFolder
} from 'react-icons/fa'

function CategoryIcon({ categoryId, ...props }) {
  switch (categoryId) {
    case 'all': return <FaThLarge {...props} />
    case 'grocery': return <FaShoppingBag {...props} />
    case 'dairy': return <FaEgg {...props} />
    case 'snacks': return <FaUtensils {...props} />
    case 'beverages': return <FaCoffee {...props} />
    case 'household': return <FaHome {...props} />
    case 'personal': return <FaSmile {...props} />
    case 'spices': return <FaPepperHot {...props} />
    case 'oils': return <FaTint {...props} />
    case 'loose': return <ScaleIcon {...props} />
    default: return <FaFolder {...props} />
  }
}

// ─── Icons ────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function BarcodeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
    </svg>
  )
}

function WeightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97ZM5.25 4.97l-2.62 10.726c-.122.499.106 1.028.589 1.202a5.989 5.989 0 0 0 2.031.352 5.989 5.989 0 0 0 2.031-.352c.483-.174.711-.703.59-1.202L5.25 4.971Z" />
    </svg>
  )
}

// ─── Product Search Component ─────────────────────────────────────
export default function ProductSearch({ onAddToCart }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showLooseForm, setShowLooseForm] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const [barcodeMode, setBarcodeMode] = useState(false)
  const searchRef = useRef(null)
  const barcodeRef = useRef(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef(null)

  // Loose product form state
  const [looseName, setLooseName] = useState('')
  const [loosePrice, setLoosePrice] = useState('')
  const [looseQty, setLooseQty] = useState('')
  const [looseUnit, setLooseUnit] = useState('kg')

  // Auto-focus search on mount
  useEffect(() => {
    if (searchRef.current) searchRef.current.focus()
  }, [])

  // Focus barcode input when mode is active
  useEffect(() => {
    if (barcodeMode && barcodeRef.current) barcodeRef.current.focus()
  }, [barcodeMode])

  // Keyboard shortcut: F1 to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setBarcodeMode(false)
        if (searchRef.current) searchRef.current.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredProducts = searchProducts(query, activeCategory)

  // Handle barcode scanner input (rapid keystrokes ending with Enter)
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const barcode = barcodeBuffer.current.trim() || e.target.value.trim()
      if (barcode) {
        const product = lookupBarcode(barcode)
        if (product) {
          handleAddProduct(product)
        }
      }
      barcodeBuffer.current = ''
      e.target.value = ''
      return
    }

    // Buffer rapid input from scanner
    clearTimeout(barcodeTimer.current)
    barcodeBuffer.current += e.key.length === 1 ? e.key : ''
    barcodeTimer.current = setTimeout(() => {
      barcodeBuffer.current = ''
    }, 200)
  }

  const handleAddProduct = (product) => {
    onAddToCart({
      ...product,
      quantity: product.isLoose ? 1 : 1,
      itemDiscount: 0,
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 600)
  }

  const handleAddLooseItem = (e) => {
    e.preventDefault()
    if (!looseName || !loosePrice || !looseQty) return

    const looseProduct = {
      id: `loose-${Date.now()}`,
      name: looseName,
      nameHi: '',
      barcode: '',
      price: parseFloat(loosePrice),
      mrp: parseFloat(loosePrice),
      gstRate: 0,
      category: 'loose',
      unit: looseUnit,
      packSize: `per ${looseUnit}`,
      stock: 999,
      isLoose: true,
      quantity: parseFloat(looseQty),
      itemDiscount: 0,
    }

    onAddToCart(looseProduct)
    setLooseName('')
    setLoosePrice('')
    setLooseQty('')
    setLooseUnit('kg')
    setShowLooseForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* ─── Search & Barcode Bar ──────────────────────── */}
      <div className="p-4 border-b border-slate-800/60 space-y-3">
        <div className="flex gap-2">
          {/* Search Input */}
          <div className={`relative flex-1 ${barcodeMode ? 'hidden sm:block' : ''}`}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product name, barcode..."
              className="w-full pl-11 pr-16 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-base transition-all"
              id="pos-search"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-600/40">
              F1
            </kbd>
          </div>

          {/* Barcode Toggle */}
          <button
            onClick={() => setBarcodeMode(!barcodeMode)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium
              ${barcodeMode
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            title="Barcode Scanner Mode"
          >
            <BarcodeIcon />
            <span className="hidden sm:inline">Scan</span>
          </button>

          {/* Loose Product Button */}
          <button
            onClick={() => setShowLooseForm(!showLooseForm)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium
              ${showLooseForm
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            title="Add Loose/Unpackaged Item (by weight)"
          >
            <WeightIcon />
            <span className="hidden sm:inline">Loose</span>
          </button>
        </div>

        {/* Barcode Scanner Input */}
        {barcodeMode && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="p-2 rounded-lg bg-amber-500/15">
              <BarcodeIcon />
            </div>
            <input
              ref={barcodeRef}
              type="text"
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan barcode or type barcode number..."
              className="flex-1 bg-transparent border-none text-amber-300 placeholder:text-amber-500/50 focus:outline-none text-base font-mono"
              id="pos-barcode-input"
              autoComplete="off"
            />
            <span className="text-xs text-amber-500/60 hidden sm:inline">Scanner ready — point & scan</span>
          </div>
        )}

        {/* Loose Item Form */}
        {showLooseForm && (
          <form onSubmit={handleAddLooseItem} className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <WeightIcon />
              <span className="text-sm font-semibold text-violet-300">Add Loose Item (खुला सामान)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={looseName}
                onChange={(e) => setLooseName(e.target.value)}
                placeholder="Item name"
                className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                value={loosePrice}
                onChange={(e) => setLoosePrice(e.target.value)}
                placeholder="Price per unit (₹)"
                className="px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 text-sm"
                required
              />
              <input
                type="number"
                step="0.001"
                value={looseQty}
                onChange={(e) => setLooseQty(e.target.value)}
                placeholder="Quantity (0.5, 1.75...)"
                className="px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 text-sm"
                required
              />
              <div className="col-span-2 sm:col-span-1 flex gap-2">
                <select
                  value={looseUnit}
                  onChange={(e) => setLooseUnit(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 focus:outline-none focus:border-violet-500/50 text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                  <option value="dozen">dozen</option>
                  <option value="meter">meter</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ─── Category Chips ────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-800/40 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${activeCategory === cat.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:bg-slate-800/70 hover:text-slate-300'
                }`}
            >
              <CategoryIcon categoryId={cat.id} className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product Grid ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-slate-600 mb-4 opacity-50">
              <MagnifyingGlassIcon className="w-12 h-12" />
            </div>
            <p className="text-slate-400 text-lg font-medium">No products found</p>
            <p className="text-slate-500 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className={`relative group text-left p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                  ${addedId === product.id
                    ? 'bg-emerald-500/15 border-emerald-500/40 scale-[0.97] shadow-emerald-500/20'
                    : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/70 hover:border-slate-600/60'
                  }
                  ${product.stock <= 5 ? 'ring-1 ring-rose-500/20' : ''}
                `}
                id={`product-${product.id}`}
              >
                {/* Added animation overlay */}
                {addedId === product.id && (
                  <div className="absolute inset-0 rounded-xl bg-emerald-500/10 flex items-center justify-center z-10">
                    <span className="text-emerald-400 text-2xl">✓</span>
                  </div>
                )}

                {/* Product info */}
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-1">{product.name}</p>
                  {product.nameHi && (
                    <p className="text-xs text-slate-500 line-clamp-1">{product.nameHi}</p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-emerald-400">₹{product.price}</span>
                    {product.mrp > product.price && (
                      <span className="text-xs text-slate-500 line-through">₹{product.mrp}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{product.packSize}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                      ${product.stock <= 5
                        ? 'bg-rose-500/15 text-rose-400'
                        : product.stock <= 20
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {product.stock <= 5 ? `⚠ ${product.stock} left` : `Stock: ${product.stock}`}
                    </span>
                  </div>
                  {product.gstRate > 0 && (
                    <div className="text-[10px] text-slate-600">GST {product.gstRate}%</div>
                  )}
                </div>

                {/* Loose indicator */}
                {product.isLoose && (
                  <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                    <ScaleIcon className="w-3 h-3" /> LOOSE
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
