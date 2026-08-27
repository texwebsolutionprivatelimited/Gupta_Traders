import { queueSync } from '../supabase/syncManager'

// ─── POS Data & Utilities ──────────────────────────────────────
// Sample product catalog for Gupta Traders with barcodes, GST rates, etc.

export const categories = [
  { id: 'all', name: 'All' },
  { id: 'grocery', name: 'Grocery' },
  { id: 'dairy', name: 'Dairy' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'household', name: 'Household' },
  { id: 'personal', name: 'Personal Care' },
  { id: 'spices', name: 'Spices' },
  { id: 'oils', name: 'Oils & Ghee' },
  { id: 'loose', name: 'Loose Items' },
]

export const products = [
  // ─── Grocery ────────────────────────
  { id: 1, name: 'Aashirvaad Atta', nameHi: 'आशीर्वाद आटा', barcode: '8901063010017', price: 285, mrp: 310, gstRate: 0, category: 'grocery', unit: 'kg', packSize: '5 kg', stock: 45, isLoose: false },
  { id: 2, name: 'Tata Salt', nameHi: 'टाटा नमक', barcode: '8901725181123', price: 28, mrp: 28, gstRate: 0, category: 'grocery', unit: 'kg', packSize: '1 kg', stock: 120, isLoose: false },
  { id: 3, name: 'Fortune Rice', nameHi: 'फॉर्च्यून चावल', barcode: '8901058851427', price: 72, mrp: 80, gstRate: 5, category: 'grocery', unit: 'kg', packSize: '1 kg', stock: 60, isLoose: false },
  { id: 4, name: 'India Gate Basmati', nameHi: 'इंडिया गेट बासमती', barcode: '8901401011310', price: 195, mrp: 210, gstRate: 5, category: 'grocery', unit: 'kg', packSize: '1 kg', stock: 35, isLoose: false },
  { id: 5, name: 'Toor Dal (Arhar)', nameHi: 'तूर दाल (अरहर)', barcode: '8901058000101', price: 155, mrp: 165, gstRate: 0, category: 'grocery', unit: 'kg', packSize: '1 kg', stock: 50, isLoose: false },
  { id: 6, name: 'Moong Dal', nameHi: 'मूंग दाल', barcode: '8901058000201', price: 130, mrp: 140, gstRate: 0, category: 'grocery', unit: 'kg', packSize: '1 kg', stock: 40, isLoose: false },
  { id: 7, name: 'Sugar', nameHi: 'चीनी', barcode: '8901058000301', price: 45, mrp: 48, gstRate: 5, category: 'grocery', unit: 'kg', packSize: '1 kg', stock: 80, isLoose: false },
  { id: 8, name: 'Maggi Noodles', nameHi: 'मैगी नूडल्स', barcode: '8901058811087', price: 14, mrp: 14, gstRate: 12, category: 'grocery', unit: 'pcs', packSize: '70g', stock: 200, isLoose: false },

  // ─── Dairy ──────────────────────────
  { id: 9, name: 'Amul Butter', nameHi: 'अमूल बटर', barcode: '8901262011112', price: 56, mrp: 57, gstRate: 12, category: 'dairy', unit: 'pcs', packSize: '100g', stock: 30, isLoose: false },
  { id: 10, name: 'Mother Dairy Milk', nameHi: 'मदर डेयरी दूध', barcode: '8901262021113', price: 30, mrp: 30, gstRate: 0, category: 'dairy', unit: 'pcs', packSize: '500ml', stock: 50, isLoose: false },
  { id: 11, name: 'Amul Cheese Slice', nameHi: 'अमूल चीज़ स्लाइस', barcode: '8901262031114', price: 35, mrp: 38, gstRate: 12, category: 'dairy', unit: 'pcs', packSize: '100g', stock: 25, isLoose: false },
  { id: 12, name: 'Amul Paneer', nameHi: 'अमूल पनीर', barcode: '8901262041115', price: 90, mrp: 95, gstRate: 12, category: 'dairy', unit: 'pcs', packSize: '200g', stock: 15, isLoose: false },
  { id: 13, name: 'Curd (Dahi)', nameHi: 'दही', barcode: '8901262051116', price: 35, mrp: 35, gstRate: 0, category: 'dairy', unit: 'pcs', packSize: '400g', stock: 20, isLoose: false },

  // ─── Snacks ─────────────────────────
  { id: 14, name: 'Lays Classic', nameHi: 'लेज़ क्लासिक', barcode: '8901491101189', price: 20, mrp: 20, gstRate: 12, category: 'snacks', unit: 'pcs', packSize: '52g', stock: 100, isLoose: false },
  { id: 15, name: 'Kurkure Masala', nameHi: 'कुरकुरे मसाला', barcode: '8901491102196', price: 10, mrp: 10, gstRate: 12, category: 'snacks', unit: 'pcs', packSize: '30g', stock: 150, isLoose: false },
  { id: 16, name: 'Parle-G Biscuit', nameHi: 'पारले-जी बिस्कुट', barcode: '8901725133511', price: 10, mrp: 10, gstRate: 18, category: 'snacks', unit: 'pcs', packSize: '79g', stock: 200, isLoose: false },
  { id: 17, name: 'Britannia Good Day', nameHi: 'ब्रिटानिया गुड डे', barcode: '8901063010113', price: 30, mrp: 30, gstRate: 18, category: 'snacks', unit: 'pcs', packSize: '150g', stock: 80, isLoose: false },
  { id: 18, name: 'Haldiram Bhujia', nameHi: 'हल्दीराम भुजिया', barcode: '8904004401011', price: 55, mrp: 60, gstRate: 12, category: 'snacks', unit: 'pcs', packSize: '200g', stock: 60, isLoose: false },
  { id: 19, name: 'Cadbury Dairy Milk', nameHi: 'कैडबरी डेयरी मिल्क', barcode: '8901233021126', price: 40, mrp: 40, gstRate: 28, category: 'snacks', unit: 'pcs', packSize: '50g', stock: 90, isLoose: false },

  // ─── Beverages ──────────────────────
  { id: 20, name: 'Coca Cola', nameHi: 'कोका कोला', barcode: '5449000000996', price: 40, mrp: 40, gstRate: 28, category: 'beverages', unit: 'pcs', packSize: '750ml', stock: 70, isLoose: false },
  { id: 21, name: 'Pepsi', nameHi: 'पेप्सी', barcode: '8901233011127', price: 40, mrp: 40, gstRate: 28, category: 'beverages', unit: 'pcs', packSize: '750ml', stock: 65, isLoose: false },
  { id: 22, name: 'Tata Tea Gold', nameHi: 'टाटा टी गोल्ड', barcode: '8901176010116', price: 155, mrp: 160, gstRate: 5, category: 'beverages', unit: 'pcs', packSize: '250g', stock: 40, isLoose: false },
  { id: 23, name: 'Nescafe Classic', nameHi: 'नेस्कैफे क्लासिक', barcode: '7613036685122', price: 195, mrp: 210, gstRate: 18, category: 'beverages', unit: 'pcs', packSize: '100g', stock: 25, isLoose: false },
  { id: 24, name: 'Bisleri Water', nameHi: 'बिसलेरी पानी', barcode: '8901063111017', price: 20, mrp: 20, gstRate: 18, category: 'beverages', unit: 'pcs', packSize: '1L', stock: 100, isLoose: false },
  { id: 25, name: 'Real Mango Juice', nameHi: 'रियल मैंगो जूस', barcode: '8901396313113', price: 25, mrp: 25, gstRate: 12, category: 'beverages', unit: 'pcs', packSize: '200ml', stock: 55, isLoose: false },
  { id: 26, name: 'Frooti', nameHi: 'फ्रूटी', barcode: '8901396111115', price: 10, mrp: 10, gstRate: 12, category: 'beverages', unit: 'pcs', packSize: '200ml', stock: 120, isLoose: false },

  // ─── Household ──────────────────────
  { id: 27, name: 'Surf Excel', nameHi: 'सर्फ एक्सेल', barcode: '8901030555119', price: 125, mrp: 135, gstRate: 28, category: 'household', unit: 'pcs', packSize: '1 kg', stock: 30, isLoose: false },
  { id: 28, name: 'Vim Bar', nameHi: 'विम बार', barcode: '8901030566116', price: 10, mrp: 10, gstRate: 18, category: 'household', unit: 'pcs', packSize: '155g', stock: 80, isLoose: false },
  { id: 29, name: 'Harpic', nameHi: 'हार्पिक', barcode: '8901199010118', price: 82, mrp: 89, gstRate: 18, category: 'household', unit: 'pcs', packSize: '500ml', stock: 35, isLoose: false },
  { id: 30, name: 'Lizol Floor Cleaner', nameHi: 'लाइज़ोल', barcode: '8901199020119', price: 115, mrp: 125, gstRate: 18, category: 'household', unit: 'pcs', packSize: '500ml', stock: 25, isLoose: false },
  { id: 31, name: 'Scotch Brite', nameHi: 'स्कॉच ब्राइट', barcode: '8901058811188', price: 30, mrp: 30, gstRate: 18, category: 'household', unit: 'pcs', packSize: '1 pc', stock: 50, isLoose: false },

  // ─── Personal Care ──────────────────
  { id: 32, name: 'Colgate Toothpaste', nameHi: 'कोलगेट टूथपेस्ट', barcode: '8901314010116', price: 55, mrp: 58, gstRate: 18, category: 'personal', unit: 'pcs', packSize: '100g', stock: 45, isLoose: false },
  { id: 33, name: 'Lux Soap', nameHi: 'लक्स साबुन', barcode: '8901030577118', price: 38, mrp: 40, gstRate: 18, category: 'personal', unit: 'pcs', packSize: '100g', stock: 60, isLoose: false },
  { id: 34, name: 'Dettol Handwash', nameHi: 'डेटॉल हैंडवॉश', barcode: '8901199044119', price: 99, mrp: 110, gstRate: 18, category: 'personal', unit: 'pcs', packSize: '200ml', stock: 30, isLoose: false },
  { id: 35, name: 'Head & Shoulders', nameHi: 'हेड एंड शोल्डर्स', barcode: '8901030512116', price: 175, mrp: 195, gstRate: 18, category: 'personal', unit: 'pcs', packSize: '180ml', stock: 20, isLoose: false },
  { id: 36, name: 'Clinic Plus Shampoo', nameHi: 'क्लिनिक प्लस शैम्पू', barcode: '8901030611117', price: 2, mrp: 2, gstRate: 18, category: 'personal', unit: 'pcs', packSize: 'Sachet', stock: 300, isLoose: false },

  // ─── Spices ─────────────────────────
  { id: 37, name: 'MDH Chana Masala', nameHi: 'MDH चना मसाला', barcode: '8901042401011', price: 68, mrp: 75, gstRate: 5, category: 'spices', unit: 'pcs', packSize: '100g', stock: 40, isLoose: false },
  { id: 38, name: 'Everest Garam Masala', nameHi: 'एवरेस्ट गरम मसाला', barcode: '8901042501012', price: 75, mrp: 82, gstRate: 5, category: 'spices', unit: 'pcs', packSize: '100g', stock: 35, isLoose: false },
  { id: 39, name: 'Catch Turmeric', nameHi: 'कैच हल्दी', barcode: '8901042601013', price: 42, mrp: 48, gstRate: 5, category: 'spices', unit: 'pcs', packSize: '100g', stock: 50, isLoose: false },
  { id: 40, name: 'Red Chilli Powder', nameHi: 'लाल मिर्च पाउडर', barcode: '8901042701014', price: 55, mrp: 60, gstRate: 5, category: 'spices', unit: 'pcs', packSize: '100g', stock: 45, isLoose: false },

  // ─── Oils & Ghee ────────────────────
  { id: 41, name: 'Fortune Soyabean Oil', nameHi: 'फॉर्च्यून सोयाबीन तेल', barcode: '8901058851528', price: 155, mrp: 165, gstRate: 5, category: 'oils', unit: 'L', packSize: '1 L', stock: 30, isLoose: false },
  { id: 42, name: 'Saffola Gold Oil', nameHi: 'सैफोला गोल्ड तेल', barcode: '8901058851629', price: 185, mrp: 199, gstRate: 5, category: 'oils', unit: 'L', packSize: '1 L', stock: 25, isLoose: false },
  { id: 43, name: 'Amul Ghee', nameHi: 'अमूल घी', barcode: '8901262061117', price: 560, mrp: 575, gstRate: 12, category: 'oils', unit: 'pcs', packSize: '1 L', stock: 15, isLoose: false },
  { id: 44, name: 'Mustard Oil', nameHi: 'सरसों का तेल', barcode: '8901058851730', price: 175, mrp: 190, gstRate: 5, category: 'oils', unit: 'L', packSize: '1 L', stock: 20, isLoose: false },

  // ─── Loose Items (sold by weight) ───
  { id: 45, name: 'Loose Atta', nameHi: 'खुला आटा', barcode: 'LOOSE001', price: 38, mrp: 38, gstRate: 0, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 500, isLoose: true },
  { id: 46, name: 'Loose Sugar', nameHi: 'खुली चीनी', barcode: 'LOOSE002', price: 42, mrp: 42, gstRate: 5, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 300, isLoose: true },
  { id: 47, name: 'Loose Rice', nameHi: 'खुला चावल', barcode: 'LOOSE003', price: 55, mrp: 55, gstRate: 0, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 400, isLoose: true },
  { id: 48, name: 'Loose Toor Dal', nameHi: 'खुली तूर दाल', barcode: 'LOOSE004', price: 140, mrp: 140, gstRate: 0, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 200, isLoose: true },
  { id: 49, name: 'Loose Moong Dal', nameHi: 'खुली मूंग दाल', barcode: 'LOOSE005', price: 120, mrp: 120, gstRate: 0, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 150, isLoose: true },
  { id: 50, name: 'Loose Chana Dal', nameHi: 'खुली चना दाल', barcode: 'LOOSE006', price: 95, mrp: 95, gstRate: 0, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 180, isLoose: true },
  { id: 51, name: 'Loose Peanuts', nameHi: 'खुली मूंगफली', barcode: 'LOOSE007', price: 110, mrp: 110, gstRate: 0, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 100, isLoose: true },
  { id: 52, name: 'Loose Jaggery', nameHi: 'खुला गुड़', barcode: 'LOOSE008', price: 60, mrp: 60, gstRate: 0, category: 'loose', unit: 'kg', packSize: 'per kg', stock: 80, isLoose: true },
]

function toPOSProduct(p) {
  if (!p) return null
  return {
    ...p,
    price: Number(p.sellingPrice) || 0,
    mrp: Number(p.sellingPrice) || 0,
    stock: Number(p.currentStock) || 0,
    isLoose: p.type === 'loose',
  }
}

function getLiveProducts() {
  const stored = localStorage.getItem('gt_products')
  if (stored) {
    try {
      const all = JSON.parse(stored)
      if (Array.isArray(all)) {
        return all.map(toPOSProduct)
      }
    } catch {
      // fall through
    }
  }
  return []
}

// ─── Search Products ─────────────────────────────────────────────
export function searchProducts(query, categoryFilter = 'all') {
  const q = query.toLowerCase().trim()
  const liveProducts = getLiveProducts()
  return liveProducts.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    if (!q) return matchesCategory
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      (p.nameHi && p.nameHi.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    return matchesQuery && matchesCategory
  })
}

// ─── Barcode Lookup ──────────────────────────────────────────────
export function lookupBarcode(barcode) {
  const liveProducts = getLiveProducts()
  const cleanBarcode = barcode.trim().toLowerCase()
  return liveProducts.find(p => p.barcode && p.barcode.trim().toLowerCase() === cleanBarcode) || null
}

// ─── Bill Number Generator ───────────────────────────────────────
let billCounter = parseInt(localStorage.getItem('gt_bill_counter') || '1000', 10)

export function generateBillNumber() {
  billCounter++
  localStorage.setItem('gt_bill_counter', billCounter.toString())
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  return `GT-${dateStr}-${billCounter}`
}

// ─── GST Calculation ─────────────────────────────────────────────
export function calculateItemGST(price, quantity, gstRate, isInclusive = false) {
  const baseAmount = price * quantity
  if (isInclusive) {
    const taxableAmount = baseAmount / (1 + gstRate / 100)
    const gstAmount = baseAmount - taxableAmount
    return {
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgst: Math.round((gstAmount / 2) * 100) / 100,
      sgst: Math.round((gstAmount / 2) * 100) / 100,
      totalGST: Math.round(gstAmount * 100) / 100,
      totalAmount: baseAmount,
    }
  }
  const gstAmount = baseAmount * (gstRate / 100)
  return {
    taxableAmount: baseAmount,
    cgst: Math.round((gstAmount / 2) * 100) / 100,
    sgst: Math.round((gstAmount / 2) * 100) / 100,
    totalGST: Math.round(gstAmount * 100) / 100,
    totalAmount: Math.round((baseAmount + gstAmount) * 100) / 100,
  }
}

// ─── Calculate full bill summary ─────────────────────────────────
export function calculateBillSummary(cartItems, billDiscount = 0, isGSTInclusive = true) {
  let subtotal = 0
  let totalGST = 0
  let totalCGST = 0
  let totalSGST = 0

  const itemsWithGST = cartItems.map(item => {
    const discountedPrice = item.price - (item.itemDiscount || 0)
    const lineTotal = discountedPrice * item.quantity
    const gst = calculateItemGST(discountedPrice, item.quantity, item.gstRate, isGSTInclusive)

    subtotal += gst.taxableAmount
    totalGST += gst.totalGST
    totalCGST += gst.cgst
    totalSGST += gst.sgst

    return { ...item, lineTotal, gst }
  })

  const discountAmount = billDiscount
  const grandTotal = isGSTInclusive
    ? itemsWithGST.reduce((sum, item) => sum + item.lineTotal, 0) - discountAmount
    : subtotal - discountAmount + totalGST

  return {
    items: itemsWithGST,
    subtotal: Math.round(subtotal * 100) / 100,
    totalCGST: Math.round(totalCGST * 100) / 100,
    totalSGST: Math.round(totalSGST * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  }
}

// ─── Format currency in Indian style ─────────────────────────────
export function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Saved bills for reprint (persisted in localStorage) ─────────
export function saveBill(bill) {
  const bills = JSON.parse(localStorage.getItem('gt_completed_bills') || '[]')
  bills.unshift(bill)
  // Keep only last 50 bills
  if (bills.length > 50) bills.length = 50
  localStorage.setItem('gt_completed_bills', JSON.stringify(bills))

  // Map POS bill to salesHistory format so it populates the dashboards and reports
  const mappedSale = {
    id: `SAL-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    date: bill.timestamp.split('T')[0],
    customer: bill.customerName || 'Walk-in Customer',
    invoice: bill.billNumber,
    items: bill.items.map(item => ({
      id: item.id,
      product: item.name,
      quantity: Number(item.quantity) || 0,
      salesPrice: Number(item.price) || 0,
      gst: Number(item.gstRate) || 0
    })),
    itemCount: bill.items.length,
    subtotal: Number(bill.summary.subtotal) || 0,
    gst: Number(bill.summary.totalGST) || 0,
    total: Number(bill.summary.grandTotal) || 0,
    status: 'Completed',
    payment: bill.paymentMode === 'Credit' ? 'Pending' : 'Paid',
    paymentMode: bill.paymentMode || 'Cash',
    notes: 'POS Billed Transaction',
    createdAt: bill.timestamp
  }

  const salesHistory = JSON.parse(localStorage.getItem('salesHistory') || '[]')
  salesHistory.unshift(mappedSale)
  localStorage.setItem('salesHistory', JSON.stringify(salesHistory))

  // Queue background push sync to Supabase
  queueSync('sales', 'insert', mappedSale)
}

export function getSavedBills() {
  return JSON.parse(localStorage.getItem('gt_completed_bills') || '[]')
}

export function getHeldBills() {
  return JSON.parse(localStorage.getItem('gt_held_bills') || '[]')
}

export function saveHeldBills(bills) {
  localStorage.setItem('gt_held_bills', JSON.stringify(bills))
}
