import { useEffect, useRef, useState } from 'react'
import { formatINR } from '../../utils/erp'
import { listUISales, subscribeToTable } from '../../services/erpService'
import { FaReceipt as ReceiptIcon, FaPrint as PrinterIcon, FaCheckCircle as CheckCircleIcon } from 'react-icons/fa'

const mapUnitToShort = (unit) => {
  if (!unit) return '';
  const u = unit.toLowerCase().trim();
  if (u === 'piece' || u === 'pieces' || u === 'pcs' || u === 'pc') return 'pc';
  if (u === 'kilogram' || u === 'kilograms' || u === 'kg' || u === 'kgs') return 'kg';
  if (u === 'litre' || u === 'litres' || u === 'liter' || u === 'ltr' || u === 'ltrs') return 'L';
  if (u === 'millilitre' || u === 'millilitres' || u === 'ml') return 'Ml';
  if (u === 'gram' || u === 'grams' || u === 'gm' || u === 'gms' || u === 'g') return 'g';
  if (u === 'packet' || u === 'packets' || u === 'pkt' || u === 'pkts') return 'pkt';
  if (u === 'box' || u === 'boxes') return 'box';
  if (u === 'dozen' || u === 'dozens' || u === 'doz') return 'doz';
  return unit;
};

const escapeReceiptText = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// ─── Universal Bill Normalizer ────────────────────────────────────
export function normalizeBillData(rawBill) {
  if (!rawBill) return null;

  const billNumber = rawBill.billNumber || rawBill.invoice_number || rawBill.invoice || rawBill.billNo || rawBill.id || '—';
  const customerName = rawBill.customerName || (typeof rawBill.customer === 'string' ? rawBill.customer : rawBill.customer?.name) || rawBill.partyName || '';
  const paymentMode = String(rawBill.paymentMode || rawBill.payment_method || rawBill.paymentMethod || rawBill.payment || 'cash');
  const amountPaid = Number(rawBill.amountPaid ?? rawBill.paid_amount ?? rawBill.paidAmount ?? rawBill.paid ?? 0);

  const rawDate = rawBill.timestamp || rawBill.sale_date || rawBill.date || rawBill.createdAt || rawBill.created_at;
  const timestamp = rawDate ? new Date(rawDate) : new Date();

  const rawItems = Array.isArray(rawBill.items) ? rawBill.items
    : Array.isArray(rawBill.cart) ? rawBill.cart
      : Array.isArray(rawBill.products) ? rawBill.products
        : [];

  const items = rawItems.map((item, idx) => {
    const name = item.name || item.product_name || item.product || item.title || item.itemName || `Item #${idx + 1}`;
    const quantity = Number(item.quantity ?? item.qty ?? item.originalQuantity ?? 1);
    const price = Number(item.price ?? item.salesPrice ?? item.selling_price ?? item.sellingPrice ?? item.unit_price ?? item.unitPrice ?? item.rate ?? 0);
    const unit = item.unit || item.loose_unit || item.looseUnit || '';
    const itemDiscount = Number(item.itemDiscount ?? item.discount ?? item.discount_percent ?? item.item_discount_percent ?? 0);
    const lineTotal = Number(item.line_total ?? item.total ?? (price * quantity * (1 - itemDiscount / 100)));

    const returnedQuantity = Number(item.returnedQuantity ?? (item.returns || []).reduce((sum, r) => sum + Number(r.quantity || 0), 0) ?? 0);
    const returnableQuantity = Math.max(0, quantity - returnedQuantity);
    const isReturned = returnedQuantity > 0 && returnableQuantity === 0;
    const isPartiallyReturned = returnedQuantity > 0 && returnableQuantity > 0;

    return {
      ...item,
      name,
      quantity,
      price,
      unit,
      itemDiscount,
      lineTotal,
      returnedQuantity,
      returnableQuantity,
      isReturned,
      isPartiallyReturned,
    };
  });

  const rawSummary = rawBill.summary || rawBill.totals || {};
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = Number(rawSummary.subtotal ?? rawBill.subtotal ?? calculatedSubtotal);
  const totalGST = Number(rawSummary.totalGST ?? rawSummary.gst ?? rawBill.tax_amount ?? rawBill.gst ?? rawBill.tax ?? 0);
  const totalCGST = Number(rawSummary.totalCGST ?? rawBill.cgst ?? (totalGST / 2));
  const totalSGST = Number(rawSummary.totalSGST ?? rawBill.sgst ?? (totalGST / 2));
  const discountAmount = Number(rawSummary.discountAmount ?? rawBill.discount ?? 0);
  const grandTotal = Number(rawSummary.grandTotal ?? rawBill.total_amount ?? rawBill.total ?? Math.max(0, subtotal + totalGST - discountAmount));

  const itemSavings = items.reduce((sum, item) => sum + (item.price * item.quantity * item.itemDiscount / 100), 0);
  const totalSavings = itemSavings + discountAmount;

  const returns = rawBill.returns || [];
  const totalRefunded = Number(rawBill.totalRefunded ?? returns.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) ?? 0);
  const hasReturns = totalRefunded > 0 || returns.length > 0 || items.some(i => i.returnedQuantity > 0);

  return {
    ...rawBill,
    billNumber,
    customerName,
    paymentMode,
    amountPaid,
    timestamp,
    items,
    summary: {
      subtotal,
      totalGST,
      totalCGST,
      totalSGST,
      discountAmount,
      grandTotal,
    },
    totalSavings,
    returns,
    totalRefunded,
    hasReturns,
    netTotalAfterReturns: Math.max(0, grandTotal - totalRefunded),
  };
}

// ─── Generate Bulletproof Thermal Receipt HTML ────────────────────
export function generateReceiptHtml(bill) {
  const norm = normalizeBillData(bill);
  if (!norm) return '';

  const items = norm.items;
  const summary = norm.summary;
  const timestamp = norm.timestamp;
  const totalSavings = norm.totalSavings;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Receipt ${escapeReceiptText(norm.billNumber)}</title>
  <style>
    :root {
      color-scheme: light !important;
    }
    @page {
      margin: 0;
      size: auto;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      color-scheme: light !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, monospace;
      font-size: 13px;
      font-weight: 800;
      line-height: 1.35;
      width: 100%;
      max-width: 78mm;
      margin: 0 auto;
      padding: 6px 8px;
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 900; }
    .separator { border-top: 2px dashed #000000 !important; margin: 5px 0; }
    .double-separator { border-top: 2px solid #000000 !important; margin: 5px 0; }
    .shop-name { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #000000 !important; }
    .shop-sub { font-size: 12px; margin-top: 1px; color: #000000 !important; font-weight: 700; }

    table.meta-table, table.items-table, table.totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      color: #000000 !important;
    }
    table.meta-table td {
      padding: 2px 0;
      color: #000000 !important;
      font-weight: 800;
    }
    table.items-table th {
      border-top: 2px solid #000000 !important;
      border-bottom: 2px solid #000000 !important;
      padding: 4px 0;
      font-size: 12px;
      font-weight: 900;
      color: #000000 !important;
    }
    table.items-table td {
      padding: 3px 0;
      vertical-align: top;
      font-size: 12px;
      color: #000000 !important;
      font-weight: 800;
    }
    .item-name-cell {
      word-break: break-word;
      overflow-wrap: break-word;
      padding-right: 4px;
      font-weight: 900;
      color: #000000 !important;
    }
    table.totals-table td {
      padding: 2px 0;
      color: #000000 !important;
      font-weight: 800;
    }
    .grand-total-row td {
      font-size: 16px;
      font-weight: 900;
      color: #000000 !important;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      * {
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        width: 100%;
        max-width: 78mm;
        background: #ffffff !important;
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #fef2f2; border: 1px solid #f87171; padding: 10px; text-align: center; border-radius: 8px; margin-bottom: 12px; font-family: sans-serif;">
    <button onclick="window.print()" style="background: #059669; color: #ffffff; border: none; padding: 10px 24px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
      🖨️ Click Here to Print (प्रिंट करें)
    </button>
    <div style="font-size: 11px; color: #991b1b; margin-top: 6px; font-weight: 600;">
      ⚠️ Note: If paper comes out blank/white, flip your thermal paper roll upside down.
    </div>
  </div>

  <div class="center">
    <div class="shop-name">GUPTA TRADERS</div>
    <div class="shop-sub">General Store & Provisions</div>
    <div class="shop-sub">Main Market Road, City</div>
    <div class="shop-sub">GSTIN: 09XXXXXXXXXXXXXXX</div>
    <div class="shop-sub">Ph: 9876543210</div>
  </div>

  <div class="separator"></div>

  <table class="meta-table">
    <tr>
      <td style="text-align: left;">Bill No: ${escapeReceiptText(norm.billNumber)}</td>
      <td style="text-align: right;">${timestamp.toLocaleDateString('en-IN')}</td>
    </tr>
    <tr>
      <td style="text-align: left;">Time: ${timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
      <td style="text-align: right;">Mode: ${escapeReceiptText(norm.paymentMode.toUpperCase())}</td>
    </tr>
    ${norm.customerName ? `
    <tr>
      <td colspan="2" style="text-align: left; padding-top: 2px;">Customer: ${escapeReceiptText(norm.customerName)}</td>
    </tr>` : ''}
  </table>

  <div class="separator"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align: left;">Item</th>
        <th style="text-align: center; width: 48px;">Qty</th>
        <th style="text-align: right; width: 68px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td class="item-name-cell" style="text-align: left;">
            ${escapeReceiptText(item.name)}
            ${item.itemDiscount > 0 ? `<div style="font-size: 10px; font-weight: normal; color: #000000 !important;">Disc: -${(item.price * item.quantity * item.itemDiscount / 100).toFixed(2)}</div>` : ''}
            ${item.returnedQuantity > 0 ? `
              <div style="font-size: 10px; font-weight: 900; color: #b91c1c !important;">
                [TAKEN BACK: -${item.returnedQuantity}${escapeReceiptText(mapUnitToShort(item.unit))}]
                ${item.returnableQuantity > 0 ? `(Bal: ${item.returnableQuantity})` : '(FULL RETURN)'}
              </div>
            ` : ''}
          </td>
          <td style="text-align: center; white-space: nowrap;">
            ${item.quantity}${escapeReceiptText(mapUnitToShort(item.unit))}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="double-separator"></div>

  <table class="totals-table">
    <tr>
      <td style="text-align: left;">Subtotal:</td>
      <td style="text-align: right;">${summary.subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="text-align: left;">CGST:</td>
      <td style="text-align: right;">${summary.totalCGST.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="text-align: left;">SGST:</td>
      <td style="text-align: right;">${summary.totalSGST.toFixed(2)}</td>
    </tr>
    ${summary.discountAmount > 0 ? `
    <tr>
      <td style="text-align: left;">Discount:</td>
      <td style="text-align: right;">-${summary.discountAmount.toFixed(2)}</td>
    </tr>` : ''}
  </table>

  <div class="separator"></div>

  <table class="totals-table grand-total-row">
    <tr>
      <td style="text-align: left;">TOTAL:</td>
      <td style="text-align: right;">Rs. ${summary.grandTotal.toFixed(2)}</td>
    </tr>
  </table>

  ${norm.hasReturns ? `
    <div class="separator"></div>
    <table class="totals-table">
      <tr style="font-weight: 900; color: #b91c1c !important;">
        <td style="text-align: left;">RETURNED / REFUNDED:</td>
        <td style="text-align: right;">-Rs. ${norm.totalRefunded.toFixed(2)}</td>
      </tr>
      <tr style="font-weight: 900; font-size: 14px;">
        <td style="text-align: left;">ADJUSTED NET TOTAL:</td>
        <td style="text-align: right;">Rs. ${norm.netTotalAfterReturns.toFixed(2)}</td>
      </tr>
    </table>
  ` : ''}

  <div class="separator"></div>

  ${totalSavings > 0 ? `
    <div class="center bold" style="margin: 5px 0; font-size: 11px; border: 1.5px dashed #000000; padding: 4px; text-transform: uppercase;">
      *** YOU SAVED Rs. ${totalSavings.toFixed(2)} ON THIS PURCHASE ***
    </div>
    <div class="separator"></div>
  ` : ''}

  ${norm.paymentMode.toLowerCase() === 'cash' && norm.amountPaid > 0 ? `
    <table class="totals-table">
      <tr>
        <td style="text-align: left;">Paid:</td>
        <td style="text-align: right;">${norm.amountPaid.toFixed(2)}</td>
      </tr>
      <tr style="font-weight: bold;">
        <td style="text-align: left;">Change:</td>
        <td style="text-align: right;">${Math.max(0, norm.amountPaid - summary.grandTotal).toFixed(2)}</td>
      </tr>
    </table>
    <div class="separator"></div>
  ` : ''}

  <div class="separator"></div>

  <div class="center" style="margin: 6px 0; border: 1.5px solid #000000; padding: 4px 2px; font-weight: 900; font-size: 10px; text-transform: uppercase;">
    Products sold can be returned within 7 days of purchase.
  </div>
  <div class="center" style="font-size: 9px; margin-top: 1px; font-weight: 700;">
    (बिका हुआ सामान 7 दिनों के भीतर वापस हो सकता है)
  </div>

  <div class="center" style="margin-top: 6px;">
    <div class="bold">Thank You! Visit Again!</div>
    <div>धन्यवाद! फिर आना!</div>
    <div style="margin-top: 3px; font-size: 10px;">Items: ${items.length} | Total Qty: ${items.reduce((s, i) => s + Number(i.quantity || 0), 0)}</div>
  </div>
</body>
</html>`;
}

// ─── Reliable Thermal Print Execution ────────────────────────────
export function printThermalReceipt(bill, onPrint) {
  const norm = normalizeBillData(bill);
  if (!norm) return;

  const html = generateReceiptHtml(norm);

  // Open dedicated clean thermal print popup window
  const printWindow = window.open('', '_blank', 'width=420,height=720,menubar=no,toolbar=no,location=no,status=no');

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const doPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
        if (onPrint) onPrint();
      } catch (err) {
        console.warn('Print window error:', err);
      }
    };

    if (printWindow.document.readyState === 'complete') {
      setTimeout(doPrint, 350);
    } else {
      printWindow.onload = () => setTimeout(doPrint, 350);
    }
  } else {
    // Popup was blocked by browser
    window.alert('Please allow pop-ups for this site so the receipt window can open and print.');
  }
}

// ─── Bill Receipt Component (Print & Reprint) ───────────────────
export function ReceiptPreview({ bill, onClose, onPrint }) {
  const receiptRef = useRef(null);
  const norm = normalizeBillData(bill);

  if (!norm) return null;

  const handlePrint = () => {
    printThermalReceipt(norm, onPrint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-colors" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden transition-colors" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <ReceiptIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Receipt Preview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{norm.billNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="px-6 py-4 font-mono text-xs font-bold space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* Shop Header */}
          <div className="text-center space-y-0.5">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">GUPTA TRADERS</p>
            <p className="text-slate-600 dark:text-slate-400">General Store & Provisions</p>
            <p className="text-slate-500 dark:text-slate-500">Main Market Road, City</p>
            <p className="text-slate-500 dark:text-slate-500">GSTIN: 09XXXXXXXXXXXXXXX</p>
          </div>

          <div className="border-t border-dashed border-slate-300 dark:border-slate-700/60" />

          {/* Bill Info */}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Bill: {norm.billNumber}</span>
            <span>{norm.timestamp.toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Time: {norm.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="capitalize">Mode: {norm.paymentMode}</span>
          </div>
          {norm.customerName && (
            <p className="text-slate-600 dark:text-slate-400">Customer: {norm.customerName}</p>
          )}

          <div className="border-t-2 border-slate-300 dark:border-slate-700/60" />

          {/* Items */}
          <div className="space-y-1.5">
            {norm.items.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="text-slate-800 dark:text-slate-200 flex-1 break-words whitespace-normal">{item.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 w-12 text-center">{item.quantity}{mapUnitToShort(item.unit)}</span>
                  <span className="text-slate-900 dark:text-slate-200 w-16 text-right">{formatINR(item.price * item.quantity)}</span>
                </div>
                {item.itemDiscount > 0 && (
                  <p className="text-amber-600 dark:text-amber-400/70 pl-4 text-[10px]">Disc: -{formatINR(item.price * item.quantity * item.itemDiscount / 100)}</p>
                )}
                {item.returnedQuantity > 0 && (
                  <div className="text-rose-600 dark:text-rose-400 pl-4 text-[10px] font-bold">
                    [TAKEN BACK: -{item.returnedQuantity}{mapUnitToShort(item.unit)}] {item.returnableQuantity > 0 ? `(Bal: ${item.returnableQuantity})` : '(FULL RETURN)'}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t-2 border-slate-300 dark:border-slate-700/60" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Subtotal</span>
              <span>{formatINR(norm.summary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-500 text-[10px]">
              <span>CGST</span>
              <span>{formatINR(norm.summary.totalCGST)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-500 text-[10px]">
              <span>SGST</span>
              <span>{formatINR(norm.summary.totalSGST)}</span>
            </div>
            {norm.summary.discountAmount > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Discount</span>
                <span>-{formatINR(norm.summary.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-slate-300 dark:border-slate-700/60" />
            <div className="flex justify-between text-lg font-bold text-emerald-600 dark:text-emerald-400">
              <span>TOTAL</span>
              <span>{formatINR(norm.summary.grandTotal)}</span>
            </div>
            {norm.hasReturns && (
              <>
                <div className="border-t border-dashed border-rose-300 dark:border-rose-900/60" />
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                  <span>Refunded / Taken Back</span>
                  <span>-{formatINR(norm.totalRefunded)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-slate-100">
                  <span>Adjusted Net Total</span>
                  <span>{formatINR(norm.netTotalAfterReturns)}</span>
                </div>
              </>
            )}
            {norm.totalSavings > 0 && (
              <div className="mt-2 text-center py-1.5 px-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg border border-dashed border-emerald-500/30 text-xs">
                🎉 You saved an amount of {formatINR(norm.totalSavings)} on this purchase!
              </div>
            )}
          </div>

          {norm.paymentMode.toLowerCase() === 'cash' && norm.amountPaid > 0 && (
            <>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700/60" />
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Paid</span>
                <span>{formatINR(norm.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Change</span>
                <span>{formatINR(Math.max(0, norm.amountPaid - norm.summary.grandTotal))}</span>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-slate-300 dark:border-slate-700/60" />

          {/* Footer */}
          <div className="text-center space-y-1 pt-1 pb-2">
            <div className="my-2 p-1.5 border border-slate-900 dark:border-slate-300 text-center font-bold text-[10px] uppercase tracking-wide">
              Products sold can be returned within 7 days of purchase.
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400">(बिका हुआ सामान 7 दिनों के भीतर वापस हो सकता है)</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">Thank You! Visit Again!</p>
            <p className="text-slate-600 dark:text-slate-400">धन्यवाद! फिर आना!</p>
            <p className="text-slate-400 dark:text-slate-600 text-[10px] mt-1">
              Items: {norm.items.length} | Qty: {norm.items.reduce((s, i) => s + Number(i.quantity || 0), 0)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/60 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <PrinterIcon className="w-5 h-5" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium text-sm transition-all"
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
  const [bills, setBills] = useState([])
  useEffect(() => { const load = () => listUISales().then(rows => setBills(rows.map(normalizeBillData))).catch(console.error); load(); return subscribeToTable('sales', load) }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm transition-colors" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden transition-colors" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <PrinterIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reprint Bill (बिल दोबारा प्रिंट करें)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select a bill to reprint</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bills List */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {bills.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-3 opacity-40 flex justify-center">
                <ReceiptIcon className="w-12 h-12" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">No previous bills found</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Complete a sale to see bills here</p>
            </div>
          ) : (
            bills.map((bill) => (
              <button
                key={bill.billNumber}
                onClick={() => onSelectBill(bill)}
                className="w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{bill.billNumber}</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatINR(bill.summary.grandTotal)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {new Date(bill.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize
                    ${bill.paymentMode === 'cash' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : bill.paymentMode === 'upi' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
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
      export function SaleSuccessOverlay({bill, onDone}) {
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn transition-all p-4">
        {/* Centered Solid Card Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl animate-scaleIn transition-all">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-pulse">
            <CheckCircleIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Sale Complete!</h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {formatINR(bill.summary.grandTotal)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Bill #{bill.billNumber} •{' '}
              <span className="capitalize">{bill.paymentMode} Payment</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">bikli safal! Dhanyawad!</p>
          </div>

          <button
            onClick={onDone}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
          >
            ✨ Next Customer — New Bill
          </button>
        </div>
      </div>
  )
}

// ─── Generate Thermal Return & Refund Slip HTML ─────────────────────
export function generateReturnReceiptHtml(returnData) {
  if (!returnData) return '';
  const returnNo = escapeReceiptText(returnData.return_number || returnData.returnNo || 'SR-000');
  const invoiceNo = escapeReceiptText(returnData.sale?.invoice_number || returnData.invoice_number || returnData.invoiceNo || '—');
  const customerName = escapeReceiptText(returnData.customer?.name || returnData.customerName || 'Walk-in Customer');
  const refundMethod = escapeReceiptText(returnData.refund_method || returnData.refundMethod || 'Cash').toUpperCase();
  const reason = escapeReceiptText(returnData.reason || 'Customer Return');
  const rawDate = returnData.return_date || returnData.created_at;
  const returnDate = rawDate ? new Date(rawDate) : new Date();
  const totalAmount = Number(returnData.total_amount ?? returnData.total ?? 0);
  const items = Array.isArray(returnData.items) ? returnData.items : [];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="light" />
  <title>Return Voucher ${returnNo}</title>
  <style>
    @page { margin: 0; size: auto; }
    * { margin: 0; padding: 0; box-sizing: border-box; color: #000000 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      background: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      font-size: 13px; font-weight: 800; line-height: 1.35; width: 100%; max-width: 78mm; margin: 0 auto; padding: 6px 8px;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 900; }
    .separator { border-top: 2px dashed #000000 !important; margin: 5px 0; }
    .double-separator { border-top: 2px solid #000000 !important; margin: 5px 0; }
    .shop-name { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
    .voucher-title { font-size: 12px; font-weight: 900; margin-top: 4px; border: 1.5px solid #000000; padding: 2px 6px; display: inline-block; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    table td, table th { padding: 2px 0; }
    table.items-table th { border-top: 2px solid #000000 !important; border-bottom: 2px solid #000000 !important; padding: 4px 0; font-size: 11px; }
    table.items-table td { padding: 3px 0; vertical-align: top; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="background: #fff1f2; border: 1px solid #fda4af; padding: 8px; text-align: center; border-radius: 6px; margin-bottom: 10px; font-family: sans-serif;">
    <button onclick="window.print()" style="background: #e11d48; color: #ffffff; border: none; padding: 8px 18px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px;">
      🖨️ Print Return Slip (प्रिंट करें)
    </button>
  </div>
  <div class="center">
    <div class="shop-name">GUPTA TRADERS</div>
    <div style="font-size: 11px; font-weight: 700;">General Store & Provisions</div>
    <div class="voucher-title">SALES RETURN & REFUND VOUCHER</div>
  </div>
  <div class="separator"></div>
  <table>
    <tr><td>Return No: <span class="bold">${returnNo}</span></td><td class="right">${returnDate.toLocaleDateString('en-IN')}</td></tr>
    <tr><td>Original Bill: ${invoiceNo}</td><td class="right">${returnDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td></tr>
    ${customerName ? `<tr><td colspan="2">Customer: ${customerName}</td></tr>` : ''}
    <tr><td>Refund Mode: <span class="bold">${refundMethod}</span></td><td class="right">Reason: ${reason}</td></tr>
  </table>
  <div class="separator"></div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align: left;">Returned Product</th>
        <th style="text-align: center; width: 48px;">Qty</th>
        <th style="text-align: right; width: 68px;">Refund Amt</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(it => {
        const itName = escapeReceiptText(it.product_name || it.product?.name || it.name || 'Item');
        const itQty = Number(it.quantity || 1);
        const itUnit = escapeReceiptText(mapUnitToShort(it.unit || it.product?.unit || ''));
        const itTotal = Number(it.line_total || it.total || (it.price * itQty) || 0);
        return `
          <tr>
            <td style="text-align: left; word-break: break-word;">${itName}</td>
            <td style="text-align: center; white-space: nowrap;">${itQty}${itUnit}</td>
            <td style="text-align: right; white-space: nowrap;">${itTotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  <div class="double-separator"></div>
  <table>
    <tr style="font-size: 15px; font-weight: 900;">
      <td>TOTAL REFUND AMOUNT:</td>
      <td class="right">Rs. ${totalAmount.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="font-size: 11px;">Refund Mode:</td>
      <td class="right" style="font-size: 11px;">${refundMethod}</td>
    </tr>
  </table>
  <div class="separator"></div>
  <div class="center" style="margin-top: 8px; font-size: 10px;">
    <div>Items received in good condition & added back to stock.</div>
    <div class="bold" style="margin-top: 6px;">Authorized Signatory / Seal</div>
    <div style="margin-top: 18px; border-bottom: 1px dashed #000000; width: 55%; margin-left: auto; margin-right: auto;"></div>
  </div>
</body>
</html>`;
}

// ─── Reliable Thermal Print Execution for Return Slip ────────────────
export function printThermalReturnReceipt(returnData, onPrint) {
  if (!returnData) return;
  const html = generateReturnReceiptHtml(returnData);
  const printWindow = window.open('', '_blank', 'width=420,height=720,menubar=no,toolbar=no,location=no,status=no');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    const doPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
        if (onPrint) onPrint();
      } catch (err) {
        console.warn('Print window error:', err);
      }
    };
    if (printWindow.document.readyState === 'complete') {
      setTimeout(doPrint, 350);
    } else {
      printWindow.onload = () => setTimeout(doPrint, 350);
    }
  } else {
    window.alert('Please allow pop-ups for this site so the return voucher window can open and print.');
  }
}