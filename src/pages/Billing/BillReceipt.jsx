import { useRef, useState } from 'react'
import { formatINR, getSavedBills } from '../../hooks/posData'
import { FaReceipt as ReceiptIcon, FaPrint as PrinterIcon, FaCheckCircle as CheckCircleIcon } from 'react-icons/fa'

// ─── Bill Receipt Component (Print & Reprint) ───────────────────
export function ReceiptPreview({ bill, onClose, onPrint }) {
  const receiptRef = useRef(null)

  const handlePrint = () => {
    // Create print window for thermal receipt
    const printWindow = window.open('', '_blank', 'width=320,height=600')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill ${bill.billNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-weight: bold !important;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            line-height: 1.3;
            width: 80mm;
            padding: 4mm;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold !important; }
          .separator { border-top: 2px dashed #000; margin: 6px 0; }
          .double-separator { border-top: 3px double #000; margin: 6px 0; }
          .shop-name { font-size: 20px; font-weight: 900 !important; }
          .item-row { display: flex; justify-content: space-between; padding: 2px 0; }
          .item-name { flex: 1; }
          .item-qty { width: 60px; text-align: center; }
          .item-amount { width: 70px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-weight: bold !important; }
          .grand-total { font-size: 18px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin-top: 4px; }
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 4mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="shop-name">GUPTA TRADERS</div>
          <div>General Store & Provisions</div>
          <div>Main Market Road, City</div>
          <div>GSTIN: 09XXXXXXXXXXXXXXX</div>
          <div>Ph: 9876543210</div>
        </div>
        <div class="separator"></div>
        <div class="item-row">
          <span>Bill No: ${bill.billNumber}</span>
          <span>${new Date(bill.timestamp).toLocaleDateString('en-IN')}</span>
        </div>
        <div class="item-row">
          <span>Time: ${new Date(bill.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>Mode: ${bill.paymentMode.toUpperCase()}</span>
        </div>
        ${bill.customerName ? `<div>Customer: ${bill.customerName}</div>` : ''}
        <div class="double-separator"></div>
        <div class="item-row bold">
          <span class="item-name">Item</span>
          <span class="item-qty">Qty</span>
          <span class="item-amount">Amount</span>
        </div>
        <div class="separator"></div>
        ${bill.items.map(item => `
          <div class="item-row">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">${item.quantity}${item.unit !== 'pcs' ? item.unit : ''}</span>
            <span class="item-amount">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.itemDiscount > 0 ? `<div class="item-row"><span class="item-name" style="padding-left:10px;font-size:10px">Disc: -${item.itemDiscount.toFixed(2)}</span><span></span><span></span></div>` : ''}
        `).join('')}
        <div class="double-separator"></div>
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${bill.summary.subtotal.toFixed(2)}</span>
        </div>
        ${bill.summary.totalGST > 0 ? `
          <div class="item-row">
            <span>CGST:</span>
            <span>${bill.summary.totalCGST.toFixed(2)}</span>
          </div>
          <div class="item-row">
            <span>SGST:</span>
            <span>${bill.summary.totalSGST.toFixed(2)}</span>
          </div>
        ` : ''}
        ${bill.summary.discountAmount > 0 ? `
          <div class="item-row">
            <span>Discount:</span>
            <span>-${bill.summary.discountAmount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="separator"></div>
        <div class="total-row grand-total center">
          <span>TOTAL:</span>
          <span>Rs. ${bill.summary.grandTotal.toFixed(2)}</span>
        </div>
        <div class="separator"></div>
        ${bill.paymentMode === 'cash' && bill.amountPaid ? `
          <div class="item-row">
            <span>Paid:</span>
            <span>${bill.amountPaid.toFixed(2)}</span>
          </div>
          <div class="item-row bold">
            <span>Change:</span>
            <span>${(bill.amountPaid - bill.summary.grandTotal).toFixed(2)}</span>
          </div>
          <div class="separator"></div>
        ` : ''}
        <div class="center" style="margin-top: 8px;">
          <div class="bold">Thank You! Visit Again!</div>
          <div>धन्यवाद! फिर आना!</div>
          <div style="margin-top: 4px; font-size: 10px;">Items: ${bill.items.length} | Qty: ${bill.items.reduce((s, i) => s + i.quantity, 0)}</div>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    if (onPrint) onPrint()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <ReceiptIcon className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">Receipt Preview</h3>
              <p className="text-xs text-slate-500">{bill.billNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="px-6 py-4 font-mono text-xs space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* Shop Header */}
          <div className="text-center space-y-0.5">
            <p className="text-lg font-bold text-slate-100">GUPTA TRADERS</p>
            <p className="text-slate-400">General Store & Provisions</p>
            <p className="text-slate-500">Main Market Road, City</p>
            <p className="text-slate-500">GSTIN: 09XXXXXXXXXXXXXXX</p>
          </div>

          <div className="border-t border-dashed border-slate-700/60" />

          {/* Bill Info */}
          <div className="flex justify-between text-slate-400">
            <span>Bill: {bill.billNumber}</span>
            <span>{new Date(bill.timestamp).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Time: {new Date(bill.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="capitalize">Mode: {bill.paymentMode}</span>
          </div>
          {bill.customerName && (
            <p className="text-slate-400">Customer: {bill.customerName}</p>
          )}

          <div className="border-t-2 border-slate-700/60" />

          {/* Items */}
          <div className="space-y-1.5">
            {bill.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="text-slate-200 flex-1 truncate">{item.name}</span>
                  <span className="text-slate-400 w-12 text-center">{item.quantity}</span>
                  <span className="text-slate-200 w-16 text-right">{formatINR(item.price * item.quantity)}</span>
                </div>
                {item.itemDiscount > 0 && (
                  <p className="text-amber-400/70 pl-4 text-[10px]">Disc: -{formatINR(item.itemDiscount * item.quantity)}</p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t-2 border-slate-700/60" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal</span>
              <span>{formatINR(bill.summary.subtotal)}</span>
            </div>
            {bill.summary.totalGST > 0 && (
              <>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>CGST</span>
                  <span>{formatINR(bill.summary.totalCGST)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>SGST</span>
                  <span>{formatINR(bill.summary.totalSGST)}</span>
                </div>
              </>
            )}
            {bill.summary.discountAmount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Discount</span>
                <span>-{formatINR(bill.summary.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-slate-700/60" />
            <div className="flex justify-between text-lg font-bold text-emerald-400">
              <span>TOTAL</span>
              <span>{formatINR(bill.summary.grandTotal)}</span>
            </div>
          </div>

          {bill.paymentMode === 'cash' && bill.amountPaid && (
            <>
              <div className="border-t border-dashed border-slate-700/60" />
              <div className="flex justify-between text-slate-300">
                <span>Paid</span>
                <span>{formatINR(bill.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-200">
                <span>Change</span>
                <span>{formatINR(bill.amountPaid - bill.summary.grandTotal)}</span>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-slate-700/60" />

          {/* Footer */}
          <div className="text-center space-y-0.5 pt-1 pb-2">
            <p className="font-bold text-slate-200">Thank You! Visit Again!</p>
            <p className="text-slate-400">धन्यवाद! फिर आना!</p>
            <p className="text-slate-600 text-[10px] mt-1">
              Items: {bill.items.length} | Qty: {bill.items.reduce((s, i) => s + i.quantity, 0)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-800/60 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <PrinterIcon className="w-5 h-5" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium text-sm hover:bg-slate-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reprint Bills List ──────────────────────────────────────────
export function ReprintDrawer({ onClose, onSelectBill }) {
  const [bills] = useState(() => getSavedBills())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <PrinterIcon className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">Reprint Bill (बिल दोबारा प्रिंट करें)</h3>
              <p className="text-xs text-slate-500">Select a bill to reprint</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bills List */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {bills.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-500 mb-3 opacity-40 flex justify-center">
                <ReceiptIcon className="w-12 h-12" />
              </div>
              <p className="text-slate-400 font-medium">No previous bills found</p>
              <p className="text-slate-500 text-xs mt-1">Complete a sale to see bills here</p>
            </div>
          ) : (
            bills.map((bill) => (
              <button
                key={bill.billNumber}
                onClick={() => onSelectBill(bill)}
                className="w-full text-left px-6 py-4 border-b border-slate-800/30 hover:bg-slate-800/30 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-200 font-mono">{bill.billNumber}</span>
                  <span className="text-lg font-bold text-emerald-400">{formatINR(bill.summary.grandTotal)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    {new Date(bill.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize
                    ${bill.paymentMode === 'cash' ? 'bg-emerald-500/10 text-emerald-400'
                      : bill.paymentMode === 'upi' ? 'bg-violet-500/10 text-violet-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    {bill.paymentMode}
                  </span>
                  <span>{bill.items.length} items</span>
                  {bill.customerName && <span>• {bill.customerName}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sale Success Animation ──────────────────────────────────────
export function SaleSuccessOverlay({ bill, onDone }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="text-center space-y-4 animate-scaleIn">
        <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
          <CheckCircleIcon className="w-16 h-16 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black text-emerald-400">Sale Complete!</h2>
        <p className="text-xl font-bold text-slate-200">{formatINR(bill.summary.grandTotal)}</p>
        <p className="text-sm text-slate-400">
          Bill #{bill.billNumber} •{' '}
          <span className="capitalize">{bill.paymentMode} Payment</span>
        </p>
        <p className="text-xs text-slate-500">बिक्री सफल! धन्यवाद!</p>
        <button
          onClick={onDone}
          className="mt-4 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
        >
          ✨ Next Customer — New Bill
        </button>
      </div>
    </div>
  )
}
