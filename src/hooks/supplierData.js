// ─── Suppliers Data Management ──────────────────────────────────
import { moveToTrash } from './trashData'
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

  const now = new Date()
  const dateStr = (offsetDays) => {
    const d = new Date(now)
    d.setDate(d.getDate() - offsetDays)
    return d.toISOString()
  }

  const seed = [
    {
      id: 'SUP-0001',
      companyName: 'Jindal Steel & Power Ltd',
      contactPerson: 'Amit Jindal',
      phone: '+91 98100 12345',
      email: 'sales@jindalsteel.com',
      address: 'Plot No. 12, Sector 3, IMT Manesar',
      city: 'Gurugram',
      gstin: '06AAACJ1234A1Z5',
      outstandingBalance: 124500,
      status: 'active',
      productsSupplied: ['Steel Rods', 'Iron Angles', 'Binding Wire'],
      createdAt: dateStr(30),
      ledger: [
        {
          id: 'TXN-INIT-01',
          date: dateStr(30),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 100000,
          balanceAfter: 100000,
        },
        {
          id: 'TXN-PUR-01',
          date: dateStr(15),
          type: 'invoice',
          description: 'Purchase Invoice #JS-2026-89',
          amount: 45000,
          balanceAfter: 145000,
        },
        {
          id: 'TXN-PAY-01',
          date: dateStr(6),
          type: 'payment',
          description: 'Payment via Bank Transfer (Ref: 66291)',
          amount: 20500,
          balanceAfter: 124500,
        },
      ],
    },
    {
      id: 'SUP-0002',
      companyName: 'Garg Cement Agency',
      contactPerson: 'Sanjay Garg',
      phone: '+91 94160 54321',
      email: 'gargcement@gmail.com',
      address: 'Railway Road, Near Grain Market',
      city: 'Rohtak',
      gstin: '06AAACG5544K2Z1',
      outstandingBalance: 45000,
      status: 'active',
      productsSupplied: ['UltraTech Cement', 'Ambuja Cement', 'ACC Gold'],
      createdAt: dateStr(25),
      ledger: [
        {
          id: 'TXN-INIT-02',
          date: dateStr(25),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 30000,
          balanceAfter: 30000,
        },
        {
          id: 'TXN-PUR-02',
          date: dateStr(12),
          type: 'invoice',
          description: 'Purchase Invoice #GC-771',
          amount: 25000,
          balanceAfter: 55000,
        },
        {
          id: 'TXN-PAY-02',
          date: dateStr(4),
          type: 'payment',
          description: 'Payment via UPI (Ref: 12388)',
          amount: 10000,
          balanceAfter: 45000,
        },
      ],
    },
    {
      id: 'SUP-0003',
      companyName: 'Asian Paints Distributor',
      contactPerson: 'Rahul Mehra',
      phone: '+91 88001 99887',
      email: 'rahul.mehra@asianpaints-dealer.com',
      address: '32, Industrial Area Phase II',
      city: 'Delhi',
      gstin: '07AAACA4411C3Z2',
      outstandingBalance: 0,
      status: 'active',
      productsSupplied: ['Apex Ultima', 'Tractor Emulsion', 'Wall Putty'],
      createdAt: dateStr(20),
      ledger: [
        {
          id: 'TXN-INIT-03',
          date: dateStr(20),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 0,
          balanceAfter: 0,
        },
      ],
    },
    {
      id: 'SUP-0004',
      companyName: 'Berger Paints Hub',
      contactPerson: 'Vikram Sen',
      phone: '+91 99998 77665',
      email: 'delhi.hub@bergerpaints.co.in',
      address: 'B-44, Okhla Phase I',
      city: 'Delhi',
      gstin: '07AAACB2233M1Z8',
      outstandingBalance: -15000,
      status: 'active',
      productsSupplied: ['Easy Clean', 'WeatherCoat', 'Berger Primer'],
      createdAt: dateStr(18),
      ledger: [
        {
          id: 'TXN-INIT-04',
          date: dateStr(18),
          type: 'opening_balance',
          description: 'Opening Balance (Advance Paid)',
          amount: -15000,
          balanceAfter: -15000,
        },
      ],
    },
    {
      id: 'SUP-0005',
      companyName: 'Supreme Hardware & Tools',
      contactPerson: 'Karan Johar',
      phone: '+91 70112 33445',
      email: 'supreme.tools@yahoo.com',
      address: 'G.B. Road, Near Metro Station',
      city: 'Delhi',
      gstin: '07AAACS6655L1Z0',
      outstandingBalance: 8400,
      status: 'inactive',
      productsSupplied: ['Hammers', 'Screwdrivers', 'Drill Machines', 'Nails'],
      createdAt: dateStr(15),
      ledger: [
        {
          id: 'TXN-INIT-05',
          date: dateStr(15),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 8400,
          balanceAfter: 8400,
        },
      ],
    },
  ]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
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
  return { data: all[idx] }
}

export function deleteSupplier(id) {
  let all = getSuppliers()
  const target = all.find(s => s.id === id)
  if (!target) return { error: 'Supplier not found' }

  moveToTrash('supplier', target)
  all = all.filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
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
