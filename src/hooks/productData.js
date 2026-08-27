// ─── Products Data Management ──────────────────────────────────
import { products as seedProducts, categories as seedCategories } from './posData'
import { moveToTrash } from './trashData'
import { queueSync } from '../supabase/syncManager'

const STORAGE_KEY = 'gt_products'
const CATEGORY_STORAGE_KEY = 'gt_categories'

// ─── Seed initial data ─────────────────────────────────────────
function getInitialProducts() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* fall through */ }
  }

  // Transform seed data into our product format
  const packaged = seedProducts
    .filter(p => !p.isLoose)
    .map((p, idx) => ({
      id: `PKG-${String(idx + 1).padStart(4, '0')}`,
      type: 'packaged',
      name: p.name,
      nameHi: p.nameHi || '',
      barcode: p.barcode,
      sku: `SKU-${String(idx + 1).padStart(5, '0')}`,
      category: p.category,
      brand: extractBrand(p.name),
      unit: p.unit,
      packSize: p.packSize,
      purchasePrice: p.price,
      sellingPrice: p.mrp,
      gstRate: p.gstRate,
      currentStock: p.stock,
      minStock: 10,
      createdAt: new Date().toISOString(),
    }))

  const loose = seedProducts
    .filter(p => p.isLoose)
    .map((p, idx) => ({
      id: `LOOSE-${String(idx + 1).padStart(4, '0')}`,
      type: 'loose',
      name: p.name,
      nameHi: p.nameHi || '',
      productCode: `LC-${String(idx + 1).padStart(4, '0')}`,
      barcode: p.barcode,
      category: p.category,
      unit: p.unit,
      purchasePrice: p.price,
      sellingPrice: p.mrp,
      gstRate: p.gstRate,
      currentStock: p.stock,
      minStock: 20,
      createdAt: new Date().toISOString(),
    }))

  const all = [...packaged, ...loose]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return all
}

function extractBrand(name) {
  const brands = [
    'Aashirvaad', 'Tata', 'Fortune', 'India Gate', 'Maggi', 'Amul',
    'Mother Dairy', 'Lays', 'Kurkure', 'Parle', 'Britannia', 'Haldiram',
    'Cadbury', 'Coca Cola', 'Pepsi', 'Nescafe', 'Bisleri', 'Real', 'Frooti',
    'Surf Excel', 'Vim', 'Harpic', 'Lizol', 'Scotch Brite', 'Colgate',
    'Lux', 'Dettol', 'Head & Shoulders', 'Clinic Plus', 'MDH', 'Everest',
    'Catch', 'Saffola',
  ]
  for (const b of brands) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b
  }
  return 'General'
}

// ─── Get Categories ────────────────────────────────────────────
export function getCategories() {
  const stored = localStorage.getItem(CATEGORY_STORAGE_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* fall through */ }
  }
  const cats = seedCategories.filter(c => c.id !== 'all')
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(cats))
  return cats
}

// ─── CRUD Operations ───────────────────────────────────────────
export function getAllProducts() {
  return getInitialProducts()
}

export function getPackagedProducts() {
  return getAllProducts().filter(p => p.type === 'packaged')
}

export function getLooseProducts() {
  return getAllProducts().filter(p => p.type === 'loose')
}

export function addProduct(product) {
  const all = getAllProducts()
  const newProduct = {
    ...product,
    id: product.type === 'packaged'
      ? `PKG-${String(all.length + 1).padStart(4, '0')}`
      : `LOOSE-${String(all.length + 1).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
  }
  all.push(newProduct)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('products', 'insert', newProduct)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gt_products_updated'))
  }
  return newProduct
}

export function updateProduct(id, updates) {
  const all = getAllProducts()
  const idx = all.findIndex(p => p.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('products', 'update', all[idx])
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gt_products_updated'))
  }
  return all[idx]
}

export function deleteProduct(id) {
  let all = getAllProducts()
  const target = all.find(p => p.id === id)
  if (target) {
    moveToTrash('product', target)
    all = all.filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    queueSync('products', 'delete', target)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gt_products_updated'))
    }
    return true
  }
  return false
}

export function searchProductsByQuery(query, type = 'all') {
  const q = query.toLowerCase().trim()
  let all = getAllProducts()
  if (type !== 'all') all = all.filter(p => p.type === type)
  if (!q) return all
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.nameHi && p.nameHi.includes(q)) ||
    (p.barcode && p.barcode.toLowerCase().includes(q)) ||
    (p.sku && p.sku.toLowerCase().includes(q)) ||
    (p.productCode && p.productCode.toLowerCase().includes(q)) ||
    (p.brand && p.brand.toLowerCase().includes(q)) ||
    (p.category && p.category.toLowerCase().includes(q))
  )
}

// ─── Generate next SKU / Product Code ──────────────────────────
export function generateNextSKU() {
  const packaged = getPackagedProducts()
  const num = packaged.length + 1
  return `SKU-${String(num).padStart(5, '0')}`
}

export function generateNextProductCode() {
  const loose = getLooseProducts()
  const num = loose.length + 1
  return `LC-${String(num).padStart(4, '0')}`
}

export function generateNextBarcode(type) {
  if (type === 'loose') {
    const loose = getLooseProducts()
    return `LOOSE${String(loose.length + 1).padStart(3, '0')}`
  }
  return ''
}

// ─── Format currency ───────────────────────────────────────────
export function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ─── Unit options ──────────────────────────────────────────────
export const unitOptions = [
  { value: 'Piece', label: 'Piece' },
  { value: 'Kg', label: 'Kg' },
  { value: 'Gram', label: 'Gram' },
  { value: 'Litre', label: 'Litre' },
  { value: 'ML', label: 'ML' },
  { value: 'Pack', label: 'Pack' },
  { value: 'Box', label: 'Box' },
  { value: 'Bottle', label: 'Bottle' },
  { value: 'Dozen', label: 'Dozen' },
  { value: 'Meter', label: 'Meter' },
  { value: 'Other', label: 'Other' },
  // Compatibility fallbacks so old codes don't break select components in ProductsPage.jsx
  { value: 'pcs', label: 'Piece (pcs)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'L', label: 'Litre (L)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'meter', label: 'Meter' },
  { value: 'other', label: 'Other' },
]

// ─── GST Rate options ──────────────────────────────────────────
export const gstOptions = [
  { value: 0, label: '0% (No GST)' },
  { value: 5, label: '5% GST' },
  { value: 12, label: '12% GST' },
  { value: 18, label: '18% GST' },
  { value: 28, label: '28% GST' },
]
