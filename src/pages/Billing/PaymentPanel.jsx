import { useState } from 'react'
import { formatINR, calculateBillSummary } from '../../utils/erp'
import {
  FaTag as TagIcon,
  FaChartBar as ChartIcon,
  FaPause as PauseIcon,
  FaClipboard as ClipboardIcon,
  FaPrint as PrinterIcon,
  FaMoneyBillWave as CashIcon,
  FaMobileAlt as PhoneIcon,
  FaCreditCard as CreditCardIcon,
  FaCheckCircle as CheckCircleIcon,
} from 'react-icons/fa'

// ─── Payment Panel Component ─────────────────────────────────────
export default function PaymentPanel({
  cartItems,
  billDiscount,
  onBillDiscountChange,
  isGSTInclusive,
  onToggleGSTMode,
  onCompleteSale,
  onHoldBill,
  heldBillsCount,
  onShowHeldBills,
  onShowReprint,
}) {
  const [paymentMode, setPaymentMode] = useState(null) // 'cash' | 'upi' | 'card'
  const [amountTendered, setAmountTendered] = useState('')
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [discountType, setDiscountType] = useState('flat') // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState('')

  const summary = calculateBillSummary(cartItems, billDiscount, isGSTInclusive)
  const canCheckout = cartItems.length > 0

  // Quick cash amounts for faster billing
  const quickAmounts = [50, 100, 200, 500, 1000, 2000]
  const changeAmount = amountTendered ? parseFloat(amountTendered) - summary.grandTotal : 0

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
    onCompleteSale(paymentMode, paymentMode === 'cash' ? parseFloat(amountTendered) || summary.grandTotal : summary.grandTotal)
    setPaymentMode(null)
    setAmountTendered('')
  }

  return (
    <div className="flex flex-col border-t border-slate-700/60 bg-slate-900/80">
      {/* ─── Bill Summary ──────────────────────────── */}
      <div className="px-4 py-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-200">{formatINR(summary.subtotal)}</span>
        </div>

        {/* GST Breakdown */}
        {summary.totalGST > 0 && (
          <>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>{isGSTInclusive ? 'CGST (Included)' : 'CGST'}</span>
              <span>{formatINR(summary.totalCGST)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>{isGSTInclusive ? 'SGST (Included)' : 'SGST'}</span>
              <span>{formatINR(summary.totalSGST)}</span>
            </div>
          </>
        )}

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
          <span className="text-lg font-bold text-slate-100">Grand Total</span>
          <span className="text-2xl font-black text-emerald-400 tabular-nums">{formatINR(summary.grandTotal)}</span>
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

        {/* GST Toggle */}
        <button
          onClick={onToggleGSTMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
        >
          <ChartIcon className="w-4 h-4" /> GST: {isGSTInclusive ? 'Inclusive' : 'Exclusive'}
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
              onClick={() => setPaymentMode('card')}
              disabled={!canCheckout}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <CreditCardIcon className="w-6 h-6 text-blue-400" />
              <span className="text-xs mt-1">Card</span>
              <span className="text-[9px] text-blue-500/60">कार्ड</span>
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
                  ) : paymentMode === 'upi' ? (
                    <PhoneIcon className="w-5 h-5 text-violet-400" />
                  ) : (
                    <CreditCardIcon className="w-5 h-5 text-blue-400" />
                  )}
                </span>
                <span className="text-sm font-bold text-slate-200 capitalize">{paymentMode} Payment</span>
              </div>
              <button
                onClick={() => setPaymentMode(null)}
                className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-800/40 transition-all"
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
                      className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 text-xs font-medium hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmountTendered(String(Math.ceil(summary.grandTotal)))}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                  >
                    Exact ₹{Math.ceil(summary.grandTotal)}
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
                <p className="text-3xl font-black text-violet-300">{formatINR(summary.grandTotal)}</p>
                <p className="text-sm text-violet-400">Has the customer paid via UPI?</p>
                <p className="text-xs text-slate-500">क्या ग्राहक ने UPI से भुगतान किया?</p>
              </div>
            )}

            {/* Card: Confirmation */}
            {paymentMode === 'card' && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center space-y-2">
                <p className="text-3xl font-black text-blue-300">{formatINR(summary.grandTotal)}</p>
                <p className="text-sm text-blue-400">Has the card payment been approved?</p>
                <p className="text-xs text-slate-500">क्या कार्ड पेमेंट स्वीकृत हुआ?</p>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handlePayment}
              disabled={paymentMode === 'cash' && amountTendered && changeAmount < 0}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2
                ${paymentMode === 'cash'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20'
                  : paymentMode === 'upi'
                    ? 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-violet-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/20'
                }`}
            >
              <CheckCircleIcon className="w-6 h-6" /> Complete Sale — {formatINR(summary.grandTotal)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
