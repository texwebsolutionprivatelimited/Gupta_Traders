// ─── Trash Data Management ──────────────────────────────────
const TRASH_KEY = 'gt_trash_items'

export function getTrashItems() {
  const stored = localStorage.getItem(TRASH_KEY)
  let items = []
  if (stored) {
    try {
      items = JSON.parse(stored)
    } catch (e) {
      items = []
    }
  }

  // Auto-cleanup items older than 30 days
  const now = new Date()
  const expiryLimit = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  const validItems = items.filter(item => {
    const deletedTime = new Date(item.deletedAt).getTime()
    return (now.getTime() - deletedTime) < expiryLimit
  })

  if (validItems.length !== items.length) {
    localStorage.setItem(TRASH_KEY, JSON.stringify(validItems))
  }

  return validItems
}

export function moveToTrash(type, item) {
  const items = getTrashItems()
  const trashId = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const trashItem = {
    trashId,
    type, // 'product' | 'category' | 'supplier' | 'customer'
    originalId: item.id,
    deletedAt: new Date().toISOString(),
    data: item
  }
  items.push(trashItem)
  localStorage.setItem(TRASH_KEY, JSON.stringify(items))
  return true
}

export function restoreFromTrash(trashId) {
  const items = getTrashItems()
  const idx = items.findIndex(item => item.trashId === trashId)
  if (idx === -1) return { error: 'Item not found in Trash' }

  const trashItem = items[idx]
  const { type, data } = trashItem

  let storageKey = ''
  let list = []

  if (type === 'product') {
    storageKey = 'gt_products'
    const stored = localStorage.getItem(storageKey)
    list = stored ? JSON.parse(stored) : []

    // Check ID collision
    if (list.some(x => x.id === data.id)) {
      const prefix = data.type === 'packaged' ? 'PKG-' : 'LOOSE-'
      const existingNums = list
        .filter(x => x.id.startsWith(prefix))
        .map(x => parseInt(x.id.replace(prefix, ''), 10))
        .filter(n => !isNaN(n))
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : list.length + 1
      data.id = `${prefix}${String(nextNum).padStart(4, '0')}`
      if (data.type === 'packaged') {
        data.sku = `SKU-${String(nextNum).padStart(5, '0')}`
      } else {
        data.productCode = `LC-${String(nextNum).padStart(4, '0')}`
      }
    }
    list.push(data)
  } else if (type === 'category') {
    storageKey = 'gt_categories_v2'
    const stored = localStorage.getItem(storageKey)
    list = stored ? JSON.parse(stored) : []

    // Check ID collision (slug based)
    if (list.some(x => x.id === data.id)) {
      let suffix = 1
      let newId = `${data.id}-${suffix}`
      while (list.some(x => x.id === newId)) {
        suffix++
        newId = `${data.id}-${suffix}`
      }
      data.id = newId
    }
    list.push(data)
  } else if (type === 'supplier') {
    storageKey = 'gt_suppliers'
    const stored = localStorage.getItem(storageKey)
    list = stored ? JSON.parse(stored) : []

    // Check ID collision
    if (list.some(x => x.id === data.id)) {
      const prefix = 'SUP-'
      const existingNums = list
        .filter(x => x.id.startsWith(prefix))
        .map(x => parseInt(x.id.replace(prefix, ''), 10))
        .filter(n => !isNaN(n))
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : list.length + 1
      data.id = `${prefix}${String(nextNum).padStart(4, '0')}`
    }
    list.push(data)
  } else if (type === 'customer') {
    storageKey = 'gt_customers'
    const stored = localStorage.getItem(storageKey)
    list = stored ? JSON.parse(stored) : []

    // Check ID collision
    if (list.some(x => x.id === data.id)) {
      const prefix = 'CUST-'
      const existingNums = list
        .filter(x => x.id.startsWith(prefix))
        .map(x => parseInt(x.id.replace(prefix, ''), 10))
        .filter(n => !isNaN(n))
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : list.length + 1
      data.id = `${prefix}${String(nextNum).padStart(4, '0')}`
    }
    list.push(data)
  }

  // Save the restored list
  if (storageKey) {
    localStorage.setItem(storageKey, JSON.stringify(list))
  }

  // Remove from Trash
  items.splice(idx, 1)
  localStorage.setItem(TRASH_KEY, JSON.stringify(items))

  return { success: true, restoredItem: data }
}

export function permanentlyDeleteFromTrash(trashId) {
  const items = getTrashItems()
  const filtered = items.filter(item => item.trashId !== trashId)
  localStorage.setItem(TRASH_KEY, JSON.stringify(filtered))
  return true
}

export function emptyTrash() {
  localStorage.setItem(TRASH_KEY, JSON.stringify([]))
  return true
}
