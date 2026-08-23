import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductSearch from './ProductSearch'
import Cart from './Cart'
import PaymentPanel from './PaymentPanel'
import HoldBill from './HoldBill'
import { ReceiptPreview, ReprintDrawer, SaleSuccessOverlay } from './BillReceipt'
import {
  generateBillNumber,
  calculateBillSummary,
  saveBill,
  getHeldBills,
  saveHeldBills,
  formatINR,
} from '../../hooks/posData'
import { FaShoppingCart as CartIcon } from 'react-icons/fa'

// ─── Main POS Billing Page ──────────────────────────────────────
export default function POSBilling() {
  const [searchParams] = useSearchParams()
  // ─── State ───────────────────────────────────────────────────
  const [cart, setCart] = useState([])
  const [billDiscount, setBillDiscount] = useState(0)
  const [isGSTInclusive, setIsGSTInclusive] = useState(true)
  const [customerName, setCustomerName] = useState(
    searchParams.get('customer') || searchParams.get('customerName') || ''
  )

  useEffect(() => {
    const queryCust = searchParams.get('customer') || searchParams.get('customerName')
    if (queryCust) {
      setCustomerName(queryCust)
    }
  }, [searchParams])
  const [heldBills, setHeldBills] = useState(() => getHeldBills())

  // Modals
  const [showHeldBills, setShowHeldBills] = useState(false)
  const [showReprint, setShowReprint] = useState(false)
  const [showReceipt, setShowReceipt] = useState(null) // bill object
  const [showSuccess, setShowSuccess] = useState(null) // bill object
  const [showMobileCart, setShowMobileCart] = useState(false)

  // ─── Cart Operations ────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      // Check if product already in cart (not loose custom items)
      const existing = prev.find(item =>
        item.id === product.id && !String(product.id).startsWith('loose-')
      )
      if (existing) {
        return prev.map(item =>
          item.cartId === existing.cartId
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        )
      }
      return [...prev, {
        ...product,
        cartId: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        quantity: product.quantity || 1,
        itemDiscount: product.itemDiscount || 0,
      }]
    })
  }, [])

  const updateQuantity = useCallback((cartId, newQty) => {
    setCart(prev => prev.map(item =>
      item.cartId === cartId ? { ...item, quantity: newQty } : item
    ))
  }, [])

  const updateDiscount = useCallback((cartId, discount) => {
    setCart(prev => prev.map(item =>
      item.cartId === cartId ? { ...item, itemDiscount: discount } : item
    ))
  }, [])

  const removeItem = useCallback((cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId))
  }, [])

  const clearCart = useCallback(() => {
    if (cart.length === 0) return
    if (window.confirm('Clear all items from cart? (सभी सामान हटाएं?)')) {
      setCart([])
      setBillDiscount(0)
      setCustomerName('')
    }
  }, [cart.length])

  // ─── Hold Bill ──────────────────────────────────────────────
  const holdCurrentBill = useCallback(() => {
    if (cart.length === 0) return
    const summary = calculateBillSummary(cart, billDiscount, isGSTInclusive)
    const heldBill = {
      id: `hold-${Date.now()}`,
      items: cart,
      billDiscount,
      isGSTInclusive,
      customerName,
      total: summary.grandTotal,
      timestamp: new Date().toISOString(),
    }
    const updated = [...heldBills, heldBill]
    setHeldBills(updated)
    saveHeldBills(updated)
    setCart([])
    setBillDiscount(0)
    setCustomerName('')
  }, [cart, billDiscount, isGSTInclusive, customerName, heldBills])

  const recallHeldBill = useCallback((billId) => {
    const bill = heldBills.find(b => b.id === billId)
    if (!bill) return

    // If current cart has items, ask to save or discard
    if (cart.length > 0) {
      if (!window.confirm('Current cart has items. Replace with held bill? (मौजूदा कार्ट बदलें?)')) {
        return
      }
    }

    setCart(bill.items)
    setBillDiscount(bill.billDiscount || 0)
    setIsGSTInclusive(bill.isGSTInclusive !== undefined ? bill.isGSTInclusive : true)
    setCustomerName(bill.customerName || '')

    const updated = heldBills.filter(b => b.id !== billId)
    setHeldBills(updated)
    saveHeldBills(updated)
    setShowHeldBills(false)
  }, [heldBills, cart.length])

  const deleteHeldBill = useCallback((billId) => {
    const updated = heldBills.filter(b => b.id !== billId)
    setHeldBills(updated)
    saveHeldBills(updated)
  }, [heldBills])

  // ─── Complete Sale ──────────────────────────────────────────
  const completeSale = useCallback((paymentMode, amountPaid) => {
    const summary = calculateBillSummary(cart, billDiscount, isGSTInclusive)
    const bill = {
      billNumber: generateBillNumber(),
      items: cart,
      summary,
      billDiscount,
      isGSTInclusive,
      paymentMode,
      amountPaid,
      customerName,
      timestamp: new Date().toISOString(),
    }

    saveBill(bill)
    setShowSuccess(bill)

    // Auto-clear after sale
    setCart([])
    setBillDiscount(0)
    setCustomerName('')
  }, [cart, billDiscount, isGSTInclusive, customerName])

  // ─── Keyboard Shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 = Hold Bill
      if (e.key === 'F2') {
        e.preventDefault()
        holdCurrentBill()
      }
      // F3 = Quick cash payment (if cart has items)
      if (e.key === 'F3') {
        e.preventDefault()
        // Focus will go to payment panel
      }
      // F4 = Reprint
      if (e.key === 'F4') {
        e.preventDefault()
        setShowReprint(true)
      }
      // Escape = close modals
      if (e.key === 'Escape') {
        setShowHeldBills(false)
        setShowReprint(false)
        setShowReceipt(null)
        if (showSuccess) setShowSuccess(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [holdCurrentBill, showSuccess])

  const summary = calculateBillSummary(cart, billDiscount, isGSTInclusive)

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* ─── Top Header Bar ─────────────────────────────── */}
      <header className="h-14 flex-shrink-0 border-b border-slate-800/60 bg-slate-950/95 backdrop-blur-xl flex items-center justify-between px-4 z-20">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-slate-800/60 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-amber-500/20">
              POS
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-tight">POS Billing</h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">बिलिंग काउंटर</p>
            </div>
          </div>
        </div>

        {/* Center: Customer Name */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-500">Customer:</span>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Walk-in Customer (ग्राहक का नाम)"
            className="w-56 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all"
            id="pos-customer-name"
          />
        </div>

        {/* Right: Quick Info + Shortcuts */}
        <div className="flex items-center gap-3">
          {/* Keyboard shortcuts hint */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-600">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">F1</kbd>
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">F2</kbd>
            <span>Hold</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">F4</kbd>
            <span>Reprint</span>
          </div>

          {/* Mobile cart toggle */}
          <button
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-semibold"
          >
            <CartIcon className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="text-xs">{cart.length} • {formatINR(summary.grandTotal)}</span>
            )}
          </button>

          {/* Current time */}
          <CurrentTime />
        </div>
      </header>

      {/* ─── Main Content: Product Search + Cart ──────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: Product Search Area ──────────────── */}
        <div className={`flex-1 flex flex-col border-r border-slate-800/60 min-w-0 ${showMobileCart ? 'hidden lg:flex' : 'flex'}`}>
          <ProductSearch onAddToCart={addToCart} />
        </div>

        {/* ── Right: Cart + Payment ─────────────────── */}
        <div className={`w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-slate-900/40 flex-shrink-0 ${showMobileCart ? 'flex' : 'hidden lg:flex'}`}>
          {/* Mobile back button */}
          <div className="lg:hidden flex items-center px-4 py-2 border-b border-slate-800/40">
            <button
              onClick={() => setShowMobileCart(false)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              ← Back to Products
            </button>
          </div>

          {/* Mobile Customer input */}
          <div className="md:hidden px-4 py-3 bg-slate-950/20 border-b border-slate-800/60 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Customer:</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer (ग्राहक का नाम)"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/60 text-xs text-slate-300 placeholder:text-slate-650 focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onUpdateDiscount={updateDiscount}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
            />
          </div>

          {/* Payment Panel */}
          <PaymentPanel
            cartItems={cart}
            billDiscount={billDiscount}
            onBillDiscountChange={setBillDiscount}
            isGSTInclusive={isGSTInclusive}
            onToggleGSTMode={() => setIsGSTInclusive(prev => !prev)}
            onCompleteSale={completeSale}
            onHoldBill={holdCurrentBill}
            heldBillsCount={heldBills.length}
            onShowHeldBills={() => setShowHeldBills(true)}
            onShowReprint={() => setShowReprint(true)}
          />
        </div>
      </div>

      {/* ─── Modals ───────────────────────────────────── */}
      {showHeldBills && (
        <HoldBill
          heldBills={heldBills}
          onRecall={recallHeldBill}
          onDelete={deleteHeldBill}
          onClose={() => setShowHeldBills(false)}
        />
      )}

      {showReprint && (
        <ReprintDrawer
          onClose={() => setShowReprint(false)}
          onSelectBill={(bill) => {
            setShowReprint(false)
            setShowReceipt(bill)
          }}
        />
      )}

      {showReceipt && (
        <ReceiptPreview
          bill={showReceipt}
          onClose={() => setShowReceipt(null)}
        />
      )}

      {showSuccess && (
        <SaleSuccessOverlay
          bill={showSuccess}
          onDone={() => {
            setShowReceipt(showSuccess)
            setShowSuccess(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Live Clock Widget ──────────────────────────────────────────
function CurrentTime() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="hidden sm:block text-right">
      <p className="text-xs font-mono text-slate-400 tabular-nums">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[10px] text-slate-600">
        {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
      </p>
    </div>
  )
}
