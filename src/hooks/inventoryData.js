import { getAllProducts, updateProduct } from './productData'

const LOGS_STORAGE_KEY = 'gt_inventory_logs'

// Seed initial log entries if they don't exist
function getInitialLogs() {
  const stored = localStorage.getItem(LOGS_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // fall through
    }
  }

  // Return empty array by default and cache it
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]))
  return []
}

// ─── Exported Functions ──────────────────────────────────────────

/**
 * Returns all stock transaction logs, sorted by timestamp descending
 */
export function getInventoryLogs() {
  const logs = getInitialLogs()
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

/**
 * Compiles a detailed summary of the current inventory stats
 */
export function getInventorySummary() {
  const products = getAllProducts()
  
  let totalCostValue = 0
  let totalRetailValue = 0
  let totalItems = products.length
  let lowStockCount = 0
  let outOfStockCount = 0

  products.forEach(p => {
    const stock = Number(p.currentStock) || 0
    const purchasePrice = Number(p.purchasePrice) || 0
    const sellingPrice = Number(p.sellingPrice) || 0
    const minStock = Number(p.minStock) || 10

    totalCostValue += purchasePrice * stock
    totalRetailValue += sellingPrice * stock

    if (stock === 0) {
      outOfStockCount++
    } else if (stock <= minStock) {
      lowStockCount++
    }
  })

  return {
    totalCostValue,
    totalRetailValue,
    totalItems,
    lowStockCount,
    outOfStockCount,
  }
}

/**
 * Adjusts stock level of a product and logs the change
 * @param {string} productId - Product ID
 * @param {number} adjustmentQty - Change amount (can be positive or negative, or absolute if type is reconcile)
 * @param {string} type - 'inward' (add), 'outward' (reduce), or 'reconcile' (set absolute value)
 * @param {string} reason - Human-readable reason for adjustment
 * @param {string} operator - Operator name/role
 */
export function adjustStock(productId, adjustmentQty, type, reason, operator = 'Admin') {
  const products = getAllProducts()
  const product = products.find(p => p.id === productId)
  if (!product) {
    return { error: 'Product not found' }
  }

  const prevStock = Number(product.currentStock) || 0
  let newStock = prevStock

  if (type === 'inward') {
    newStock = prevStock + Math.abs(adjustmentQty)
  } else if (type === 'outward') {
    newStock = Math.max(0, prevStock - Math.abs(adjustmentQty))
  } else if (type === 'reconcile') {
    newStock = Math.max(0, adjustmentQty)
  }

  // Update in productData (updates gt_products in localStorage)
  const updated = updateProduct(productId, { currentStock: newStock })
  if (!updated) {
    return { error: 'Failed to update product stock' }
  }

  // Save transaction log
  const logs = getInitialLogs()
  const newLog = {
    id: `TXN-${String(Math.floor(100000 + Math.random() * 900000))}`,
    productId,
    productName: product.name,
    productType: product.type,
    sku: product.sku || product.productCode || '',
    barcode: product.barcode,
    type,
    quantity: type === 'reconcile' ? newStock : Math.abs(adjustmentQty),
    prevStock,
    newStock,
    reason: reason || (type === 'inward' ? 'Stock Inward' : type === 'outward' ? 'Stock Outward' : 'Inventory Audit'),
    operator,
    timestamp: new Date().toISOString(),
  }

  logs.push(newLog)
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs))

  return { success: true, product: updated, log: newLog }
}

/**
 * Updates the minimum stock threshold of a product
 */
export function updateMinStockLimit(productId, minStockLimit) {
  const minStock = Math.max(0, Number(minStockLimit) || 0)
  const updated = updateProduct(productId, { minStock })
  if (!updated) {
    return { error: 'Failed to update minimum stock limit' }
  }
  return { success: true, product: updated }
}
