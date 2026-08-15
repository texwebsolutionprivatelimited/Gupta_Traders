// ─── Categories Data Management ────────────────────────────────
import { categories as seedCategories } from './posData'
import { getAllProducts } from './productData'

const CATEGORY_STORAGE_KEY = 'gt_categories_v2'

// ─── Default category metadata ─────────────────────────────────
const defaultCategoryMeta = {
  grocery: { icon: '🛒', color: '#10b981', description: 'Staples, grains, and everyday food items' },
  rice: { icon: '🍚', color: '#f59e0b', description: 'All varieties of rice — basmati, sona masoori, etc.' },
  pulses: { icon: '🫘', color: '#ef4444', description: 'Dals, lentils, and legumes' },
  flour: { icon: '🌾', color: '#d97706', description: 'Wheat flour, besan, maida, sooji, etc.' },
  sugar: { icon: '🍬', color: '#ec4899', description: 'Sugar, jaggery, and sweeteners' },
  oil: { icon: '🫒', color: '#eab308', description: 'Cooking oils, ghee, and vanaspati' },
  oils: { icon: '🫒', color: '#eab308', description: 'Cooking oils, ghee, and vanaspati' },
  snacks: { icon: '🍿', color: '#f97316', description: 'Chips, biscuits, namkeen, chocolates' },
  beverages: { icon: '🥤', color: '#06b6d4', description: 'Cold drinks, juices, tea, coffee' },
  personal: { icon: '🧴', color: '#8b5cf6', description: 'Soaps, shampoo, toothpaste, skincare' },
  household: { icon: '🏠', color: '#6366f1', description: 'Detergents, cleaners, and home essentials' },
  dairy: { icon: '🥛', color: '#3b82f6', description: 'Milk, butter, paneer, curd, cheese' },
  spices: { icon: '🌶️', color: '#dc2626', description: 'Masalas, turmeric, chilli powder, whole spices' },
  loose: { icon: '⚖️', color: '#14b8a6', description: 'Items sold by weight — atta, dal, rice, etc.' },
}

// ─── Category icon/color presets for new categories ────────────
export const iconPresets = [
  '🛒', '🍚', '🫘', '🌾', '🍬', '🫒', '🍿', '🥤', '🧴', '🏠',
  '🥛', '🌶️', '⚖️', '🧹', '🍞', '🧈', '🫙', '🍯', '🧃', '🍪',
  '🧂', '🥜', '☕', '🫖', '🍶', '🧊', '💊', '🪥', '🧻', '📦',
]

export const colorPresets = [
  '#10b981', '#f59e0b', '#ef4444', '#d97706', '#ec4899',
  '#eab308', '#f97316', '#06b6d4', '#8b5cf6', '#6366f1',
  '#3b82f6', '#dc2626', '#14b8a6', '#84cc16', '#a855f7',
  '#e11d48', '#0891b2', '#059669', '#7c3aed', '#db2777',
]

// ─── Initialize categories ─────────────────────────────────────
function getInitialCategories() {
  const stored = localStorage.getItem(CATEGORY_STORAGE_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* fall through */ }
  }

  // Build from seed + the user's requested default list
  const defaultCategories = [
    { id: 'grocery', name: 'Grocery' },
    { id: 'rice', name: 'Rice' },
    { id: 'pulses', name: 'Pulses' },
    { id: 'flour', name: 'Flour' },
    { id: 'sugar', name: 'Sugar' },
    { id: 'oil', name: 'Oil' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'personal', name: 'Personal Care' },
    { id: 'household', name: 'Household' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'spices', name: 'Spices' },
    { id: 'oils', name: 'Oils & Ghee' },
    { id: 'loose', name: 'Loose Items' },
  ]

  // Merge seed categories that aren't already in defaults
  const existingIds = new Set(defaultCategories.map(c => c.id))
  for (const seed of seedCategories) {
    if (seed.id !== 'all' && !existingIds.has(seed.id)) {
      defaultCategories.push({ id: seed.id, name: seed.name })
    }
  }

  // Enrich with metadata
  const enriched = defaultCategories.map((cat, idx) => ({
    ...cat,
    icon: defaultCategoryMeta[cat.id]?.icon || '📦',
    color: defaultCategoryMeta[cat.id]?.color || colorPresets[idx % colorPresets.length],
    description: defaultCategoryMeta[cat.id]?.description || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    sortOrder: idx,
  }))

  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(enriched))
  return enriched
}

// ─── CRUD Operations ───────────────────────────────────────────
export function getCategoriesV2() {
  return getInitialCategories()
}

export function addCategory(category) {
  const all = getCategoriesV2()

  // Generate a slug ID from the name
  const id = category.id || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Check for duplicates
  if (all.some(c => c.id === id)) {
    return { error: 'A category with this name already exists' }
  }

  const newCategory = {
    id,
    name: category.name.trim(),
    icon: category.icon || '📦',
    color: category.color || colorPresets[all.length % colorPresets.length],
    description: (category.description || '').trim(),
    image: category.image || '',
    status: category.status || 'active',
    createdAt: new Date().toISOString(),
    sortOrder: all.length,
  }

  all.push(newCategory)
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(all))
  return { data: newCategory }
}

export function updateCategory(id, updates) {
  const all = getCategoriesV2()
  const idx = all.findIndex(c => c.id === id)
  if (idx === -1) return { error: 'Category not found' }

  // If renaming, check for duplicate name
  if (updates.name && updates.name !== all[idx].name) {
    const newId = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (all.some(c => c.id === newId && c.id !== id)) {
      return { error: 'A category with this name already exists' }
    }
  }

  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(all))
  return { data: all[idx] }
}

export function deleteCategory(id) {
  let all = getCategoriesV2()
  all = all.filter(c => c.id !== id)
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(all))
  return true
}

export function reorderCategories(orderedIds) {
  const all = getCategoriesV2()
  const reordered = orderedIds
    .map((id, idx) => {
      const cat = all.find(c => c.id === id)
      return cat ? { ...cat, sortOrder: idx } : null
    })
    .filter(Boolean)
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(reordered))
  return reordered
}

// ─── Helpers ───────────────────────────────────────────────────
export function getProductCountByCategory() {
  try {
    const products = getAllProducts()
    const counts = {}
    for (const p of products) {
      const cat = (p.category || 'uncategorized').toLowerCase()
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  } catch {
    return {}
  }
}