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
export default function ProductSearch({ onAddToCart, isParentLoading = false }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null)
  const [showLooseForm, setShowLooseForm] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const [addingId, setAddingId] = useState(null)
  const [barcodeMode, setBarcodeMode] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const isAnyLoading = loading || isParentLoading
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [categories, setCategories] = useState([])
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
          mrp: (p.mrp && Number(p.mrp) > 0) ? Number(p.mrp) : null,
          brand: p.brand || '',
          isLoose: p.type === 'loose',
        })))
      }
      if (cats.status === 'fulfilled') {
        setCategories(
          cats.value
            .filter(c => (!c.status || c.status === 'active') && c.id !== 'all' && c.slug !== 'all' && String(c.name || '').toLowerCase().trim() !== 'all categories')
            .map(c => ({
              id: c.slug || c.id,
              slug: c.slug,
              categoryId: c.id,
              uuid: c.id,
              name: c.name,
            }))
        )
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
    if (!cat || cat.id === 'all') return products.length
    return products.filter(p => isProductInCategory(p, cat)).length
  }

  const q = query.toLowerCase().trim()
  const activeCatObj = categories.find(c => c.id === activeCategory || c.slug === activeCategory)
  const filteredProducts = products.filter(p => {
    const matchesCategory = !activeCategory || activeCategory === 'all' || !activeCatObj ? true : isProductInCategory(p, activeCatObj)

    const matchesQuery = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.nameHi?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)

    return matchesCategory && matchesQuery
  })

  const lookupBarcode = code => {
    if (!code) return null
    const clean = String(code).trim().toLowerCase()
    return products.find(p => p.barcode && String(p.barcode).trim().toLowerCase() === clean) || null
  }

  const lastKeyTimeRef = useRef(0)
  const scanBufferRef = useRef('')
  const isScanBurstRef = useRef(false)
  const scanTimeoutRef = useRef(null)

  const processScannedCode = (rawCode) => {
    if (!rawCode) return false
    const clean = String(rawCode).trim()
    if (!clean) return false

    // 1. Direct barcode match
    let product = lookupBarcode(clean)

    // 2. Direct SKU match
    if (!product) {
      product = products.find(p => p.sku && String(p.sku).trim().toLowerCase() === clean.toLowerCase())
    }

    // 3. Direct productCode match
    if (!product) {
      product = products.find(p => p.productCode && String(p.productCode).trim().toLowerCase() === clean.toLowerCase())
    }

    // 4. If only 1 product matches in current filtered list or exact name match
    if (!product && filteredProducts.length === 1) {
      product = filteredProducts[0]
    } else if (!product && filteredProducts.length > 0) {
      const exactMatch = filteredProducts.find(p => p.name.toLowerCase() === clean.toLowerCase())
      if (exactMatch) product = exactMatch
    }

    if (product) {
      handleAddProduct(product)
      setQuery('')
      if (searchRef.current) {
        searchRef.current.value = ''
        searchRef.current.focus()
      }
      isScanBurstRef.current = false
      scanBufferRef.current = ''
      return true
    } else {
      // Clear input and buffer even if no product was matched, ensuring next scan starts fresh
      setQuery('')
      if (searchRef.current) {
        searchRef.current.value = ''
        searchRef.current.focus()
      }
      isScanBurstRef.current = false
      scanBufferRef.current = ''
      return false
    }
  }

  // Handle barcode scanner input on the main search bar
  const handleSearchKeyDown = (e) => {
    const now = performance.now()
    const timeDiff = now - lastKeyTimeRef.current
    lastKeyTimeRef.current = now

    if (e.key === 'Enter') {
      e.preventDefault()
      clearTimeout(scanTimeoutRef.current)

      const codeToProcess = (isScanBurstRef.current && scanBufferRef.current.length >= 2
        ? scanBufferRef.current
        : (e.target.value || query)).trim()

      isScanBurstRef.current = false
      scanBufferRef.current = ''

      if (codeToProcess) {
        processScannedCode(codeToProcess)
      }
      return
    }

    // Hardware scanner character burst detection (< 60ms between characters)
    if (e.key.length === 1) {
      if (timeDiff > 120) {
        // Gap > 120ms: First character of a new scan or manual typing
        scanBufferRef.current = e.key
        isScanBurstRef.current = false
      } else {
        // Gap <= 120ms: Rapid incoming keystrokes from scanner!
        scanBufferRef.current += e.key
        if (scanBufferRef.current.length >= 2) {
          if (!isScanBurstRef.current) {
            isScanBurstRef.current = true
            // New scan has started: REPLACE existing query with this new scan!
            setQuery(scanBufferRef.current)
            if (searchRef.current) {
              searchRef.current.value = scanBufferRef.current
            }
          }
        }
      }

      // Fallback timer if scanner doesn't emit Enter key
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = setTimeout(() => {
        if (isScanBurstRef.current && scanBufferRef.current.length >= 3) {
          const code = scanBufferRef.current.trim()
          processScannedCode(code)
        }
        isScanBurstRef.current = false
        scanBufferRef.current = ''
      }, 70)
    }
  }

  // Dedicated scan mode input handler
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const barcode = barcodeBuffer.current.trim() || e.target.value.trim()
      if (barcode) {
        processScannedCode(barcode)
      }
      barcodeBuffer.current = ''
      e.target.value = ''
      return
    }

    clearTimeout(barcodeTimer.current)
    barcodeBuffer.current += e.key.length === 1 ? e.key : ''
    barcodeTimer.current = setTimeout(() => {
      barcodeBuffer.current = ''
    }, 200)
  }

  // Global listener: capture barcode scans even if focus is not in the search input
  useEffect(() => {
    let globalBuffer = ''
    let lastGlobalKeyTime = 0
    let globalTimer = null

    const handleGlobalKeyDown = (e) => {
      const activeEl = document.activeElement
      const isSearchInput = activeEl === searchRef.current || activeEl?.id === 'pos-search' || activeEl === barcodeRef.current
      const isOtherInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT') && !isSearchInput

      // Don't intercept when user is typing in forms/modals
      if (isOtherInput) return

      const now = performance.now()
      const diff = now - lastGlobalKeyTime
      lastGlobalKeyTime = now

      if (e.key === 'Enter') {
        if (globalBuffer.length >= 3 && diff < 80) {
          e.preventDefault()
          const code = globalBuffer.trim()
          globalBuffer = ''
          processScannedCode(code)
          return
        }
        globalBuffer = ''
        return
      }

      if (e.key.length === 1) {
        if (diff > 100) {
          globalBuffer = e.key
        } else {
          globalBuffer += e.key
        }

        clearTimeout(globalTimer)
        globalTimer = setTimeout(() => {
          if (globalBuffer.length >= 4 && !isSearchInput) {
            const code = globalBuffer.trim()
            processScannedCode(code)
          }
          globalBuffer = ''
        }, 80)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [products, filteredProducts])

  const handleAddProduct = (product) => {
    setAddingId(product.id)
    onAddToCart({
      ...product,
      rate: product.rate ?? product.price,
      price: product.rate ?? product.price,
      mrp: (product.mrp && Number(product.mrp) > 0) ? Number(product.mrp) : null,
      quantity: product.quantity ?? (product.isLoose ? 1 : 1),
      itemDiscount: 0,
    })
    setAddedId(product.id)
    setTimeout(() => {
      setAddingId(null)
      setTimeout(() => setAddedId(null), 600)
    }, 150)
    // Clear query and refocus so next scan or search starts fresh
    setQuery('')
    if (searchRef.current) {
      searchRef.current.value = ''
      searchRef.current.focus()
    }
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
      mrp: null,
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
    setQuery('')
    if (searchRef.current) {
      searchRef.current.value = ''
      searchRef.current.focus()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ─── Search & Barcode Bar ──────────────────────── */}
      <div className="p-4 border-b border-slate-800/60 space-y-3">
        <div className="flex gap-2">
          {/* Search Input */}
          <div className={`relative flex-1 ${barcodeMode ? 'hidden sm:block' : ''}`}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {isAnyLoading ? (
                <svg className="animate-spin w-5 h-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              ) : (
                <SearchIcon />
              )}
            </span>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                if (isScanBurstRef.current && scanBufferRef.current) {
                  setQuery(scanBufferRef.current)
                } else {
                  setQuery(e.target.value)
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={isAnyLoading && products.length === 0 ? "Loading products... सामान लोड हो रहा है..." : "Search product name, brand, barcode..."}
              className="w-full pl-11 pr-24 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-base transition-all"
              id="pos-search"
            />
            {isAnyLoading && (
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse hidden sm:inline">
                Loading...
              </span>
            )}
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
          <form onSubmit={handleAddLooseItem} className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <WeightIcon />
              <span className="text-sm font-semibold text-violet-400">Add Loose Item (खुला सामान)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={looseName}
                onChange={(e) => setLooseName(e.target.value)}
                placeholder="Item name"
                className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                value={loosePrice}
                onChange={(e) => setLoosePrice(e.target.value)}
                placeholder="Price per unit (₹)"
                className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 text-sm"
                required
              />
              <input
                type="number"
                step="0.001"
                value={looseQty}
                onChange={(e) => setLooseQty(e.target.value)}
                placeholder="Quantity (0.5, 1.75...)"
                className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 text-sm"
                required
              />
              <div className="col-span-2 sm:col-span-1 flex gap-2">
                <select
                  value={looseUnit}
                  onChange={(e) => setLooseUnit(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-violet-500/50 text-sm cursor-pointer"
                >
                  <option value="kg" className="bg-slate-900 text-slate-100">kg</option>
                  <option value="g" className="bg-slate-900 text-slate-100">g</option>
                  <option value="L" className="bg-slate-900 text-slate-100">L</option>
                  <option value="ml" className="bg-slate-900 text-slate-100">ml</option>
                  <option value="pcs" className="bg-slate-900 text-slate-100">pcs</option>
                  <option value="dozen" className="bg-slate-900 text-slate-100">dozen</option>
                  <option value="meter" className="bg-slate-900 text-slate-100">meter</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-violet-600/20"
                >
                  Add
                </button>
              </div>
            </div>
            {/* Quick Weight Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick Weight:</span>
              {['0.25', '0.5', '0.75', '1', '1.25', '1.5', '2', '5'].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => { setLooseQty(w); setLooseUnit('kg') }}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all border cursor-pointer ${
                    String(looseQty) === w
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {w} kg
                </button>
              ))}
            </div>
          </form>
        )}
      </div>

      {/* ─── Category Boxes ────────────────────────────── */}
      {categories.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {categories.length}
              </span>
            </div>
            {activeCategory && activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Clear filter</span>
                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded">✕</span>
              </button>
            )}
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {categories.map(cat => {
              const count = getCategoryCount(cat)
              const isActive = Boolean(activeCategory && (activeCategory === cat.id || (cat.slug && activeCategory === cat.slug)))

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(prev => prev === cat.id ? null : cat.id)}
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
      )}

      {/* ─── Product Grid ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loadError && (
          <div role="alert" className="mb-3 rounded-xl border border-rose-500/30 bg-slate-900 p-3 text-sm text-slate-200">
            <p>{loadError}</p>
            <button type="button" onClick={() => setReloadKey(key => key + 1)} className="mt-2 underline font-semibold cursor-pointer">Retry loading</button>
          </div>
        )}
        {/* Sync progress banner if products already loaded */}
        {isAnyLoading && products.length > 0 && (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900/60 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 shadow-sm animate-pulse">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span className="font-semibold">Loading product updates... (सामान अपडेट हो रहा है)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{products.length} products</span>
          </div>
        )}

        {isAnyLoading && products.length === 0 ? (
          <div className="py-8 px-2 flex flex-col items-center justify-center text-center animate-fadeIn">
            {/* Pulsing Glowing Spinner */}
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <svg className="animate-spin h-7 w-7 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
              </div>
              <div className="absolute -inset-1.5 rounded-2xl bg-emerald-500/15 blur-sm -z-10 animate-pulse"></div>
            </div>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Loading Products...
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                सामान लोड हो रहा है
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Please wait while product catalog, prices, and stock are loaded...
            </p>

            {/* Skeleton Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 flex flex-col justify-between h-44 animate-pulse"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="h-3.5 w-16 bg-slate-800 rounded"></div>
                      <div className="h-3 w-12 bg-slate-800/60 rounded"></div>
                    </div>
                    <div className="h-4 w-5/6 bg-slate-800 rounded"></div>
                    <div className="h-3 w-3/5 bg-slate-800/50 rounded"></div>
                    <div className="h-5 w-20 bg-slate-800 rounded mt-2"></div>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="h-4 w-16 bg-slate-800/60 rounded-full"></div>
                    <div className="h-7 w-7 bg-slate-800 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  {/* Adding micro-loader overlay */}
                  {addingId === product.id && (
                    <div className="absolute inset-0 rounded-xl bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 animate-fadeIn">
                      <svg className="animate-spin h-6 w-6 text-emerald-400 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span className="text-[11px] font-bold text-emerald-300">Adding...</span>
                    </div>
                  )}

                  {/* Added animation overlay */}
                  {addedId === product.id && addingId !== product.id && (
                    <div className="absolute inset-0 rounded-xl bg-emerald-500/15 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 animate-scaleIn">
                      <span className="text-emerald-400 text-2xl font-bold">✓</span>
                      <span className="text-[11px] font-bold text-emerald-300">Added!</span>
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
                      {addingId === product.id ? (
                        <svg className="animate-spin w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      ) : (
                        <FaPlus className="w-3.5 h-3.5" />
                      )}
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
