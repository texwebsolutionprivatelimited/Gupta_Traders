export const formatINR=amount=>'₹'+Number(amount||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
export const unitOptions=['Piece','Kg','Gram','Litre','ML','Pack','Box','Bottle','Dozen','Meter','Other','pcs','kg','g','L','ml','pack','box','bottle','dozen','meter','other'].map(value=>({value,label:value}))
export const gstOptions=[0,5,12,18,28].map(value=>({value,label:`${value}%${value?' GST':' (No GST)'}`}))
export const generateNextSKU=()=>`SKU-${crypto.randomUUID().slice(0,8).toUpperCase()}`
export const generateNextProductCode=()=>`LC-${crypto.randomUUID().slice(0,8).toUpperCase()}`
export const generateNextBarcode=type=>type==='loose'?`9${Date.now().toString().slice(-6)}${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`:''
export function calculateItemGST(price,quantity,gstRate,isInclusive=false){const total=Number(price)*Number(quantity),rate=Number(gstRate||0);if(isInclusive){const base=total/(1+rate/100);return{baseAmount:base,gstAmount:total-base,totalAmount:total}}const gst=total*rate/100;return{baseAmount:total,gstAmount:gst,totalAmount:total+gst}}
export function isTodayBusinessDate(dateVal) {
  if (!dateVal) return false
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = String(now.getMonth() + 1).padStart(2, '0')
  const nowDate = String(now.getDate()).padStart(2, '0')
  const localTodayStr = `${nowYear}-${nowMonth}-${nowDate}`

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed === localTodayStr
    }
  }

  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return false
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function calculateERPDashboardMetrics(sales = [], purchases = [], products = []) {
  // Map products for fast purchase price / cost lookup
  const productCostMap = new Map()
  ;(products || []).forEach(p => {
    if (p.id) productCostMap.set(p.id, Number(p.purchasePrice || p.purchase_price || 0))
    if (p.supabase_id) productCostMap.set(p.supabase_id, Number(p.purchasePrice || p.purchase_price || 0))
  })

  const isValidSale = (s) => {
    const status = (s.status || s.rawStatus || '').toLowerCase()
    return status !== 'cancelled' && status !== 'void' && status !== 'draft'
  }

  const isValidPurchase = (p) => {
    const status = (p.status || '').toLowerCase()
    return status !== 'cancelled' && status !== 'void' && status !== 'draft'
  }

  // Filter for today's transactions
  const todaySales = (sales || []).filter(s =>
    isTodayBusinessDate(s.date || s.sale_date || s.createdAt || s.created_at) && isValidSale(s)
  )

  const todayPurchases = (purchases || []).filter(p =>
    isTodayBusinessDate(p.date || p.purchase_date || p.createdAt || p.created_at) && isValidPurchase(p)
  )

  // 1. Today's Sales Revenue (completed/valid sales net of returns)
  let todaysSales = 0
  let todaysProfit = 0

  todaySales.forEach(s => {
    // Net sale revenue: total_amount minus any refunds
    const rawTotal = Number(s.total ?? s.total_amount ?? s.grandTotal ?? s.net_amount ?? 0)
    const refunded = Number(s.totalRefunded || 0)
    const saleRevenue = Math.max(0, rawTotal - refunded)
    todaysSales += saleRevenue

    // Cost of goods sold for this sale
    let saleCost = 0
    const items = Array.isArray(s.items) ? s.items : []
    items.forEach(item => {
      const originalQty = Number(item.quantity ?? item.qty ?? 1)
      const retQty = Number(item.returnedQuantity || 0)
      const netQty = Math.max(0, originalQty - retQty)

      const costPrice = Number(
        item.unit_cost ||
        item.purchasePrice ||
        item.costPrice ||
        item.product?.purchase_price ||
        productCostMap.get(item.productId) ||
        productCostMap.get(item.product_id) ||
        productCostMap.get(item.id) ||
        0
      )
      saleCost += netQty * costPrice
    })

    const saleProfit = saleRevenue - saleCost
    todaysProfit += saleProfit
  })

  // 2. Today's Purchases Total
  const todaysPurchase = todayPurchases.reduce((sum, p) => sum + (Number(p.total ?? p.total_amount ?? p.totalAmount ?? 0)), 0)

  return {
    todaysSales: Math.round(todaysSales * 100) / 100,
    todaysPurchase: Math.round(todaysPurchase * 100) / 100,
    todaysProfit: Math.round(todaysProfit * 100) / 100,
    todaySalesCount: todaySales.length,
    todayPurchasesCount: todayPurchases.length,
  }
}

export function calculateBillSummary(items = [], billDiscount = 0, isInclusive = true) {
  let subtotal = 0, totalGST = 0, itemDiscountTotal = 0;
  let itemsTotal = 0;

  (items || []).forEach(item => {
    const unitRate = Number((item.rate ?? item.price ?? item.sellingPrice) || 0);
    const qty = Number(item.quantity || 0);
    const gross = unitRate * qty;
    const discount = (gross * Number(item.itemDiscount || 0)) / 100;
    const taxable = gross - discount;
    const rate = Number(item.gstRate || 0);

    itemsTotal += taxable;
    itemDiscountTotal += discount;
    if (rate > 0) {
      const base = taxable / (1 + rate / 100);
      subtotal += base;
      totalGST += taxable - base;
    } else {
      subtotal += taxable;
    }
  });

  // Normal ERP workflow: GST never added on top of MRP / selling price
  const beforeDiscount = Math.max(0, itemsTotal);
  const applicableSubtotal = beforeDiscount;

  // Parse billDiscount parameter (can be object, string like '10%', or number)
  let discountType = 'fixed';
  let discountValue = 0;

  if (billDiscount && typeof billDiscount === 'object') {
    const rawType = String(billDiscount.type || billDiscount.discountType || 'fixed').toLowerCase().trim();
    discountType = (rawType === 'percent' || rawType === 'percentage' || rawType === '%') ? 'percent' : 'fixed';
    discountValue = Number(billDiscount.value ?? billDiscount.amount ?? billDiscount.discount ?? 0);
  } else if (typeof billDiscount === 'string') {
    const str = billDiscount.trim();
    if (str.endsWith('%')) {
      discountType = 'percent';
      discountValue = parseFloat(str);
    } else {
      discountType = 'fixed';
      discountValue = parseFloat(str.replace(/[^0-9.-]/g, ''));
    }
  } else if (typeof billDiscount === 'number') {
    discountType = 'fixed';
    discountValue = billDiscount;
  }

  if (isNaN(discountValue) || discountValue <= 0 || applicableSubtotal <= 0) {
    discountValue = 0;
  }

  // Calculate discount amount based on mode
  let calculatedDiscount = 0;
  if (discountValue > 0 && applicableSubtotal > 0) {
    if (discountType === 'percent') {
      // Percentage mode: calculate percentage from applicable subtotal
      const clampedPct = Math.min(100, Math.max(0, discountValue));
      calculatedDiscount = (applicableSubtotal * clampedPct) / 100;
    } else {
      // Fixed ₹ mode: fixed amount
      calculatedDiscount = discountValue;
    }
  }

  // Final discount amount: cannot be negative and cannot exceed applicable subtotal
  const discountAmount = Math.max(0, Math.min(applicableSubtotal, Math.round(calculatedDiscount * 100) / 100));

  // Final grand total: max(0, applicableSubtotal - discountAmount)
  const grandTotal = Math.max(0, Math.round((beforeDiscount - discountAmount) * 100) / 100);

  return {
    subtotal: itemsTotal,
    taxableBase: subtotal,
    itemsTotal,
    beforeDiscount,
    totalGST,
    totalCGST: totalGST / 2,
    totalSGST: totalGST / 2,
    itemDiscountTotal,
    billDiscount,
    billDiscountType: discountType,
    billDiscountValue: discountValue,
    billDiscountAmount: discountAmount,
    discountAmount,
    grandTotal,
    roundedTotal: Math.round(grandTotal),
  };
}
export const iconPresets=['🛒','🍚','🌾','🍬','🧴','📦','🥛','⚖️']
export const colorPresets=['#10b981','#f59e0b','#ef4444','#d97706','#ec4899','#eab308','#f97316','#06b6d4','#8b5cf6','#6366f1','#3b82f6','#dc2626','#14b8a6']

export function numberToWordsINR(amount) {
  const num = Math.round(Number(amount || 0) * 100) / 100
  if (isNaN(num) || num <= 0) return 'Rupees Zero Only'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertTwoDigits(n) {
    if (n < 20) return ones[n]
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  }

  function convertThreeDigits(n) {
    let str = ''
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + ' Hundred'
      if (n % 100) str += ' '
    }
    if (n % 100 > 0) {
      str += convertTwoDigits(n % 100)
    }
    return str
  }

  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)

  let words = ''
  const crore = Math.floor(intPart / 10000000)
  const lakh = Math.floor((intPart % 10000000) / 100000)
  const thousand = Math.floor((intPart % 100000) / 1000)
  const remainder = intPart % 1000

  if (crore > 0) words += convertTwoDigits(crore) + ' Crore '
  if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh '
  if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand '
  if (remainder > 0) words += convertThreeDigits(remainder)

  words = words.trim()
  if (!words) words = 'Zero'

  let result = 'Rupees ' + words
  if (decPart > 0) {
    result += ' and ' + convertTwoDigits(decPart) + ' Paise'
  }
  result += ' Only'
  return result
}

