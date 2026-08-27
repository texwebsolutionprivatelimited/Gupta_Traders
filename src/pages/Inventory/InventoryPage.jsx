import { useState, useEffect } from 'react'
import { getCategories, formatINR, getAllProducts } from '../../hooks/productData'
import { getInventorySummary, getInventoryLogs } from '../../hooks/inventoryData'

// Components
import Toast from './Toast'
import StatCard from './StatCard'
import StockAdjustmentModal from './StockAdjustmentModal'
import MinStockModal from './MinStockModal'

// Icons
import {
  SearchIcon,
  AdjustIcon,
  MinStockIcon,
  InwardIcon,
  OutwardIcon,
  ReconcileIcon,
  BoxIcon,
  LedgerIcon
} from './Icons'

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
    const sorted = [...all].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })
    setProducts(sorted)
    setLogs(getInventoryLogs())
    setSummary(getInventorySummary())
  }

  useEffect(() => {
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
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-semibold bg-slate-900/60 border border-slate-700/40 text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-emerald-500/40"
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
                              : 'text-blue-450'
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
