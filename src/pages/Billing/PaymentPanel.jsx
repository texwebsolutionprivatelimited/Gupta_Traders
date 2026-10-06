import { useState } from 'react'
import { formatINR, calculateBillSummary } from '../../utils/erp'
import {
  FaTag as TagIcon,
  FaPause as PauseIcon,
  FaClipboard as ClipboardIcon,
  FaPrint as PrinterIcon,
  FaMoneyBillWave as CashIcon,
  FaMobileAlt as PhoneIcon,
  FaCheckCircle as CheckCircleIcon,
  FaEdit as EditIcon,
} from 'react-icons/fa'

// ─── Payment Panel Component ─────────────────────────────────────
export default function PaymentPanel({
  cartItems,
  billDiscount,
  onBillDiscountChange,
  isGSTInclusive,
  onCompleteSale,
  onHoldBill,
  heldBillsCount,
  onShowHeldBills,
  onShowReprint,
}) {
  const [paymentMode, setPaymentMode] = useState(null) // 'cash' | 'upi'
  const [amountTendered, setAmountTendered] = useState('')
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [discountType, setDiscountType] = useState('flat') // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState('')

  // Cashier/Admin Editable Bill Payment Amount
  const [customBillAmount, setCustomBillAmount] = useState('')
  const [isEditingBillAmount, setIsEditingBillAmount] = useState(false)

  // Cash + UPI Split Payment Modal State
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitCash, setSplitCash] = useState('')
  const [splitUpi, setSplitUpi] = useState('')

  const summary = calculateBillSummary(cartItems, billDiscount, isGSTInclusive)
  const canCheckout = cartItems.length > 0

  // Effective payable amount (uses customBillAmount if edited, otherwise summary.grandTotal)
  const effectivePayableAmount = customBillAmount !== '' && !isNaN(Number(customBillAmount)) && Number(customBillAmount) >= 0
    ? Number(Number(customBillAmount).toFixed(2))
    : summary.grandTotal

  // Quick cash amounts for faster billing
  const quickAmounts = [50, 100, 200, 500, 1000, 2000]
  const changeAmount = amountTendered ? parseFloat(amountTendered) - effectivePayableAmount : 0

  const handleApplyDiscount = () => {
    if (!discountValue) return
    const val = parseFloat(discountValue)
    if (isNaN(val) || val <= 0) {
      onBillDiscountChange(0)
      setShowDiscountInput(false)
      return
    }
    const sanitizedVal = discountType === 'percent' ? Math.min(100, Math.max(0, val)) : Math.max(0, val)
    onBillDiscountChange({
      type: discountType === 'percent' ? 'percent' : 'fixed',
      value: sanitizedVal,
    })
    setShowDiscountInput(false)
  }

  const handleApplyPresetDiscount = (type, val) => {
    setDiscountType(type)
    setDiscountValue(String(val))
    onBillDiscountChange({
      type,
      value: val,
    })
    setShowDiscountInput(false)
  }

  const handleRemoveDiscount = () => {
    onBillDiscountChange(0)
    setDiscountValue('')
  }

  const handleToggleDiscountInput = () => {
    if (!showDiscountInput) {
      if (summary.billDiscountType === 'percent') {
        setDiscountType('percent')
        setDiscountValue(summary.billDiscountValue ? String(summary.billDiscountValue) : '')
      } else if (summary.billDiscountValue > 0) {
        setDiscountType('flat')
        setDiscountValue(String(summary.billDiscountValue))
      }
    }
    setShowDiscountInput(prev => !prev)
  }

  const handlePayment = () => {
    if (!paymentMode || !canCheckout) return
    const finalBillAmount = effectivePayableAmount
    const tendered = paymentMode === 'cash' ? (parseFloat(amountTendered) || finalBillAmount) : finalBillAmount
    onCompleteSale(paymentMode, tendered, null, {
      customBillAmount: customBillAmount !== '' ? Number(customBillAmount) : undefined,
      finalPayableAmount: finalBillAmount,
    })
    setPaymentMode(null)
    setAmountTendered('')
  }

  const handleOpenSplitModal = () => {
    if (!canCheckout) return
    const total = effectivePayableAmount
    setSplitCash('')
    setSplitUpi(String(total.toFixed(2)))
    setShowSplitModal(true)
  }

  const handleCashChange = (val) => {
    setSplitCash(val)
    if (val === '') {
      setSplitUpi(String(effectivePayableAmount.toFixed(2)))
      return
    }
    const num = parseFloat(val)
    if (!isNaN(num)) {
      const remaining = Math.max(0, Number((effectivePayableAmount - num).toFixed(2)))
      setSplitUpi(String(remaining))
    }
  }

  const handleUpiChange = (val) => {
    setSplitUpi(val)
    if (val === '') {
      setSplitCash(String(effectivePayableAmount.toFixed(2)))
      return
    }
    const num = parseFloat(val)
    if (!isNaN(num)) {
      const remaining = Math.max(0, Number((effectivePayableAmount - num).toFixed(2)))
      setSplitCash(String(remaining))
    }
  }

  const handleConfirmSplit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const cashNum = parseFloat(splitCash) || 0
    const upiNum = parseFloat(splitUpi) || 0
    const totalCollected = Number((cashNum + upiNum).toFixed(2))
    if (totalCollected <= 0) return

    onCompleteSale('cash_upi', totalCollected, {
      cashAmount: cashNum,
      upiAmount: upiNum,
    }, {
      customBillAmount: customBillAmount !== '' ? Number(customBillAmount) : undefined,
      finalPayableAmount: effectivePayableAmount,
    })
    setShowSplitModal(false)
    setPaymentMode(null)
  }

  return (
    <div className="flex flex-col border-t border-slate-700/60 bg-slate-900/80">
      {/* ─── Bill Summary ──────────────────────────── */}
      <div className="px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-200">{formatINR(summary.subtotal)}</span>
        </div>


        {/* Discount */}
        {summary.discountAmount > 0 && (
          <div className="flex justify-between text-amber-400">
            <span className="flex items-center gap-1 font-medium">
              Discount {summary.billDiscountType === 'percent' && summary.billDiscountValue > 0 ? `(${summary.billDiscountValue}%)` : `(₹${summary.discountAmount.toFixed(2)})`}
              <button
                type="button"
                onClick={handleRemoveDiscount}
                className="text-[10px] text-rose-400 hover:text-rose-300 ml-1.5 cursor-pointer bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20"
                title="Remove discount"
              >
                ✕ Remove
              </button>
            </span>
            <span className="font-bold">-{formatINR(summary.discountAmount)}</span>
          </div>
        )}

        <div className="border-t border-slate-700/50 pt-2 flex justify-between items-baseline">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-100">Bill Total</span>
            <button
              type="button"
              onClick={() => {
                if (!isEditingBillAmount) {
                  setCustomBillAmount(String(effectivePayableAmount))
                }
                setIsEditingBillAmount(!isEditingBillAmount)
              }}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
              title="Set or edit payment amount shown on the bill"
            >
              <EditIcon size={11} /> {isEditingBillAmount ? 'Done' : 'Edit Amount'}
            </button>
            {customBillAmount !== '' && (
              <button
                type="button"
                onClick={() => {
                  setCustomBillAmount('')
                  setIsEditingBillAmount(false)
                }}
                className="text-[10px] text-slate-400 hover:text-slate-300 underline"
              >
                Reset
              </button>
            )}
          </div>

          {isEditingBillAmount ? (
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold text-lg">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customBillAmount}
                onChange={(e) => setCustomBillAmount(e.target.value)}
                className="w-28 px-2 py-1 rounded-lg bg-slate-800 border border-emerald-500 text-emerald-300 text-xl font-black text-right outline-none focus:ring-2 focus:ring-emerald-500/30"
                autoFocus
              />
            </div>
          ) : (
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 tabular-nums">
                {formatINR(effectivePayableAmount)}
              </span>
              {customBillAmount !== '' && Number(customBillAmount) !== summary.grandTotal && (
                <p className="text-[10px] text-amber-400 font-medium">Custom Bill Amount (Original: {formatINR(summary.grandTotal)})</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Discount & GST Controls ──────────────── */}
      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {/* Discount Button */}
        <button
          onClick={handleToggleDiscountInput}
          disabled={!canCheckout}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            summary.discountAmount > 0
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          <TagIcon className="w-4 h-4" /> {summary.discountAmount > 0 ? `Discount: -${formatINR(summary.discountAmount)}` : 'Add Discount'}
        </button>


        {/* Hold Button */}
        <button
          onClick={onHoldBill}
          disabled={!canCheckout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed relative"
          title="Hold Bill (F2)"
        >
          <PauseIcon className="w-4 h-4" /> Hold
          {heldBillsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[9px] font-bold">
              {heldBillsCount}
            </span>
          )}
        </button>

        {/* Recall Held Bills */}
        {heldBillsCount > 0 && (
          <button
            onClick={onShowHeldBills}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
          >
            <ClipboardIcon className="w-4 h-4" /> Recall ({heldBillsCount})
          </button>
        )}

        {/* Reprint */}
        <button
          onClick={onShowReprint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/40 text-slate-400 border border-slate-600/30 hover:bg-slate-700/60 hover:text-slate-300 transition-all"
          title="Reprint Previous Bill (F4)"
        >
          <PrinterIcon className="w-4 h-4" /> Reprint Receipts
        </button>
      </div>

      {/* Discount Input */}
      {showDiscountInput && (
        <div className="px-4 pb-3">
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5" /> Bill Discount Mode (छूट का तरीका)
              </span>
              <button
                type="button"
                onClick={() => setShowDiscountInput(false)}
                className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Quick:</span>
              <button
                type="button"
                onClick={() => handleApplyPresetDiscount('flat', 50)}
                className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 text-xs border border-slate-700 font-medium"
              >
                ₹50
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetDiscount('flat', 100)}
                className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 text-xs border border-slate-700 font-medium"
              >
                ₹100
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetDiscount('percent', 5)}
                className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 text-xs border border-slate-700 font-medium"
              >
                5%
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetDiscount('percent', 10)}
                className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700 text-xs border border-slate-700 font-medium"
              >
                10%
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold focus:outline-none focus:border-amber-500/50"
              >
                <option value="flat">₹ Fixed Amount</option>
                <option value="percent">% Percentage</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                max={discountType === 'percent' ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'flat' ? 'Discount in ₹ (e.g. 100)' : 'Discount in % (e.g. 10)'}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 font-semibold"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount() }}
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Payment Mode Buttons ─────────────────── */}
      <div className="px-4 pb-3 space-y-2">
        {!paymentMode ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setPaymentMode('cash'); setAmountTendered('') }}
              disabled={!canCheckout}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
              title="Cash Payment (F3)"
            >
              <CashIcon className="w-6 h-6 text-emerald-400" />
              <span className="text-xs mt-1">Cash</span>
              <span className="text-[9px] text-emerald-500/60">नकद</span>
            </button>
            <button
              onClick={() => setPaymentMode('upi')}
              disabled={!canCheckout}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <PhoneIcon className="w-6 h-6 text-violet-400" />
              <span className="text-xs mt-1">UPI</span>
              <span className="text-[9px] text-violet-500/60">यूपीआई</span>
            </button>
            <button
              onClick={handleOpenSplitModal}
              disabled={!canCheckout}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Cash + UPI Split Payment"
            >
              <div className="flex items-center gap-1">
                <CashIcon className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black text-cyan-300">+</span>
                <PhoneIcon className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs mt-1 font-bold">Cash+UPI</span>
              <span className="text-[9px] text-cyan-400/70">नकद + ऑनलाइन</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Payment Mode Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0">
                  {paymentMode === 'cash' ? (
                    <CashIcon className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <PhoneIcon className="w-5 h-5 text-violet-400" />
                  )}
                </span>
                <span className="text-sm font-bold text-slate-200 capitalize">{paymentMode} Payment</span>
              </div>
              <button
                onClick={() => setPaymentMode(null)}
                className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                ← Back
              </button>
            </div>

            {/* Cash: Amount Tendered */}
            {paymentMode === 'cash' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Amount Received (प्राप्त राशि):</span>
                </div>
                <input
                  type="number"
                  step="1"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder={`₹${Math.ceil(summary.grandTotal)}`}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-xl font-bold text-center placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePayment() }}
                />
                {/* Quick amount buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAmountTendered(String(amt))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 text-xs font-medium hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmountTendered(String(Math.ceil(effectivePayableAmount)))}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    Exact ₹{Math.ceil(effectivePayableAmount)}
                  </button>
                </div>
                {/* Change display */}
                {amountTendered && (
                  <div className={`p-3 rounded-xl text-center font-bold text-lg ${changeAmount >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                    {changeAmount >= 0
                      ? `Return Change: ${formatINR(changeAmount)} (वापसी)`
                      : `Short: ${formatINR(Math.abs(changeAmount))} (कम)`
                    }
                  </div>
                )}
              </div>
            )}

            {/* UPI: Confirmation */}
            {paymentMode === 'upi' && (
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-center space-y-2">
                <p className="text-3xl font-black text-violet-300">{formatINR(effectivePayableAmount)}</p>
                <p className="text-sm text-violet-400">Has the customer paid via UPI?</p>
                <p className="text-xs text-slate-500">क्या ग्राहक ने UPI से भुगतान किया?</p>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handlePayment}
              disabled={paymentMode === 'cash' && amountTendered && changeAmount < 0}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer
                ${paymentMode === 'cash'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-violet-500/20'
                }`}
            >
              <CheckCircleIcon className="w-6 h-6" /> Complete Sale — {formatINR(effectivePayableAmount)}
            </button>
          </div>
        )}
      </div>

      {/* ─── Cash + UPI Split Payment Modal Popup ─────────────────── */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowSplitModal(false)}>
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
                  <CashIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-cyan-300">+</span>
                  <PhoneIcon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Cash + UPI Split Payment</h3>
                  <p className="text-[11px] text-slate-400">नकद और ऑनलाइन यूपीआई दोनों से भुगतान</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSplit} className="p-6 space-y-4">
              {/* Grand Total Highlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Payable</span>
                  <p className="text-[11px] text-slate-500">कुल बिल राशि</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {formatINR(summary.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Input 1: Cash Amount */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CashIcon className="w-4 h-4" /> 1. Cash Collected (नकद राशि)
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">Cash received</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitCash}
                    onChange={(e) => handleCashChange(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-lg font-bold focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Input 2: Online / UPI Amount */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-violet-400">
                    <PhoneIcon className="w-4 h-4" /> 2. Online / UPI Pay (ऑनलाइन / UPI)
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">UPI paid</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={splitUpi}
                    onChange={(e) => handleUpiChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-950 border border-violet-500/40 text-violet-300 text-lg font-bold focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Quick Split Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const half = Number((summary.grandTotal / 2).toFixed(2))
                      setSplitCash(String(half))
                      setSplitUpi(String(Number((summary.grandTotal - half).toFixed(2))))
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    50% Cash / 50% UPI
                  </button>
                  {summary.grandTotal > 100 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSplitCash('100')
                        setSplitUpi(String(Math.max(0, Number((summary.grandTotal - 100).toFixed(2)))))
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      ₹100 Cash + Rest UPI
                    </button>
                  )}
                  {summary.grandTotal > 500 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSplitCash('500')
                        setSplitUpi(String(Math.max(0, Number((summary.grandTotal - 500).toFixed(2)))))
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      ₹500 Cash + Rest UPI
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSplitCash(String(summary.grandTotal.toFixed(2)))
                      setSplitUpi('0')
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    All Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitCash('0')
                      setSplitUpi(String(summary.grandTotal.toFixed(2)))
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    All UPI
                  </button>
                </div>
              </div>

              {/* Live Summary Calculation & Match Indicator */}
              {(() => {
                const cashNum = parseFloat(splitCash) || 0
                const upiNum = parseFloat(splitUpi) || 0
                const totalCollected = Number((cashNum + upiNum).toFixed(2))
                const diff = Number((totalCollected - summary.grandTotal).toFixed(2))

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs text-slate-300 font-semibold">
                      <span>Cash: ₹{cashNum.toFixed(2)} + UPI: ₹{upiNum.toFixed(2)}</span>
                      <span className="text-slate-100 font-bold">Total: ₹{totalCollected.toFixed(2)}</span>
                    </div>

                    {diff === 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Exact bill amount matched! (पूरा हिसाब बराबर)</span>
                      </div>
                    )}
                    {diff > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <span>Extra Cash Received (वापसी):</span>
                        <span>Return Change: ₹{diff.toFixed(2)}</span>
                      </div>
                    )}
                    {diff < 0 && (
                      <div className="flex items-center justify-between text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                        <span>Shortfall (कम राशि):</span>
                        <span>Short by: ₹{Math.abs(diff).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancel (रद्द करें)
                </button>
                <button
                  type="submit"
                  disabled={(parseFloat(splitCash) || 0) + (parseFloat(splitUpi) || 0) <= 0}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircleIcon className="w-4 h-4" /> Confirm & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
