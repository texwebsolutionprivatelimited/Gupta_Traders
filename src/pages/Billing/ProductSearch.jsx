import { useState, useRef, useEffect } from 'react'
import { listCategories, listUIProducts, subscribeToTable } from '../../services/erpService'
import ProductDetailModal from '../Products/ProductDetailModal'
import { isProductInCategory } from '../Categories/CategoriesPage'
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
  FaFolder,
  FaPlus,
  FaInfoCircle,
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
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null)
  const [showLooseForm, setShowLooseForm] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const [barcodeMode, setBarcodeMode] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [categories, setCategories] = useState([{ id: 'all', name: 'All Categories', slug: 'all' }])
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

  useEffect(() => {
    let active = true
    let revision = 0
    const load = async () => {
      const requestRevision = ++revision
      setLoading(true)
      setLoadError('')
      const [items, cats] = await Promise.allSettled([listUIProducts(), listCategories()])
      if (!active || requestRevision !== revision) return
      if (items.status === 'fulfilled') {
        setProducts(items.value.map(p => ({
          ...p,
          price: p.rate ?? p.sellingPrice,
          rate: p.rate ?? p.sellingPrice,
          mrp: p.mrp ?? p.rate ?? p.sellingPrice,
          brand: p.brand || '',
          isLoose: p.type === 'loose',
        })))
      }
      if (cats.status === 'fulfilled') {
        setCategories([
          { id: 'all', name: 'All Categories', slug: 'all', categoryId: 'all' },
          ...cats.value.filter(c => !c.status || c.status === 'active').map(c => ({
            id: c.slug || c.id,
            slug: c.slug,
            categoryId: c.id,
            uuid: c.id,
            name: c.name,
          })),
        ])
      }
      const failure = items.status === 'rejected' ? items.reason : cats.status === 'rejected' ? cats.reason : null
      setLoadError(failure ? failure.message || 'Unable to load product data.' : '')
      setLoading(false)
    }
    load()
    const offProducts = subscribeToTable('products', load)
    const offInventory = subscribeToTable('inventory', load)
    const offCategories = subscribeToTable('categories', load)
    return () => {
      active = false
      offProducts()
      offInventory()
      offCategories()
    }
  }, [reloadKey])

  const getCategoryCount = (cat) => {
    if (cat.id === 'all') return products.length
    return products.filter(p => isProductInCategory(p, cat)).length
  }

  const q = query.toLowerCase().trim()
  const activeCatObj = categories.find(c => c.id === activeCategory || c.slug === activeCategory)
  const filteredProducts = products.filter(p => {
    const matchesCategory = isProductInCategory(p, activeCatObj)

    const matchesQuery = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.nameHi?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)

    return matchesCategory && matchesQuery
  })

  const lookupBarcode = code => products.find(p => p.barcode === code) || null

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
      rate: product.rate ?? product.price,
      price: product.rate ?? product.price,
      mrp: product.mrp ?? product.rate ?? product.price,
      quantity: product.quantity ?? (product.isLoose ? 1 : 1),
      itemDiscount: 0,
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 600)
  }

  const handleAddLooseItem = (e) => {
    e.preventDefault()
    if (!looseName || !loosePrice || !looseQty) return

    const parsedPrice = parseFloat(loosePrice)
    const looseProduct = {
      id: `loose-${Date.now()}`,
      name: looseName,
      nameHi: '',
      barcode: '',
      brand: 'Loose Item',
      price: parsedPrice,
      rate: parsedPrice,
      mrp: parsedPrice,
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
              placeholder="Search product name, brand, barcode..."
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
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium cursor-pointer
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
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-medium cursor-pointer
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
                  className="px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ─── Category Boxes ────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {categories.length} total
            </span>
          </div>
          {activeCategory !== 'all' && (
            <button
              onClick={() => setActiveCategory('all')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Reset to All</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded">✕</span>
            </button>
          )}
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {categories.map(cat => {
            const count = getCategoryCount(cat)
            const isActive = activeCategory === cat.id || (cat.slug && activeCategory === cat.slug)

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 flex-shrink-0 cursor-pointer group
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white'
                  }
                `}
                id={`category-box-${cat.id}`}
              >
                <div className={`p-2 rounded-lg transition-colors
                  ${isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400 group-hover:text-slate-200'}
                `}>
                  <CategoryIcon categoryId={cat.slug || cat.id} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate capitalize leading-tight">{cat.name}</p>
                  <p className={`text-[10px] tabular-nums mt-0.5 ${isActive ? 'text-emerald-400/80 font-medium' : 'text-slate-500'}`}>
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Product Grid ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loadError && (
          <div role="alert" className="mb-3 rounded-xl border border-rose-500/30 bg-slate-900 p-3 text-sm text-slate-200">
            <p>{loadError}</p>
            <button type="button" onClick={() => setReloadKey(key => key + 1)} className="mt-2 underline font-semibold cursor-pointer">Retry loading</button>
          </div>
        )}
        {loading && products.length === 0 ? (
          <p role="status" className="p-8 text-center text-slate-400">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-slate-600 mb-4 opacity-50">
              <MagnifyingGlassIcon className="w-12 h-12" />
            </div>
            <p className="text-slate-400 text-lg font-medium">{loadError ? 'Product data could not be loaded' : 'No products found'}</p>
            <p className="text-slate-500 text-sm mt-1">{loadError ? 'Use Retry loading above to try again.' : 'Try a different search or category'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const currentStock = Number(product.currentStock ?? product.stock ?? 0)
              const unit = product.unit || (product.isLoose ? 'kg' : 'pcs')
              const brand = product.brand?.trim() || 'Generic'

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductForDetail(product)}
                  className={`relative group text-left p-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer flex flex-col justify-between
                    ${addedId === product.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 scale-[0.98] shadow-emerald-500/20'
                      : 'bg-slate-850/80 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600/80'
                    }
                    ${currentStock <= 0 ? 'opacity-70 border-rose-900/40' : currentStock <= 5 ? 'ring-1 ring-amber-500/30' : ''}
                  `}
                  id={`product-${product.id}`}
                  title="Click to view details (Name, Brand, Stock)"
                >
                  {/* Added animation overlay */}
                  {addedId === product.id && (
                    <div className="absolute inset-0 rounded-xl bg-emerald-500/10 flex items-center justify-center z-10">
                      <span className="text-emerald-400 text-2xl font-bold">✓</span>
                    </div>
                  )}

                  {/* Loose indicator */}
                  {product.isLoose && (
                    <div className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                      <ScaleIcon className="w-3 h-3" /> LOOSE
                    </div>
                  )}

                  {/* Product info */}
                  <div className="space-y-1.5">
                    {/* Brand Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400/90 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 truncate max-w-[120px]">
                        {brand}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {product.sku || product.barcode ? `${product.sku || product.barcode}`.slice(-6) : ''}
                      </span>
                    </div>

                    {/* Product Name */}
                    <p className="text-sm font-bold text-slate-100 leading-snug line-clamp-2 mt-1">
                      {product.name}
                    </p>
                    {product.nameHi && (
                      <p className="text-xs text-slate-400 line-clamp-1">{product.nameHi}</p>
                    )}

                    {/* Rate & MRP */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-lg font-black text-emerald-400">₹{product.price}</span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-slate-500 line-through">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Stock & Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    {/* Quantity / Available Stock */}
                    <div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1
                        ${currentStock <= 0
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : currentStock <= 5
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {currentStock <= 0
                          ? 'Out of Stock'
                          : currentStock <= 5
                            ? `⚠ ${currentStock} ${unit} left`
                            : `Stock: ${currentStock} ${unit}`}
                      </span>
                    </div>

                    {/* Quick Add button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddProduct(product)
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 transition-all cursor-pointer"
                      title="Quick Add 1 Unit"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <FaPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Reusable Product Detail Modal ──────────────── */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={(productWithQty) => {
          handleAddProduct(productWithQty)
        }}
      />
    </div>
  )
}
