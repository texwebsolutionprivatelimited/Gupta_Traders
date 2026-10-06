import { useEffect, useRef, useState, useMemo } from 'react'
import { formatINR, numberToWordsINR } from '../../utils/erp'
import { listUISales, subscribeToTable, getStoredBusinessSettings } from '../../services/erpService'
import {
  FaReceipt as ReceiptIcon,
  FaPrint as PrinterIcon,
  FaCheckCircle as CheckCircleIcon,
} from 'react-icons/fa'
import { getReceiptQrCodeDataUrl } from '../../utils/qrCodeService'

const mapUnitToShort = (unit) => {
  if (!unit) return '';
  const u = unit.toLowerCase().trim();
  if (u === 'piece' || u === 'pieces' || u === 'pcs' || u === 'pc') return '';
  if (u === 'kilogram' || u === 'kilograms' || u === 'kg' || u === 'kgs') return 'kg';
  if (u === 'litre' || u === 'litres' || u === 'liter' || u === 'ltr' || u === 'ltrs') return 'L';
  if (u === 'millilitre' || u === 'millilitres' || u === 'ml') return 'ml';
  if (u === 'gram' || u === 'grams' || u === 'gm' || u === 'gms' || u === 'g') return 'g';
  if (u === 'packet' || u === 'packets' || u === 'pkt' || u === 'pkts') return 'pkt';
  if (u === 'box' || u === 'boxes') return 'box';
  if (u === 'dozen' || u === 'dozens' || u === 'doz') return 'doz';
  return unit;
};

const escapeReceiptText = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function formatItemReceiptName(name, packSize) {
  const cleanName = String(name || '').trim();
  const rawPack = String(packSize || '').trim();
  if (!rawPack) return cleanName;

  // Clean pack size prefix if needed (e.g. "per kg" -> "kg")
  const cleanPack = rawPack.replace(/^per\s+/i, '').trim();
  if (!cleanPack) return cleanName;

  // If name already contains the pack size, avoid duplicating
  const lowerName = cleanName.toLowerCase();
  const lowerPack = cleanPack.toLowerCase();
  if (lowerName.includes(lowerPack)) {
    return cleanName;
  }

  return `${cleanName} — ${cleanPack}`;
}

export const formatReceiptQty = (qty) => {
  const num = Number(qty || 0);
  return String(Math.round(num));
};

// ─── Universal Bill Normalizer ────────────────────────────────────
export function normalizeBillData(rawBill) {
  if (!rawBill) return null;

  const storeSettings = getStoredBusinessSettings();
  const storeName = 'GUPTA TRADERS & SUPERSTORE';
  const configuredAddress = storeSettings.shop?.address || storeSettings.address;
  const storeAddress = (configuredAddress && !configuredAddress.toLowerCase().includes('lucknow'))
    ? configuredAddress
    : 'Plot no. 12 Balaji Nagar, Narela Shankari, Near khedapati Mandir, Bhopal MP(462022)';
  const storeAddressLine1 = 'Plot no. 12 Balaji Nagar, Narela Shankari';
  const storeAddressLine2 = 'Near khedapati Mandir, Bhopal MP(462022)';
  const storePhone = '+91 9131822789';
  const storeGstin = rawBill.storeGstin || storeSettings.gst?.gstin || storeSettings.gstin || '09XXXXXXXXXXXXXXX';
  const returnPolicy = rawBill.returnPolicy || storeSettings.invoice?.footer || storeSettings.receiptFooter || 'Items sold after 10 days will not be returned';

  const billNumber = rawBill.billNumber || rawBill.invoice_number || rawBill.invoice || rawBill.billNo || rawBill.id || '—';
  const cashier = rawBill.cashier || rawBill.cashierName || rawBill.user || rawBill.created_by || rawBill.username || 'Admin';
  const paymentMode = String(rawBill.paymentMode || rawBill.payment_method || rawBill.paymentMethod || rawBill.payment || 'cash');
  const amountPaid = Number(rawBill.amountPaid ?? rawBill.paid_amount ?? rawBill.paidAmount ?? rawBill.paid ?? 0);

  const rawMeta = (typeof rawBill.metadata === 'object' && rawBill.metadata !== null)
    ? rawBill.metadata
    : (typeof rawBill.metadata === 'string' ? (() => { try { return JSON.parse(rawBill.metadata); } catch { return {}; } })() : {});

  const rawCustomerName = String(rawBill.customerName || (typeof rawBill.customer === 'string' ? rawBill.customer : rawBill.customer?.name) || rawBill.partyName || '').trim();
  const rawCustomerPhone = String(
    rawBill.customerPhone
    || rawBill.customer_phone
    || (typeof rawBill.customer === 'object' ? (rawBill.customer?.phone || rawBill.customer?.mobile) : '')
    || rawBill.partyPhone
    || rawBill.party_phone
    || rawBill.phone
    || rawBill.mobile
    || (rawMeta.customerPhone || rawMeta.customer_phone || rawMeta.phone || '')
    || ''
  ).trim();

  // Completely eliminate 9999999999 from receipt
  const customerName = rawCustomerName.replace(/\D/g, '') === '9999999999' ? '' : rawCustomerName;
  const customerPhone = rawCustomerPhone.replace(/\D/g, '') === '9999999999' ? '' : rawCustomerPhone;

  let customerDisplay = customerName;
  if (customerPhone) {
    if (!customerDisplay) {
      customerDisplay = customerPhone;
    } else if (customerDisplay !== customerPhone && !customerDisplay.includes(customerPhone)) {
      customerDisplay = `${customerDisplay} (${customerPhone})`;
    }
  }

  let rawNotes = {};
  if (typeof rawBill.notes === 'string' && rawBill.notes.trim().startsWith('{')) {
    try { rawNotes = JSON.parse(rawBill.notes); } catch { }
  }
  if (typeof rawBill.payment_reference === 'string' && rawBill.payment_reference.trim().startsWith('{')) {
    try { rawNotes = { ...rawNotes, ...JSON.parse(rawBill.payment_reference) }; } catch { }
  }

  const rawSplit = rawBill.splitDetails || rawBill.splitPayment || rawMeta.splitDetails || rawMeta.splitPayment || rawNotes.splitDetails || rawNotes.splitPayment || {};

  const cleanMode = paymentMode.toLowerCase().replace(/[\s\-_]+/g, '');
  const isSplitPayment = cleanMode === 'cashupi' || cleanMode === 'split' || cleanMode.includes('cashupi') || cleanMode.includes('split') || (rawSplit.cashAmount !== undefined && rawSplit.upiAmount !== undefined) || (rawBill.cashAmount !== undefined && rawBill.upiAmount !== undefined && Number(rawBill.cashAmount) > 0 && Number(rawBill.upiAmount) > 0);

  let cashAmount = Number(rawBill.cashAmount ?? rawBill.cash_amount ?? rawMeta.cashAmount ?? rawMeta.cash_amount ?? rawSplit.cashAmount ?? rawSplit.cash_amount ?? rawNotes.cashAmount ?? rawNotes.cash_amount ?? (cleanMode === 'cash' ? (amountPaid || 0) : 0));
  let upiAmount = Number(rawBill.upiAmount ?? rawBill.upi_amount ?? rawMeta.upiAmount ?? rawMeta.upi_amount ?? rawSplit.upiAmount ?? rawSplit.upi_amount ?? rawNotes.upiAmount ?? rawNotes.upi_amount ?? (cleanMode === 'upi' ? (amountPaid || 0) : 0));

  if (isSplitPayment && cashAmount === 0 && upiAmount === 0) {
    const textRef = `${rawBill.payment_reference || ''} ${rawBill.notes || ''} ${rawBill.paymentReference || ''}`;
    const cashM = textRef.match(/Cash[:\s]*₹?\s*([\d.]+)/i);
    const upiM = textRef.match(/UPI[:\s]*₹?\s*([\d.]+)/i);
    if (cashM) cashAmount = parseFloat(cashM[1]) || 0;
    if (upiM) upiAmount = parseFloat(upiM[1]) || 0;
  }

  const rawDate = rawBill.timestamp || rawBill.sale_date || rawBill.date || rawBill.createdAt || rawBill.created_at;
  const timestamp = rawDate ? new Date(rawDate) : new Date();

  const rawItems = Array.isArray(rawBill.items) ? rawBill.items
    : Array.isArray(rawBill.cart) ? rawBill.cart
      : Array.isArray(rawBill.products) ? rawBill.products
        : [];

  const items = rawItems.map((item, idx) => {
    const rawName = item.name || item.product_name || item.product || item.title || item.itemName || `Item #${idx + 1}`;
    const packSize = item.packSize || item.pack_size || item.pack || item.product?.pack_size || item.product?.packSize || '';
    const name = formatItemReceiptName(rawName, packSize);
    // Requirement: Quantity on receipt must ALWAYS be whole numbers only: 1, 2, 3, 4... Never 1.000, 2.000
    const rawQ = Number(item.quantity ?? item.qty ?? item.originalQuantity ?? 1);
    const quantity = Math.max(1, Math.round(rawQ));
    const rate = Number(item.rate ?? item.price ?? item.selling_price ?? item.sellingPrice ?? item.unit_price ?? item.unitPrice ?? 0);
    const unit = item.unit || item.loose_unit || item.looseUnit || '';
    const itemDiscount = Number(item.itemDiscount ?? item.discount ?? item.discount_percent ?? item.item_discount_percent ?? 0);
    // Amount = Rate * Quantity. Rate (Our Price) is preserved.
    const amount = Number((rate * quantity).toFixed(2));
    const lineTotal = itemDiscount > 0 ? Number((amount * (1 - itemDiscount / 100)).toFixed(2)) : amount;

    const rawMrp = item.mrp ?? item.metadata?.mrp ?? item.product?.mrp;
    const mrp = (rawMrp !== null && rawMrp !== undefined && rawMrp !== '' && !isNaN(Number(rawMrp)) && Number(rawMrp) > 0)
      ? Number(rawMrp)
      : null;

    const returnedQuantity = Math.round(Number(item.returnedQuantity ?? (item.returns || []).reduce((sum, r) => sum + Number(r.quantity || 0), 0) ?? 0));
    const returnableQuantity = Math.max(0, quantity - returnedQuantity);
    const isReturned = returnedQuantity > 0 && returnableQuantity === 0;
    const isPartiallyReturned = returnedQuantity > 0 && returnableQuantity > 0;

    return {
      ...item,
      sr: idx + 1,
      name,
      quantity,
      rate,
      price: rate,
      mrp,
      amount,
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
  const calculatedSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const beforeDiscount = Number(rawSummary.beforeDiscount ?? (items.length > 0 ? calculatedSubtotal : (rawBill.subtotal ?? calculatedSubtotal)));
  const totalGST = Number(rawSummary.totalGST ?? rawSummary.gst ?? rawBill.tax_amount ?? rawBill.gst ?? rawBill.tax ?? 0);
  const totalCGST = Number(rawSummary.totalCGST ?? rawBill.cgst ?? (totalGST / 2));
  const totalSGST = Number(rawSummary.totalSGST ?? rawBill.sgst ?? (totalGST / 2));
  const discountAmount = Number(rawSummary.discountAmount ?? rawSummary.discount ?? rawBill.discount ?? 0);
  const subtotal = rawBill.isGSTInclusive === false ? Number(rawSummary.subtotal ?? rawBill.subtotal ?? calculatedSubtotal) : (beforeDiscount > 0 ? beforeDiscount : Number(rawSummary.subtotal ?? rawBill.subtotal ?? calculatedSubtotal));
  const grandTotal = Number(rawSummary.grandTotal ?? rawBill.total_amount ?? rawBill.total ?? Math.max(0, (beforeDiscount > 0 ? beforeDiscount : subtotal + totalGST) - discountAmount));

  const allProductsHaveMrp = items.length > 0 && items.every(i => i.mrp !== null && i.mrp > 0);
  const totalMrpAmount = allProductsHaveMrp
    ? Number(items.reduce((sum, i) => sum + (Number(i.mrp) * i.quantity), 0).toFixed(2))
    : 0;
  const mrpSavings = (allProductsHaveMrp && totalMrpAmount > grandTotal)
    ? Number((totalMrpAmount - grandTotal).toFixed(2))
    : 0;

  // Calculate You Saved from MRP - Rate for the purchased items
  const youSaved = Number(
    items.reduce((sum, item) => {
      const mrp = Number(item.mrp || 0);
      const rate = Number(item.rate || 0);
      const qty = Number(item.quantity || 1);
      if (mrp > rate) {
        return sum + ((mrp - rate) * qty);
      }
      return sum;
    }, 0).toFixed(2)
  );
  const youSavedFormatted = youSaved % 1 === 0 ? youSaved.toFixed(0) : youSaved.toFixed(2);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const wordsAmount = numberToWordsINR(grandTotal);

  const returns = rawBill.returns || [];
  const totalRefunded = Number(rawBill.totalRefunded ?? returns.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) ?? 0);
  const hasReturns = totalRefunded > 0 || returns.length > 0 || items.some(i => i.returnedQuantity > 0);

  const actualPaid = amountPaid > 0 ? amountPaid : grandTotal;
  const changeDue = actualPaid > grandTotal ? Number((actualPaid - grandTotal).toFixed(2)) : 0;
  const balanceDue = actualPaid < grandTotal ? Number((grandTotal - actualPaid).toFixed(2)) : 0;

  return {
    ...rawBill,
    storeName,
    storeAddress,
    storeAddressLine1,
    storeAddressLine2,
    storePhone,
    storeGstin,
    returnPolicy,
    billNumber,
    customerName,
    customerPhone,
    customerDisplay,
    cashier,
    paymentMode,
    isSplitPayment,
    cashAmount,
    upiAmount,
    splitDetails: { cashAmount, upiAmount },
    amountPaid: actualPaid,
    changeDue,
    balanceDue,
    timestamp,
    items,
    allProductsHaveMrp,
    totalMrpAmount,
    mrpSavings,
    youSaved,
    youSavedFormatted,
    totalQuantity,
    wordsAmount,
    summary: {
      subtotal,
      totalGST,
      totalCGST,
      totalSGST,
      discountAmount,
      grandTotal,
    },
    returns,
    totalRefunded,
    hasReturns,
    netTotalAfterReturns: Math.max(0, grandTotal - totalRefunded),
  };
}

// ─── Generate Thermal Receipt HTML matching reference image ─────────────
export function generateReceiptHtml(bill) {
  const norm = normalizeBillData(bill);
  if (!norm) return '';

  const qrCodeSvgDataUrl = getReceiptQrCodeDataUrl(norm);
  const items = norm.items;
  const summary = norm.summary;
  const timestamp = norm.timestamp;
  const day = String(timestamp.getDate()).padStart(2, '0');
  const year = timestamp.getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${day}-${monthNames[timestamp.getMonth()]}-${year}`;
  const formattedTime = timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="light" />
  <title>Receipt ${escapeReceiptText(norm.billNumber)}</title>
  <style>
    :root {
      color-scheme: light !important;
    }
    @page {
      margin: 0;
      size: 80mm auto;
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
    .left { text-align: left; }
    .bold { font-weight: 900; }
    .dash-line {
      border-top: 2px dashed #000000 !important;
      margin: 5px 0;
    }
    .store-title {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
      color: #000000 !important;
    }
    .store-info {
      font-size: 12px;
      font-weight: 800;
      line-height: 1.3;
      color: #000000 !important;
    }
    .invoice-title {
      font-size: 13px;
      font-weight: 900;
      margin: 4px 0 2px 0;
      text-transform: uppercase;
      color: #000000 !important;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 800;
      line-height: 1.4;
      padding: 1px 0;
      color: #000000 !important;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 11.5px;
      color: #000000 !important;
      margin: 4px 0;
    }
    table.items-table th {
      border-top: 2px dashed #000000 !important;
      border-bottom: 2px dashed #000000 !important;
      padding: 6px 3px;
      font-weight: 900;
      font-size: 11px;
      line-height: 1.25;
      color: #000000 !important;
    }
    table.items-table td {
      padding: 5px 3px;
      vertical-align: top;
      font-size: 11.5px;
      font-weight: 800;
      line-height: 1.3;
      color: #000000 !important;
    }
    table.items-table tbody tr:not(:last-child) td {
      border-bottom: 1px dashed #e2e8f0 !important;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 800;
      line-height: 1.4;
      padding: 2px 0;
      color: #000000 !important;
    }
    .totals-row .amount {
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      font-weight: 900;
    }
    .big-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 19px;
      font-weight: 900;
      margin: 3px 0;
      color: #000000 !important;
    }
    .big-total-row .amount {
      font-size: 19px;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
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
        padding: 6px 8px;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #f0fdf4; border: 1px solid #86efac; padding: 10px; text-align: center; border-radius: 8px; margin-bottom: 12px; font-family: sans-serif; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
    <button onclick="window.print()" style="background: #059669; color: #ffffff; border: none; padding: 9px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
      🖨️ Print Receipt (प्रिंट करें)
    </button>
  </div>

  <!-- Store Header: Preserved exactly as Balaji Nagar Bhopal -->
  <div class="center">
    <div class="store-title">${escapeReceiptText(norm.storeName)}</div>
    <div class="store-info">${escapeReceiptText(norm.storeAddressLine1 || 'Plot no. 12 Balaji Nagar, Narela Shankari')}</div>
    <div class="store-info">${escapeReceiptText(norm.storeAddressLine2 || 'Near khedapati Mandir, Bhopal MP(462022)')}</div>
    <div class="store-info">Mob.no: ${escapeReceiptText(norm.storePhone || '+91 9131822789')}</div>
    <div class="store-info">GSTIN: ${escapeReceiptText(norm.storeGstin || '09XXXXXXXXXXXXXXX')}</div>
    <div class="invoice-title">Retail Invoice</div>
  </div>

  <div class="dash-line"></div>

  <!-- Invoice Meta -->
  <div class="meta-row">
    <span>Memo# ${escapeReceiptText(norm.billNumber)}</span>
    <span>${formattedTime} ${formattedDate}</span>
  </div>
  <div class="meta-row">
    <span>Printed On: ${formattedDate} ${formattedTime}</span>
  </div>
  <div class="meta-row">
    <span>User: ${escapeReceiptText(norm.cashier)}</span>
    ${norm.customerDisplay ? `<span>Cust: ${escapeReceiptText(norm.customerDisplay)}</span>` : ''}
  </div>

  <!-- Product Table: Product | Qty | MRP | Rate | Amount -->
  <table class="items-table">
    <colgroup>
      <col style="width: 34%;" />
      <col style="width: 11%;" />
      <col style="width: 17%;" />
      <col style="width: 18%;" />
      <col style="width: 20%;" />
    </colgroup>
    <thead>
      <tr>
        <th style="text-align: left; padding-left: 2px; padding-right: 4px;">Product</th>
        <th style="text-align: center; padding-left: 2px; padding-right: 2px;">Qty</th>
        <th style="text-align: right; padding-left: 3px; padding-right: 4px;">MRP</th>
        <th style="text-align: right; padding-left: 4px; padding-right: 5px;">Rate</th>
        <th style="text-align: right; padding-left: 4px; padding-right: 2px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => {
    const itemMrp = (item.mrp && Number(item.mrp) > 0 ? Number(item.mrp) : Number(item.rate)).toFixed(2);
    return `
        <tr>
          <td style="text-align: left; word-break: break-word; padding-left: 2px; padding-right: 4px;">
            <div style="font-weight: 800; font-size: 11.5px; line-height: 1.25;">${escapeReceiptText(item.name)}</div>
            ${item.itemDiscount > 0 ? `<div style="font-size: 9.5px; font-weight: normal; color: #444; margin-top: 1.5px;">Disc: -${(item.rate * item.quantity * item.itemDiscount / 100).toFixed(2)}</div>` : ''}
            ${item.returnedQuantity > 0 ? `
              <div style="font-size: 9px; font-weight: 900; color: #b91c1c !important; margin-top: 1.5px;">
                [TAKEN BACK: -${formatReceiptQty(item.returnedQuantity)}${escapeReceiptText(mapUnitToShort(item.unit))}]
              </div>
            ` : ''}
          </td>
          <td style="text-align: center; white-space: nowrap; font-variant-numeric: tabular-nums; padding-left: 2px; padding-right: 2px;">
            ${formatReceiptQty(item.quantity)}
          </td>
          <td style="text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; padding-left: 3px; padding-right: 4px;">
            ${itemMrp}
          </td>
          <td style="text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; padding-left: 4px; padding-right: 5px;">
            ${item.rate.toFixed(2)}
          </td>
          <td style="text-align: right; white-space: nowrap; font-weight: 900; font-variant-numeric: tabular-nums; padding-left: 4px; padding-right: 2px;">
            ${item.amount.toFixed(2)}
          </td>
        </tr>
      `;
  }).join('')}
    </tbody>
  </table>

  <div class="dash-line"></div>

  <!-- Sub Total -->
  <div class="totals-row">
    <span>Sub Total</span>
    <span class="amount bold">${summary.subtotal.toFixed(2)}</span>
  </div>

  ${summary.discountAmount > 0 ? `
    <div class="totals-row">
      <span>Discount</span>
      <span class="amount bold">-${summary.discountAmount.toFixed(2)}</span>
    </div>
  ` : ''}

  <div class="dash-line"></div>

  <!-- Total Qty and Big Bill Amount -->
  <div class="big-total-row">
    <span style="font-size: 12px; font-weight: 800;">
      Total Qty: ${formatReceiptQty(norm.totalQuantity)} &nbsp; Amt:
    </span>
    <span class="amount">${summary.grandTotal.toFixed(2)}</span>
  </div>

  <!-- Rupees in words -->
  <div style="font-size: 11px; font-style: italic; margin-bottom: 4px; padding-left: 1px;">
    (${escapeReceiptText(norm.wordsAmount)})
  </div>

  <!-- Tender and Payment Mode -->
  <div class="totals-row">
    <span>Tender:</span>
    <span class="amount">${norm.amountPaid.toFixed(2)}</span>
  </div>
  ${norm.isSplitPayment ? `
    <div class="totals-row bold">
      <span>Pay Mode: CASH + UPI:</span>
      <span class="amount">${summary.grandTotal.toFixed(2)}</span>
    </div>
    <div class="totals-row" style="padding-left: 10px; font-size: 11px;">
      <span>• Cash Paid:</span>
      <span class="amount">₹${norm.cashAmount.toFixed(2)}</span>
    </div>
    <div class="totals-row" style="padding-left: 10px; font-size: 11px;">
      <span>• Online/UPI Paid:</span>
      <span class="amount">₹${norm.upiAmount.toFixed(2)}</span>
    </div>
  ` : `
    <div class="totals-row">
      <span>Pay Mode: ${escapeReceiptText(norm.paymentMode.toUpperCase())}:</span>
      <span class="amount">${summary.grandTotal.toFixed(2)}</span>
    </div>
  `}
  ${norm.changeDue > 0 ? `
    <div class="totals-row">
      <span>Change:</span>
      <span class="amount bold">${norm.changeDue.toFixed(2)}</span>
    </div>
  ` : ''}
  ${norm.balanceDue > 0 ? `
    <div class="totals-row">
      <span>Balance Due:</span>
      <span class="amount bold">${norm.balanceDue.toFixed(2)}</span>
    </div>
  ` : ''}

  ${norm.hasReturns ? `
    <div class="dash-line"></div>
    <div class="totals-row" style="font-weight: 900;">
      <span>RETURNED / REFUNDED:</span>
      <span class="amount">-${norm.totalRefunded.toFixed(2)}</span>
    </div>
    <div class="totals-row" style="font-weight: 900; font-size: 13px;">
      <span>ADJUSTED NET TOTAL:</span>
      <span class="amount">${norm.netTotalAfterReturns.toFixed(2)}</span>
    </div>
  ` : ''}

  <div class="dash-line"></div>

  <!-- Net Value -->
  <div class="totals-row bold" style="font-size: 13px;">
    <span>Net Value</span>
    <span class="amount" style="font-size: 13px;">${(norm.hasReturns ? norm.netTotalAfterReturns : summary.grandTotal).toFixed(2)}</span>
  </div>

  ${norm.youSaved > 0 ? `
    <div class="dash-line"></div>
    <div class="center bold" style="font-size: 12px; margin: 3px 0;">
      You Saved: ₹${norm.youSavedFormatted}
    </div>
  ` : ''}

  <div class="dash-line"></div>

  <!-- QR Code at Bottom of Receipt (Amount encoded in QR, NOT displayed as text) -->
  ${qrCodeSvgDataUrl ? `
    <div class="center" style="margin: 8px 0 6px 0;">
      <img src="${qrCodeSvgDataUrl}" alt="UPI Payment QR" style="width: 105px; height: 105px; display: inline-block; image-rendering: crisp-edges;" />
      <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px;">Scan & Pay with any UPI App</div>
    </div>
    <div class="dash-line"></div>
  ` : ''}

  <!-- Footer -->
  <div class="center" style="margin-top: 8px;">
    <div class="bold" style="font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase;">THANKS, VISIT AGAIN</div>
    <div style="font-size: 10px; margin-top: 3px; font-weight: 700;">${escapeReceiptText(norm.returnPolicy)}</div>
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

// ─── Bill Receipt Component (Print & Reprint Preview) ────────────
export function ReceiptPreview({ bill, onClose, onPrint }) {
  const receiptRef = useRef(null);
  const norm = normalizeBillData(bill);

  if (!norm) return null;

  const qrCodeSvgDataUrl = getReceiptQrCodeDataUrl(norm);

  const handlePrint = () => {
    printThermalReceipt(norm, onPrint);
  };

  const day = String(norm.timestamp.getDate()).padStart(2, '0');
  const month = String(norm.timestamp.getMonth() + 1).padStart(2, '0');
  const year = norm.timestamp.getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${day}-${monthNames[norm.timestamp.getMonth()]}-${year}`;
  const formattedTime = norm.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-3 transition-colors" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Thermal Receipt Preview</h3>
              <p className="text-[11px] font-mono text-slate-400">Invoice: {norm.billNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thermal Receipt Paper Card (High clarity, bold thermal aesthetic) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950 flex justify-center">
          <div
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white text-black p-4 sm:p-5 rounded-2xl shadow-2xl text-xs font-bold leading-normal select-text space-y-1.5 border border-slate-300"
            style={{
              color: '#000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, monospace'
            }}
          >
            {/* Store Header */}
            <div className="text-center space-y-0.5">
              <p className="text-base font-black uppercase tracking-wide leading-tight text-black">{norm.storeName}</p>
              <p className="text-xs font-bold text-black leading-tight">{norm.storeAddressLine1 || 'Plot no. 12 Balaji Nagar, Narela Shankari'}</p>
              <p className="text-xs font-bold text-black leading-tight">{norm.storeAddressLine2 || 'Near khedapati Mandir, Bhopal MP(462022)'}</p>
              <p className="text-xs font-bold text-black">Mob.no: {norm.storePhone || '+91 9131822789'}</p>
              <p className="text-xs font-bold text-black">GSTIN: {norm.storeGstin || '09XXXXXXXXXXXXXXX'}</p>
              <p className="text-xs font-black uppercase pt-0.5 text-black">Retail Invoice</p>
            </div>

            <div className="border-t-2 border-dashed border-black my-1.5" />

            {/* Invoice Info */}
            <div className="space-y-0.5 text-xs font-bold text-black">
              <div className="flex justify-between">
                <span>Memo# {norm.billNumber}</span>
                <span>{formattedTime} {formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Printed On: {formattedDate} {formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span>User: {norm.cashier}</span>
                {norm.customerDisplay && <span>Cust: {norm.customerDisplay}</span>}
              </div>
            </div>

            {/* Product Table: Product | Qty | MRP | Rate | Amount */}
            <div className="pt-0.5">
              <table className="w-full text-xs font-bold border-collapse" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '34%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr className="border-t-2 border-b-2 border-dashed border-black text-black">
                    <th className="text-left py-2 pl-0.5 pr-1 font-black">Product</th>
                    <th className="text-center py-2 px-0.5 font-black">Qty</th>
                    <th className="text-right py-2 pl-1 pr-1 font-black">MRP</th>
                    <th className="text-right py-2 pl-1 pr-1.5 font-black">Rate</th>
                    <th className="text-right py-2 pl-1 pr-0.5 font-black">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {norm.items.map((item, idx) => {
                    const itemMrp = (item.mrp && Number(item.mrp) > 0 ? Number(item.mrp) : Number(item.rate)).toFixed(2);
                    return (
                      <tr key={item.id || item.cartId || idx} className="align-top leading-tight border-b border-dashed border-slate-200 last:border-b-0">
                        <td className="text-left py-1.5 pl-0.5 pr-1 break-words font-bold text-black">
                          <div className="text-[11.5px] leading-snug">{item.name}</div>
                          {item.itemDiscount > 0 && (
                            <div className="text-[10px] font-normal text-slate-700 mt-0.5">Disc: -{(item.rate * item.quantity * item.itemDiscount / 100).toFixed(2)}</div>
                          )}
                          {item.returnedQuantity > 0 && (
                            <div className="text-[9px] font-black text-rose-700 mt-0.5">
                              [TAKEN BACK: -{formatReceiptQty(item.returnedQuantity)}{mapUnitToShort(item.unit)}]
                            </div>
                          )}
                        </td>
                        <td className="text-center py-1.5 px-0.5 whitespace-nowrap font-bold text-black tabular-nums">{formatReceiptQty(item.quantity)}</td>
                        <td className="text-right py-1.5 pl-1 pr-1 whitespace-nowrap font-bold text-black tabular-nums">{itemMrp}</td>
                        <td className="text-right py-1.5 pl-1 pr-1.5 whitespace-nowrap font-bold text-black tabular-nums">{item.rate.toFixed(2)}</td>
                        <td className="text-right py-1.5 pl-1 pr-0.5 whitespace-nowrap font-black text-black tabular-nums">{item.amount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-dashed border-black my-1.5" />

            {/* Sub Total */}
            <div className="flex justify-between text-xs font-extrabold text-black">
              <span>Sub Total</span>
              <span className="font-black tabular-nums">{norm.summary.subtotal.toFixed(2)}</span>
            </div>

            {norm.summary.discountAmount > 0 && (
              <div className="flex justify-between text-xs font-extrabold text-black">
                <span>Discount</span>
                <span className="font-black tabular-nums">-{norm.summary.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t-2 border-dashed border-black my-1.5" />

            {/* Total Qty & Large Bill Total */}
            <div className="flex justify-between items-baseline pt-0.5 text-black">
              <span className="text-xs font-bold">Total Qty: {formatReceiptQty(norm.totalQuantity)} &nbsp; Amt:</span>
              <span className="text-xl font-black tabular-nums">{norm.summary.grandTotal.toFixed(2)}</span>
            </div>

            {/* Rupees in Words */}
            <p className="text-xs italic text-black leading-tight font-semibold">
              ({norm.wordsAmount})
            </p>

            {/* Tender & Pay Mode */}
            <div className="space-y-0.5 text-xs pt-1 font-bold text-black">
              <div className="flex justify-between">
                <span>Tender:</span>
                <span className="tabular-nums">{norm.amountPaid.toFixed(2)}</span>
              </div>
              {norm.isSplitPayment ? (
                <>
                  <div className="flex justify-between font-black text-black">
                    <span>Pay Mode: CASH + UPI:</span>
                    <span className="tabular-nums">{norm.summary.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-[11px] font-semibold text-slate-800">
                    <span>• Cash Paid:</span>
                    <span className="tabular-nums">₹{norm.cashAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-[11px] font-semibold text-slate-800">
                    <span>• Online/UPI Paid:</span>
                    <span className="tabular-nums">₹{norm.upiAmount.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Pay Mode: {norm.paymentMode.toUpperCase()}:</span>
                  <span className="tabular-nums">{norm.summary.grandTotal.toFixed(2)}</span>
                </div>
              )}
              {norm.changeDue > 0 && (
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span className="font-black tabular-nums">{norm.changeDue.toFixed(2)}</span>
                </div>
              )}
              {norm.balanceDue > 0 && (
                <div className="flex justify-between">
                  <span>Balance Due:</span>
                  <span className="font-black tabular-nums">{norm.balanceDue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {norm.hasReturns && (
              <>
                <div className="border-t-2 border-dashed border-black my-1.5" />
                <div className="flex justify-between text-xs font-black text-rose-700">
                  <span>RETURNED / REFUNDED:</span>
                  <span className="tabular-nums">-{norm.totalRefunded.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-black">
                  <span>ADJUSTED NET TOTAL:</span>
                  <span className="tabular-nums">{norm.netTotalAfterReturns.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="border-t-2 border-dashed border-black my-1.5" />

            {/* Net Value */}
            <div className="flex justify-between text-sm font-black text-black">
              <span>Net Value</span>
              <span className="tabular-nums">{(norm.hasReturns ? norm.netTotalAfterReturns : norm.summary.grandTotal).toFixed(2)}</span>
            </div>

            {norm.youSaved > 0 && (
              <>
                <div className="border-t-2 border-dashed border-black my-1.5" />
                <div className="text-center font-black text-xs py-0.5 text-black">
                  You Saved: ₹{norm.youSavedFormatted}
                </div>
              </>
            )}

            {/* QR Code at Bottom of Receipt (Amount encoded in QR, NOT displayed as text) */}
            {qrCodeSvgDataUrl && (
              <>
                <div className="border-t-2 border-dashed border-black my-1.5" />
                <div className="flex flex-col items-center justify-center my-1.5 text-center">
                  <img
                    src={qrCodeSvgDataUrl}
                    alt="UPI Payment QR"
                    className="w-28 h-28 object-contain"
                  />
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-black mt-1">
                    Scan & Pay with any UPI App
                  </p>
                </div>
              </>
            )}

            <div className="border-t-2 border-dashed border-black my-1.5" />

            {/* Footer */}
            <div className="text-center pt-1 space-y-0.5 text-black">
              <p className="text-xs font-black uppercase tracking-wider">THANKS, VISIT AGAIN</p>
              <p className="text-[11px] font-bold text-slate-800 leading-tight">{norm.returnPolicy}</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[130px] py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PrinterIcon className="w-4 h-4" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'today' | 'yesterday' | 'cash' | 'upi' | 'card'

  useEffect(() => {
    let active = true
    const load = () => {
      setLoading(true)
      listUISales().then(rows => {
        if (!active) return
        setBills(rows.map(normalizeBillData))
        setLoading(false)
      }).catch(err => {
        console.error('Failed to load reprint bills:', err)
        setLoading(false)
      })
    }
    load()
    const unsub = subscribeToTable('sales', load)
    return () => {
      active = false
      if (typeof unsub === 'function') unsub()
    }
  }, [])

  const filteredBills = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    return bills.filter(bill => {
      if (!bill) return false

      // Match search
      const billNo = String(bill.billNumber || '').toLowerCase()
      const cust = String(bill.customerName || '').toLowerCase()
      const amountStr = String(bill.summary?.grandTotal || '')
      const itemsMatch = (bill.items || []).some(it => String(it.name || '').toLowerCase().includes(q))

      const matchesSearch = !q || billNo.includes(q) || cust.includes(q) || amountStr.includes(q) || itemsMatch

      if (!matchesSearch) return false

      // Match tab filter
      if (filterMode === 'all') return true

      const billDate = new Date(bill.timestamp)
      if (filterMode === 'today') {
        return (
          billDate.getFullYear() === now.getFullYear() &&
          billDate.getMonth() === now.getMonth() &&
          billDate.getDate() === now.getDate()
        )
      }
      if (filterMode === 'yesterday') {
        return (
          billDate.getFullYear() === yesterday.getFullYear() &&
          billDate.getMonth() === yesterday.getMonth() &&
          billDate.getDate() === yesterday.getDate()
        )
      }
      if (filterMode === 'cash') {
        return (bill.paymentMode || '').toLowerCase() === 'cash'
      }
      if (filterMode === 'upi') {
        return (bill.paymentMode || '').toLowerCase() === 'upi'
      }
      if (filterMode === 'cash_upi') {
        const pm = (bill.paymentMode || '').toLowerCase()
        return pm === 'cash_upi' || pm === 'cash+upi' || pm === 'split' || Boolean(bill.isSplitPayment)
      }

      return true
    })
  }, [bills, search, filterMode])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <PrinterIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Reprint Receipt History
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {filteredBills.length} / {bills.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Select any previous receipt to preview and print</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, customer name, item name, amount..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Receipts' },
              { id: 'today', label: "Today's Sales" },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'cash', label: 'Cash' },
              { id: 'upi', label: 'UPI' },
              { id: 'cash_upi', label: 'Cash + UPI' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${filterMode === tab.id
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bills List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading receipt history...</div>
          ) : filteredBills.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <ReceiptIcon className="w-6 h-6" />
              </div>
              <p className="text-slate-300 font-semibold text-sm">No receipts match your search</p>
              <p className="text-slate-500 text-xs">Try clearing search filters or completed sales will appear here</p>
            </div>
          ) : (
            filteredBills.map((bill, index) => {
              const dateObj = new Date(bill.timestamp)
              const formattedDateStr = dateObj.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
              const formattedTimeStr = dateObj.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              })
              const itemsListDesc = (bill.items || []).slice(0, 3).map(it => it.name).join(', ')
              const remainingCount = (bill.items || []).length - 3

              return (
                <div
                  key={bill.id || bill.billNumber || index}
                  onClick={() => onSelectBill(bill)}
                  className="group p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors">
                        {bill.billNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(bill.paymentMode || '').toLowerCase() === 'cash'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : (bill.paymentMode || '').toLowerCase() === 'upi'
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          : (bill.paymentMode || '').toLowerCase() === 'cash_upi' || (bill.paymentMode || '').toLowerCase() === 'cash+upi'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                        {(bill.paymentMode || '').toLowerCase() === 'cash_upi' ? 'Cash + UPI' : (bill.paymentMode || 'CASH')}
                      </span>
                      {bill.hasReturns && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          Returned
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{formattedDateStr} • {formattedTimeStr}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-medium truncate">
                        {bill.customerName || 'Walk-in Customer'}
                      </span>
                      <span>•</span>
                      <span>{(bill.items || []).length} items</span>
                    </div>

                    {itemsListDesc && (
                      <p className="text-[11px] text-slate-500 truncate">
                        {itemsListDesc}{remainingCount > 0 ? ` +${remainingCount} more` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/40">
                    <span className="text-lg font-black text-emerald-400 tabular-nums">
                      {formatINR(bill.summary?.grandTotal || 0)}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg bg-indigo-500/15 group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <PrinterIcon className="w-3 h-3" />
                      <span>Reprint</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sale Success Animation ──────────────────────────────────────
export function SaleSuccessOverlay({ bill, onDone }) {
  const isSplit = bill.paymentMode === 'cash_upi' || bill.paymentMode === 'cash+upi' || Boolean(bill.isSplitPayment) || (Number(bill.cashAmount || 0) > 0 && Number(bill.upiAmount || 0) > 0);
  const cashPaid = Number(bill.cashAmount ?? bill.splitDetails?.cashAmount ?? 0);
  const upiPaid = Number(bill.upiAmount ?? bill.splitDetails?.upiAmount ?? 0);

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

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Bill #{bill.billNumber} •{' '}
            <span>{isSplit ? 'Cash + UPI Split' : `${bill.paymentMode} Payment`}</span>
          </p>
          {isSplit && (
            <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-emerald-600 dark:text-emerald-400">Cash: ₹{cashPaid.toFixed(2)}</span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-violet-600 dark:text-violet-400">UPI: ₹{upiPaid.toFixed(2)}</span>
            </div>
          )}
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
  const storeSettings = getStoredBusinessSettings();
  const storePhone = (returnData.storePhone && String(returnData.storePhone).trim())
    || (storeSettings.shop?.phone && String(storeSettings.shop.phone).trim())
    || '+91 9131822789';

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
    <div class="shop-name">GUPTA TRADERS & SUPERSTORE</div>
    <div style="font-size: 11px; font-weight: 700;">Plot no. 12 Balaji Nagar, Narela Shankari</div>
    <div style="font-size: 11px; font-weight: 700;">Near khedapati Mandir, Bhopal MP(462022)</div>
    <div style="font-size: 11px; font-weight: 700;">Mob.no: +91 9131822789</div>
    <div style="font-size: 11px; font-weight: 700; margin-top: 4px;">SALES RETURN & REFUND VOUCHER</div>
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