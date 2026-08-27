import { moveToTrash } from './trashData'
import { queueSync } from '../supabase/syncManager'
const STORAGE_KEY = 'gt_customers'

function getInitialCustomers() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
    }
  }

  // Return empty array by default and cache it
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  return []
}

// ─── CRUD Operations ───────────────────────────────────────────

export function getCustomers() {
  return getInitialCustomers()
}

export function addCustomer(customer) {
  const all = getCustomers()
  const nextNum = all.length + 1
  const id = `CUST-${String(nextNum).padStart(4, '0')}`

  const openingBalance = Number(customer.openingBalance) || 0
  const now = new Date().toISOString()

  const newCustomer = {
    id,
    name: customer.name.trim(),
    phone: (customer.phone || '').trim(),
    email: (customer.email || '').trim(),
    address: (customer.address || '').trim(),
    city: (customer.city || '').trim(),
    gstin: (customer.gstin || '').trim().toUpperCase(),
    customerType: customer.customerType || 'retail',
    creditLimit: Number(customer.creditLimit) || 10000,
    outstandingBalance: openingBalance,
    status: customer.status || 'active',
    createdAt: now,
    profilePic: customer.profilePic || '',
    ledger: [
      {
        id: `TXN-C-INIT-${Date.now()}`,
        date: now,
        type: 'opening_balance',
        description: 'Opening Balance',
        amount: openingBalance,
        balanceAfter: openingBalance,
      },
    ],
  }

  all.push(newCustomer)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('customers', 'insert', newCustomer)
  return { data: newCustomer }
}

export function updateCustomer(id, updates) {
  const all = getCustomers()
  const idx = all.findIndex(c => c.id === id)
  if (idx === -1) return { error: 'Customer not found' }

  all[idx] = {
    ...all[idx],
    ...updates,
    name: updates.name ? updates.name.trim() : all[idx].name,
    gstin: updates.gstin ? updates.gstin.trim().toUpperCase() : all[idx].gstin,
    creditLimit: updates.creditLimit !== undefined ? Number(updates.creditLimit) : all[idx].creditLimit,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('customers', 'update', all[idx])
  return { data: all[idx] }
}

export function deleteCustomer(id) {
  let all = getCustomers()
  const target = all.find(c => c.id === id)
  if (!target) return { error: 'Customer not found' }

  moveToTrash('customer', target)
  all = all.filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  queueSync('customers', 'delete', target)
  return { success: true }
}

// ─── Transaction Ledger Entries ───────────────────────────────

export function recordCustomerTransaction(id, transaction) {
  const all = getCustomers()
  const idx = all.findIndex(c => c.id === id)
  if (idx === -1) return { error: 'Customer not found' }

  const customer = all[idx]
  const amount = Number(transaction.amount) || 0
  const type = transaction.type // 'invoice' (increases outstanding), 'payment' (decreases outstanding), 'adjustment'
  let balanceChange = 0

  if (type === 'invoice') {
    balanceChange = amount // Invoice increases what they owe us
  } else if (type === 'payment') {
    balanceChange = -amount // Payment decreases what they owe us
  } else if (type === 'adjustment') {
    balanceChange = amount // Adjustments can be positive or negative
  }

  const newBalance = customer.outstandingBalance + balanceChange
  const newEntry = {
    id: `TXN-C-${Date.now()}`,
    date: transaction.date || new Date().toISOString(),
    type,
    description: transaction.description.trim(),
    amount: amount,
    balanceAfter: newBalance,
  }

  customer.ledger = [newEntry, ...customer.ledger]
  customer.outstandingBalance = newBalance

  all[idx] = customer
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return { data: customer }
}

// ─── Helper stats ──────────────────────────────────────────────
export function getCustomerStats() {
  const customers = getCustomers()
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  let totalReceivables = 0
  let totalAdvances = 0
  let totalCreditLimit = 0
  let utilisedCredit = 0

  customers.forEach(c => {
    if (c.status === 'active') {
      totalCreditLimit += c.creditLimit
      if (c.outstandingBalance > 0) {
        totalReceivables += c.outstandingBalance
        utilisedCredit += Math.min(c.outstandingBalance, c.creditLimit)
      } else if (c.outstandingBalance < 0) {
        totalAdvances += Math.abs(c.outstandingBalance)
      }
    }
  })

  // Count overdue (customers whose balance exceeds their credit limit, or who are overdue with credit > 0)
  const overdueCount = customers.filter(c => c.status === 'active' && c.outstandingBalance > c.creditLimit).length

  return {
    totalCustomers,
    activeCustomers,
    totalReceivables,
    totalAdvances,
    totalCreditLimit,
    utilisedCredit,
    overdueCount,
  }
}
