// ─── Suppliers Data Management ──────────────────────────────────
import { moveToTrash } from './trashData'
import { queueSync } from '../supabase/syncManager'
const STORAGE_KEY = 'gt_suppliers'

// ─── Seed initial suppliers data ────────────────────────────────
function getInitialSuppliers() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      /* fall through */
    }
  }

  // Return empty array by default and cache it
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  return []
}

// ─── CRUD Operations ───────────────────────────────────────────

export function getSuppliers() {
  return getInitialSuppliers()
}

export function addSupplier(supplier) {
  const all = getSuppliers()
  const nextNum = all.length + 1
  const id = `SUP-${String(nextNum).padStart(4, '0')}`

  const openingBalance = Number(supplier.openingBalance) || 0
  const now = new Date().toISOString()

  const newSupplier = {
    id,
    companyName: supplier.companyName.trim(),
    contactPerson: (supplier.contactPerson || '').trim(),
    phone: (supplier.phone || '').trim(),
    email: (supplier.email || '').trim(),
    address: (supplier.address || '').trim(),
    city: (supplier.city || '').trim(),
    gstin: (supplier.gstin || '').trim().toUpperCase(),
    outstandingBalance: openingBalance,
    status: supplier.status || 'active',
    productsSupplied: supplier.productsSupplied || [],
    createdAt: now,
    ledger: [
      {
        id: `TXN-INIT-${Date.now()}`,
        date: now,
        type: 'opening_balance',
        description: 'Opening Balance',
        amount: openingBalance,
        balanceAfter: openingBalance,
      },
    ],
  }

  all.push(newSupplier)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('suppliers', 'insert', newSupplier)
  return { data: newSupplier }
}

export function updateSupplier(id, updates) {
  const all = getSuppliers()
  const idx = all.findIndex(s => s.id === id)
  if (idx === -1) return { error: 'Supplier not found' }

  all[idx] = {
    ...all[idx],
    ...updates,
    companyName: updates.companyName ? updates.companyName.trim() : all[idx].companyName,
    gstin: updates.gstin ? updates.gstin.trim().toUpperCase() : all[idx].gstin,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('suppliers', 'update', all[idx])
  return { data: all[idx] }
}

export function deleteSupplier(id) {
  let all = getSuppliers()
  const target = all.find(s => s.id === id)
  if (!target) return { error: 'Supplier not found' }

  moveToTrash('supplier', target)
  all = all.filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('suppliers', 'delete', target)
  return { success: true }
}

// ─── Transaction Ledger Entries ───────────────────────────────

export function recordSupplierTransaction(id, transaction) {
  const all = getSuppliers()
  const idx = all.findIndex(s => s.id === id)
  if (idx === -1) return { error: 'Supplier not found' }

  const supplier = all[idx]
  const amount = Number(transaction.amount) || 0
  const type = transaction.type // 'invoice' (increases what we owe), 'payment' (decreases what we owe), 'adjustment'
  let balanceChange = 0

  if (type === 'invoice') {
    balanceChange = amount // Purchase increases payables
  } else if (type === 'payment') {
    balanceChange = -amount // Paying them decreases payables
  } else if (type === 'adjustment') {
    balanceChange = amount // Manual adjustment can be +/-
  }

  const newBalance = supplier.outstandingBalance + balanceChange
  const newEntry = {
    id: `TXN-${Date.now()}`,
    date: transaction.date || new Date().toISOString(),
    type,
    description: transaction.description.trim(),
    amount: amount,
    balanceAfter: newBalance,
  }

  supplier.ledger = [newEntry, ...supplier.ledger]
  supplier.outstandingBalance = newBalance

  all[idx] = supplier
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return { data: supplier }
}

// ─── Helper stats ──────────────────────────────────────────────
export function getSupplierStats() {
  const suppliers = getSuppliers()
  let totalSuppliers = suppliers.length
  let activeSuppliers = suppliers.filter(s => s.status === 'active').length
  let totalPayables = 0
  let totalAdvances = 0

  suppliers.forEach(s => {
    if (s.outstandingBalance > 0) {
      totalPayables += s.outstandingBalance
    } else if (s.outstandingBalance < 0) {
      totalAdvances += Math.abs(s.outstandingBalance)
    }
  })

  return {
    totalSuppliers,
    activeSuppliers,
    totalPayables,
    totalAdvances,
  }
}
