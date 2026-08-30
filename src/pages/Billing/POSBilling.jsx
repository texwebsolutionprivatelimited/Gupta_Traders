import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductSearch from './ProductSearch'
import Cart from './Cart'
import PaymentPanel from './PaymentPanel'
import HoldBill from './HoldBill'
import AddCustomItemModal from './AddCustomItemModal'
import { ReceiptPreview, ReprintDrawer, SaleSuccessOverlay } from './BillReceipt'
import {
  calculateBillSummary,
  formatINR,
} from '../../utils/erp'
import { completeSale as persistSale, deleteHeldBill as removeHeldBill, listHeldBills, listUICustomers, listUIProducts, saveHeldBill, subscribeToTable } from '../../services/erpService'
import { FaShoppingCart as CartIcon, FaPlus } from 'react-icons/fa'
import guptaTradersLogo from '../../assets/gupta traders logo.png'

// ─── Main POS Billing Page ──────────────────────────────────────
export default function POSBilling() {
  const [searchParams] = useSearchParams()
  const [cart, setCart] = useState([])
  const [productIndex,setProductIndex]=useState([])
  const [customerIndex,setCustomerIndex]=useState([])
  useEffect(()=>{const load=()=>listUIProducts().then(rows=>setProductIndex(rows.map(p=>({...p,price:p.sellingPrice,mrp:p.sellingPrice,stock:p.currentStock,isLoose:p.type==='loose'})))).catch(console.error);load();return subscribeToTable('products',load)},[])
  useEffect(()=>{listUICustomers().then(setCustomerIndex).catch(console.error)},[])
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

  const [heldBills, setHeldBills] = useState([])
  useEffect(() => { listHeldBills().then(rows => setHeldBills(rows.map(row => ({...row, id:row.id, items:row.cart, ...(row.totals||{}), timestamp:row.held_at})))).catch(e => window.alert(e.message)) }, [])

  // Modals
  const [showHeldBills, setShowHeldBills] = useState(false)
  const [showReprint, setShowReprint] = useState(false)
  const [showReceipt, setShowReceipt] = useState(null) // bill object
  const [showSuccess, setShowSuccess] = useState(null) // bill object
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [showCustomItemModal, setShowCustomItemModal] = useState(false)

  // ─── Cart Operations ────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const isCustom = product.isCustomItem || String(product.id || '').startsWith('loose-')

      // Agar custom/loose item nahi hai tabhi existing cart item se merge karein
      const existing = !isCustom ? prev.find(item => item.id === product.id) : null

      if (existing) {
        return prev.map(item =>
          item.cartId === existing.cartId
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        )
      }

      return [...prev, {
        ...product,
        cartId: product.cartId || `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
  const holdCurrentBill = useCallback(async () => {
    if (cart.length === 0) return
    const summary = calculateBillSummary(cart, billDiscount, isGSTInclusive)
    const heldBill = {
      items: cart,
      billDiscount,
      isGSTInclusive,
      customerName,
      total: summary.grandTotal,
      timestamp: new Date().toISOString(),
    }
    try { const saved=await saveHeldBill({label:customerName||'Walk-in',cart,totals:{billDiscount,isGSTInclusive,customerName,total:summary.grandTotal}}); setHeldBills(prev=>[...prev,{...heldBill,id:saved.id}]); setCart([]);setBillDiscount(0);setCustomerName('') } catch(e){window.alert(e.message)}
  }, [cart, billDiscount, isGSTInclusive, customerName, heldBills])

  const recallHeldBill = useCallback(async (billId) => {
    const bill = heldBills.find(b => b.id === billId)
    if (!bill) return

    if (cart.length > 0) {
      if (!window.confirm('Current cart has items. Replace with held bill? (मौजूदा कार्ट बदलें?)')) {
        return
      }
    }

    setCart(bill.items)
    setBillDiscount(bill.billDiscount || 0)
    setIsGSTInclusive(bill.isGSTInclusive !== undefined ? bill.isGSTInclusive : true)
    setCustomerName(bill.customerName || '')

    try { await removeHeldBill(billId); setHeldBills(prev=>prev.filter(b=>b.id!==billId));setShowHeldBills(false) } catch(e){window.alert(e.message)}
  }, [heldBills, cart.length])

  const deleteHeldBill = useCallback(async (billId) => { try{await removeHeldBill(billId);setHeldBills(prev=>prev.filter(b=>b.id!==billId))}catch(e){window.alert(e.message)} }, [])

  // ─── Complete Sale ──────────────────────────────────────────
  const completeSale = useCallback(async (paymentMode, amountPaid) => {
    const summary = calculateBillSummary(cart, billDiscount, isGSTInclusive)
    const bill = {
      items: cart,
      summary,
      billDiscount,
      isGSTInclusive,
      paymentMode,
      amountPaid,
      customerName,
      timestamp: new Date().toISOString(),
    }

    try {
      const items=cart.filter(x=>!x.isCustomItem).map(x=>({product_id:x.supabase_id||x.id,quantity:Number(x.quantity),unit_price:Number(x.price??x.sellingPrice),discount:Number(x.itemDiscount||0),tax_rate:Number(x.gstRate||0)}))
      if(items.length!==cart.length) throw new Error('Custom items must first be created as service products before checkout.')
      const matchedCustomer=customerIndex.find(c=>c.id===customerName||c.name.toLowerCase()===customerName.trim().toLowerCase())
      if(Number(amountPaid||0)<summary.grandTotal&&!matchedCustomer)throw new Error('A registered customer is required for credit or partial-payment sales.')
      const saved=await persistSale({customer_id:matchedCustomer?.id||null,discount:Number(billDiscount||0),amount_paid:Number(amountPaid||0),payment_method:paymentMode,metadata:{customerName,isGSTInclusive}},items)
      const completed={...bill,billNumber:saved.invoice_number,id:saved.id,summary:{...summary,grandTotal:Number(saved.total_amount)}}
      setShowSuccess(completed);setCart([]);setBillDiscount(0);setCustomerName('')
    } catch(e) { window.alert(e.message) }
  }, [cart, billDiscount, isGSTInclusive, customerName, customerIndex])

  // ─── Barcode Scanner Settings & Toast State ─────────────────
  const [scannerStatus, setScannerStatus] = useState({
    connected: true,
    erpConnected: true,
    scannerName: "USB Barcode Scanner",
    prefix: "",
    suffix: "Enter"
  })
  const [printerStatus, setPrinterStatus] = useState({
    connected: false,
    printerName: "Printer"
  })
  const [toast, setToast] = useState(null)

  const triggerToast = useCallback((type, title, message) => {
    setToast({ type, title, message })
  }, [])

  const playScanBeep = (success) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      if (success) {
        osc.type = "sine"
        osc.frequency.setValueAtTime(1400, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)
      } else {
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(320, ctx.currentTime)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.22)
      }
    } catch (e) {
      console.warn("Scan audio beep failed:", e)
    }
  }

  useEffect(() => {
    const checkSettings = () => {
      try {
        const stored = localStorage.getItem("barcodeScannerSettings")
        if (stored) setScannerStatus(JSON.parse(stored))

        const thermalStored = localStorage.getItem("thermalPrinterSettings")
        const usbStored = localStorage.getItem("usbPrinterSettings")
        
        let printerConnected = false
        let printerName = "Printer"
        
        if (thermalStored) {
          const parsed = JSON.parse(thermalStored)
          if (parsed && parsed.connected) {
            printerConnected = true
            printerName = parsed.printerName || "Thermal Printer"
          }
        }
        
        if (!printerConnected && usbStored) {
          const parsed = JSON.parse(usbStored)
          if (parsed && parsed.connected) {
            printerConnected = true
            printerName = parsed.printerName || "USB Printer"
          }
        }
        
        setPrinterStatus({ connected: printerConnected, printerName })
      } catch (e) {
        console.error("Failed to parse scanner or printer settings:", e)
      }
    }

    checkSettings()
    window.addEventListener("storage", checkSettings)
    const interval = setInterval(checkSettings, 2000)

    return () => {
      window.removeEventListener("storage", checkSettings)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timeout)
  }, [toast])

  // Global scanner keystroke interception
  useEffect(() => {
    let buffer = ""
    let lastKeyTime = 0
    let timeoutId = null

    const handleGlobalKeyDown = (e) => {
      if (!scannerStatus.connected || !scannerStatus.erpConnected) return

      const currentTime = Date.now()
      const isRapid = (currentTime - lastKeyTime) < 45 || buffer.length === 0
      lastKeyTime = currentTime

      const prefixChar = scannerStatus.prefix || ""
      const suffixType = scannerStatus.suffix || "Enter"

      const isSuffix = (suffixType === "Enter" && e.key === "Enter") ||
        (suffixType === "Tab" && e.key === "Tab")

      if (isSuffix) {
        if (buffer.length >= 3 && isRapid) {
          e.preventDefault()
          e.stopPropagation()
          processBarcode(buffer)
          buffer = ""
        }
        buffer = ""
        return
      }

      if (suffixType === "None") {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (buffer.length >= 3) {
            processBarcode(buffer)
          }
          buffer = ""
        }, 50)
      }

      if (e.key.length === 1) {
        if (buffer.length === 0 && prefixChar && e.key !== prefixChar) {
          return
        }

        if (isRapid) {
          buffer += e.key
        } else {
          buffer = e.key
        }
      }
    }

    const processBarcode = (scannedCode) => {
      let cleanCode = scannedCode
      const prefixChar = scannerStatus.prefix || ""
      if (prefixChar && cleanCode.startsWith(prefixChar)) {
        cleanCode = cleanCode.substring(prefixChar.length)
      }

      const prod = productIndex.find(p=>p.barcode===cleanCode)
      if (prod) {
        addToCart(prod)
        triggerToast("success", `Scanned: ${prod.name}`, `Added to cart • ₹${prod.price}`)
        playScanBeep(true)
      } else {
        triggerToast("error", `Scanned: ${cleanCode}`, "Item not found in product database!")
        playScanBeep(false)
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown, true)
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true)
      clearTimeout(timeoutId)
    }
  }, [scannerStatus, addToCart, triggerToast, productIndex])

  // ─── Keyboard Shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault()
        holdCurrentBill()
      }
      if (e.key === 'F4') {
        e.preventDefault()
        setShowReprint(true)
      }
      if (e.key === 'F8') {
        e.preventDefault()
        setShowCustomItemModal(true)
      }
      if (e.key === 'Escape') {
        setShowHeldBills(false)
        setShowReprint(false)
        setShowReceipt(null)
        setShowCustomItemModal(false)
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
            <img
              src={guptaTradersLogo}
              alt="Gupta Traders Logo"
              className="w-7 h-7 object-contain rounded-lg shadow-md border border-slate-800/80 bg-slate-900/50 p-0.5 flex-shrink-0"
            />
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-tight">POS Billing</h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">Gupta Traders • बिलिंग काउंटर</p>
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

        {/* Right: Quick Info + Shortcuts + Custom Item */}
        <div className="flex items-center gap-3">
          {/* Add Custom Item Button */}
          <button
            onClick={() => setShowCustomItemModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium transition-all shadow-sm"
            title="Add Loose/Unlisted Product (Shortcut: F8)"
          >
            <FaPlus className="w-3 h-3" />
            <span className="hidden sm:inline">Custom Item</span>
            <kbd className="hidden lg:inline text-[9px] bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30 font-mono ml-0.5">F8</kbd>
          </button>

          {/* Scanner Sync Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${scannerStatus.connected && scannerStatus.erpConnected
            ? 'bg-emerald-550/10 text-emerald-400 border-emerald-500/20'
            : 'bg-rose-550/10 text-rose-400 border-rose-500/20'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${scannerStatus.connected && scannerStatus.erpConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`} />
            <span>
              {scannerStatus.connected && scannerStatus.erpConnected
                ? `Scanner: Synced`
                : 'Scanner Offline'}
            </span>
          </div>

          {/* Printer Sync Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${printerStatus.connected
            ? 'bg-emerald-550/10 text-emerald-400 border-emerald-500/20'
            : 'bg-rose-550/10 text-rose-400 border-rose-500/20'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${printerStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`} />
            <span>
              {printerStatus.connected
                ? `Printer: Synced`
                : 'Printer Offline'}
            </span>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-600">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">F1</kbd>
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">F2</kbd>
            <span>Hold</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">F4</kbd>
            <span>Reprint</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">F8</kbd>
            <span>Custom</span>
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
              Back to Products
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

      {showCustomItemModal && (
        <AddCustomItemModal
          onAddToCart={(customItem) => {
            addToCart(customItem)
            triggerToast("success", `Custom Item Added`, `${customItem.name} • ₹${customItem.price}`)
          }}
          onClose={() => setShowCustomItemModal(false)}
        />
      )}

      {/* ─── Scan Intercept Toast Alert ──────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-55 flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl transition-all duration-300 animate-slide-up ${toast.type === "success"
          ? "bg-slate-900 border-emerald-500/30 text-emerald-400"
          : "bg-slate-900 border-rose-500/30 text-rose-450"
          }`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toast.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
            {toast.type === "success" ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{toast.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-slate-300 ml-2 text-sm font-bold focus:outline-none"
          >
            ✕
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(1.5rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
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
