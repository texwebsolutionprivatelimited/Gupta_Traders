import { useState, useEffect, useRef } from 'react'
import { getCategories, formatINR, getAllProducts } from '../../hooks/productData'
import { getInventorySummary, getInventoryLogs, adjustStock, updateMinStockLimit } from '../../hooks/inventoryData'

// ─── Inline SVG Icons ──────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function AdjustIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
  )
}

function MinStockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21l3.75-3.75" />
    </svg>
  )
}

function InwardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
  )
}

function OutwardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  )
}

function ReconcileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function LedgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

// ─── TOAST ─────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bg = type === 'success'
    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
    : type === 'error'
      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slideIn ${bg}`}>
      {type === 'success' && <CheckIcon />}
      {type === 'error' && <CloseIcon />}
      {type === 'warning' && <WarningIcon />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
        <CloseIcon />
      </button>
    </div>
  )
}

// ─── STAT CARD ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: color + '20', color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  )
}

// ─── ADJUST STOCK MODAL ────────────────────────────────────────────

function StockAdjustmentModal({ product, onSave, onCancel }) {
  const [qty, setQty] = useState('')
  const [type, setType] = useState('inward') // 'inward' | 'outward' | 'reconcile'
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

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

// ─── MIN STOCK THRESHOLD MODAL ─────────────────────────────────────

function MinStockModal({ product, onSave, onCancel }) {
  const [minStock, setMinStock] = useState(product.minStock || 10)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = Number(minStock)
    if (minStock === '' || isNaN(num) || num < 0) {
      setError('Please enter a valid threshold limit')
      return
    }

    const res = updateMinStockLimit(product.id, num)
    if (res.error) {
      setError(res.error)
      return
    }

    onSave(res.product, `Minimum stock threshold limit updated for ${product.name}`)
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
// ─── MAIN INVENTORY PAGE ───────────────────────────────────────────
const ITEMS_PER_PAGE = 10

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('stock') // 'stock' | 'ledger'
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'low' | 'out'

  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState({
    totalCostValue: 0,
    totalRetailValue: 0,
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [ledgerPage, setLedgerPage] = useState(1)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, statusFilter])

  // Modals state
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [minStockTarget, setMinStockTarget] = useState(null)
  const [toast, setToast] = useState(null)

  // Load datasets on mount & update
  const reloadData = () => {
    // Read directly from productData
    const all = getAllProducts()
    setProducts(all)
    setLogs(getInventoryLogs())
    setSummary(getInventorySummary())
  }

  useEffect(() => {
    // Dynamic import to avoid cycles or load issues
    reloadData()
  }, [])

  // Handle updates from modals
  const handleSavedUpdate = (updatedProduct, message) => {
    setAdjustTarget(null)
    setMinStockTarget(null)
    setToast({ message, type: 'success' })
    reloadData()
  }

  // Filter products list
  const filteredProducts = products.filter(p => {
    // Category match
    const catMatch = categoryFilter === 'all' || p.category === categoryFilter

    // Status match
    const stock = Number(p.currentStock) || 0
    const minLimit = Number(p.minStock) || 10
    let statusMatch = true
    if (statusFilter === 'low') {
      statusMatch = stock > 0 && stock <= minLimit
    } else if (statusFilter === 'out') {
      statusMatch = stock === 0
    }

    // Search query match
    const q = searchQuery.toLowerCase().trim()
    let queryMatch = true
    if (q) {
      queryMatch =
        p.name.toLowerCase().includes(q) ||
        (p.nameHi && p.nameHi.includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.productCode && p.productCode.toLowerCase().includes(q))
    }

    return catMatch && statusMatch && queryMatch
  })

  // Pagination Calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const ledgerTotalPages = Math.ceil(logs.length / ITEMS_PER_PAGE)
  const paginatedLogs = logs.slice((ledgerPage - 1) * ITEMS_PER_PAGE, ledgerPage * ITEMS_PER_PAGE)

  // Categories helper list
  const categoriesList = getCategories()

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2.5">
            📦 Stock Inventory Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile physical stock counts, inspect warehouse value, and verify low stock alerts.
          </p>
        </div>

        {/* View Selector Tab Header */}
        <div className="inline-flex rounded-xl bg-slate-900 border border-slate-700/40 p-1 self-start">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'stock'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <BoxIcon />
            Stock Ledger
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'ledger'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <LedgerIcon />
            Audit History Logs
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📦"
          label="Total Registered Items"
          value={summary.totalItems}
          color="#38bdf8"
        />
        <StatCard
          icon="💰"
          label="Est. Retail Inventory Value"
          value={formatINR(summary.totalRetailValue)}
          color="#34d399"
        />
        <StatCard
          icon="⚠️"
          label="Low Stock Warning Items"
          value={summary.lowStockCount}
          color="#fbbf24"
        />
        <StatCard
          icon="🚨"
          label="Out of Stock Alerts"
          value={summary.outOfStockCount}
          color="#f87171"
        />
      </div>

      {/* ─── TAB CONTENT: STOCK MANAGEMENT ─── */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inventory by name, barcode, SKU code..."
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-semibold bg-slate-900/60 border border-slate-700/40 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40"
              />
            </div>

            {/* Select Category Filter */}
            <div className="w-full lg:w-48">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-slate-900/60 border border-slate-700/40 text-slate-300 focus:outline-none focus:border-emerald-500/40 appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Status Buttons */}
            <div className="inline-flex rounded-xl bg-slate-900/60 border border-slate-700/40 p-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'all'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                All Stock
              </button>
              <button
                onClick={() => setStatusFilter('low')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'low'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Low Stock ({summary.lowStockCount})
              </button>
              <button
                onClick={() => setStatusFilter('out')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'out'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Out of Stock ({summary.outOfStockCount})
              </button>
            </div>
          </div>

          {/* Grid / Table Container */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4 lg:p-6 overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/40 flex items-center justify-center mx-auto text-slate-600 mb-4">
                  📦
                </div>
                <p className="text-slate-400 font-bold text-sm">No matching inventory items found</p>
                <p className="text-xs text-slate-600 mt-1">Try tweaking your search term or selection filters</p>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800/60">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Details</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Code</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Price</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Retail Price</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Alert Level</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Quantity</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {paginatedProducts.map(product => {
                        const stock = Number(product.currentStock) || 0
                        const minLimit = Number(product.minStock) || 10
                        const isOut = stock === 0
                        const isLow = stock > 0 && stock <= minLimit

                        return (
                          <tr key={product.id} className="hover:bg-slate-800/20 transition-colors">
                            {/* Product Name */}
                            <td className="py-3.5 px-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-200">{product.name}</p>
                                {product.nameHi && <p className="text-xs text-slate-500 font-medium">{product.nameHi}</p>}
                                <span className="text-[10px] font-mono text-slate-600 block mt-0.5">BC: {product.barcode}</span>
                              </div>
                            </td>
                            {/* SKU Code */}
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                              {product.sku || product.productCode}
                            </td>
                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span className="text-xs text-slate-400 capitalize bg-slate-800/60 border border-slate-700/30 px-2 py-0.5 rounded-md">
                                {product.category}
                              </span>
                            </td>
                            {/* Cost Price */}
                            <td className="py-3.5 px-4 text-right text-xs font-medium text-slate-400">
                              {formatINR(product.purchasePrice || 0)}
                            </td>
                            {/* Selling Price */}
                            <td className="py-3.5 px-4 text-right text-xs font-bold text-slate-200">
                              {formatINR(product.sellingPrice || 0)}
                            </td>
                            {/* Min Stock Limit */}
                            <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                              Alert under: {minLimit} {product.unit}
                            </td>
                            {/* Stock Indicator */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${isOut
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                : isLow
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOut
                                  ? 'bg-rose-400 animate-pulse'
                                  : isLow
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                  }`} />
                                {stock} {product.unit}
                              </span>
                            </td>
                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setAdjustTarget(product)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold cursor-pointer"
                                  title="Adjust Stock Qty"
                                >
                                  <AdjustIcon />
                                  Quick Adjust
                                </button>
                                <button
                                  onClick={() => setMinStockTarget(product)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all border border-slate-700/60 cursor-pointer"
                                  title="Set Min Alert Threshold"
                                >
                                  <MinStockIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paginatedProducts.map(product => {
                    const stock = Number(product.currentStock) || 0
                    const minLimit = Number(product.minStock) || 10
                    const isOut = stock === 0
                    const isLow = stock > 0 && stock <= minLimit

                    return (
                      <div key={product.id} className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-slate-200">{product.name}</h3>
                            {product.nameHi && <p className="text-xs text-slate-500">{product.nameHi}</p>}
                            <span className="text-[10px] text-slate-600 font-mono">BC: {product.barcode}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700/40 px-1.5 py-0.5 rounded">
                            {product.sku || product.productCode}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Retail Price:</span>
                          <span className="font-bold text-slate-300">{formatINR(product.sellingPrice)}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Alert Threshold:</span>
                          <span className="font-medium text-slate-400">{minLimit} {product.unit}</span>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-800/60 pt-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${isOut
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : isLow
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                            {stock} {product.unit}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setMinStockTarget(product)}
                              className="p-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700/60 cursor-pointer hover:bg-slate-700"
                            >
                              <MinStockIcon />
                            </button>
                            <button
                              onClick={() => setAdjustTarget(product)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold cursor-pointer"
                            >
                              <AdjustIcon />
                              Adjust
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── Pagination Controls ───────────────────── */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 pt-5 border-t border-slate-800/40">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${currentPage === 1
                        ? 'bg-slate-800/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-100'
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                      </svg>
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                        const showEllipsisBefore = page === currentPage - 2 && currentPage > 4
                        const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 3

                        if (showEllipsisBefore || showEllipsisAfter) {
                          return (
                            <span key={page} className="px-1 text-slate-600 text-sm">…</span>
                          )
                        }

                        if (!showPage) return null

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${page === currentPage
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                              : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${currentPage === totalPages
                        ? 'bg-slate-800/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-100'
                        }`}
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: AUDIT LOG HISTORY ─── */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4 lg:p-6 overflow-hidden">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              📜 Physical stock reconciliation audit ledger logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              History of all manual inventory adjustments, supplier inward items, and stock write-offs.
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/40 flex items-center justify-center mx-auto text-slate-600 mb-4">
                📜
              </div>
              <p className="text-slate-400 font-bold text-sm">No inventory audit transactions found</p>
              <p className="text-xs text-slate-600 mt-1">Make adjustments on stock list to see history reports</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Code</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action Type</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Adjustment Qty</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reconciled Stock Change</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason / Operator Note</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {paginatedLogs.map(log => {
                    const isPlus = log.type === 'inward'
                    const isMinus = log.type === 'outward'
                    const isReset = log.type === 'reconcile'

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        {/* Product Name */}
                        <td className="py-3 px-4">
                          <div>
                            <span className="text-sm font-semibold text-slate-200">{log.productName}</span>
                            <span className="text-[10px] font-mono text-slate-600 block">BC: {log.barcode}</span>
                          </div>
                        </td>
                        {/* SKU */}
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">
                          {log.sku}
                        </td>
                        {/* Transaction Type Tag */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${isPlus
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isMinus
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                            {isPlus && <InwardIcon />}
                            {isMinus && <OutwardIcon />}
                            {isReset && <ReconcileIcon />}
                            {log.type === 'inward' ? 'Stock In' : log.type === 'outward' ? 'Stock Out' : 'Audit Reset'}
                          </span>
                        </td>
                        {/* Adjusted Quantity */}
                        <td className={`py-3 px-4 text-right text-xs font-extrabold ${isPlus
                          ? 'text-emerald-400'
                          : isMinus
                            ? 'text-rose-400'
                            : 'text-blue-400'
                              ? 'text-rose-400'
                              : 'text-blue-400'
                            }`}>
                            {isPlus ? '+' : isMinus ? '-' : ''}
                            {log.quantity}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                            {log.prevStock} → <span className="font-bold text-white">{log.newStock}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400 max-w-xs truncate" title={log.reason}>
                            {log.reason}
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-semibold text-slate-500">
                            {log.operator}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Ledger Pagination Controls ───────────────────── */}
              {ledgerTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 pt-5 border-t border-slate-800/40">
                  <button
                    onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                    disabled={ledgerPage === 1}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${ledgerPage === 1
                      ? 'bg-slate-800/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-100'
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: ledgerTotalPages }, (_, i) => i + 1).map(page => {
                      const showPage = page === 1 || page === ledgerTotalPages || Math.abs(page - ledgerPage) <= 1
                      const showEllipsisBefore = page === ledgerPage - 2 && ledgerPage > 4
                      const showEllipsisAfter = page === ledgerPage + 2 && ledgerPage < ledgerTotalPages - 3

                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={page} className="px-1 text-slate-600 text-sm">…</span>
                        )
                      }

                      if (!showPage) return null

                      return (
                        <button
                          key={page}
                          onClick={() => setLedgerPage(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${page === ledgerPage
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                            : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setLedgerPage(p => Math.min(ledgerTotalPages, p + 1))}
                    disabled={ledgerPage === ledgerTotalPages}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${ledgerPage === ledgerTotalPages
                      ? 'bg-slate-800/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-100'
                      }`}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── TOAST ─── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ─── MODAL: ADJUST STOCK ─── */}
      {adjustTarget && (
        <StockAdjustmentModal
          product={adjustTarget}
          onSave={handleSavedUpdate}
          onCancel={() => setAdjustTarget(null)}
        />
      )}

      {/* ─── MODAL: MIN STOCK ALERT LIMIT ─── */}
      {minStockTarget && (
        <MinStockModal
          product={minStockTarget}
          onSave={handleSavedUpdate}
          onCancel={() => setMinStockTarget(null)}
        />
      )}
    </div>
  )
}
