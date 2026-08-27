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

  // If Supabase sync has initialized successfully, start with an empty array
  if (localStorage.getItem('gt_sync_initialized') === 'true') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    return []
  }

  const now = new Date()
  const dateStr = (offsetDays) => {
    const d = new Date(now)
    d.setDate(d.getDate() - offsetDays)
    return d.toISOString()
  }

  const seed = [
    {
      id: 'CUST-0001',
      name: 'Sunil Gupta (Sunil Builders)',
      phone: '+91 94161 22334',
      email: 'sunilbuilders@gmail.com',
      address: 'Model Town, Near Double Park',
      city: 'Rohtak',
      gstin: '06AABCS4455P1Z3',
      customerType: 'contractor',
      creditLimit: 200000,
      outstandingBalance: 145000,
      status: 'active',
      createdAt: dateStr(45),
      ledger: [
        {
          id: 'TXN-C-INIT-01',
          date: dateStr(45),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 50000,
          balanceAfter: 50000,
        },
        {
          id: 'TXN-C-INV-01',
          date: dateStr(25),
          type: 'invoice',
          description: 'Sales Invoice #GT-2026-1025 (Steel Rods & Cement)',
          amount: 120000,
          balanceAfter: 170000,
        },
        {
          id: 'TXN-C-PAY-01',
          date: dateStr(10),
          type: 'payment',
          description: 'Payment Received - Bank Transfer (Ref: 991823)',
          amount: 25000,
          balanceAfter: 145000,
        },
      ],
    },
    {
      id: 'CUST-0002',
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh.kumar@gmail.com',
      address: 'House No. 12, Sector 15',
      city: 'Gurugram',
      gstin: '',
      customerType: 'regular',
      creditLimit: 30000,
      outstandingBalance: 12500,
      status: 'active',
      createdAt: dateStr(30),
      ledger: [
        {
          id: 'TXN-C-INIT-02',
          date: dateStr(30),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 0,
          balanceAfter: 0,
        },
        {
          id: 'TXN-C-INV-02',
          date: dateStr(15),
          type: 'invoice',
          description: 'Sales Invoice #GT-2026-1033 (Paint & Putty)',
          amount: 15500,
          balanceAfter: 15500,
        },
        {
          id: 'TXN-C-PAY-02',
          date: dateStr(5),
          type: 'payment',
          description: 'Payment Received - UPI Transfer (Ref: 12389)',
          amount: 3000,
          balanceAfter: 12500,
        },
      ],
    },
    {
      id: 'CUST-0003',
      name: 'Amit Sharma',
      phone: '+91 99887 76655',
      email: 'amit.sharma@yahoo.com',
      address: 'B-88, Lajpat Nagar II',
      city: 'Delhi',
      gstin: '',
      customerType: 'regular',
      creditLimit: 25000,
      outstandingBalance: 8400,
      status: 'active',
      createdAt: dateStr(20),
      ledger: [
        {
          id: 'TXN-C-INIT-03',
          date: dateStr(20),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 8400,
          balanceAfter: 8400,
        },
      ],
    },
    {
      id: 'CUST-0004',
      name: 'Vikram Patel (Patel Infrastructure)',
      phone: '+91 99991 00223',
      email: 'contact@patelinfra.com',
      address: 'Patel House, Ashram Road',
      city: 'Ahmedabad',
      gstin: '24AAACP3322K1Z9',
      customerType: 'contractor',
      creditLimit: 300000,
      outstandingBalance: 45000,
      status: 'active',
      createdAt: dateStr(35),
      ledger: [
        {
          id: 'TXN-C-INIT-04',
          date: dateStr(35),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 0,
          balanceAfter: 0,
        },
        {
          id: 'TXN-C-INV-04',
          date: dateStr(20),
          type: 'invoice',
          description: 'Sales Invoice #GT-2026-0988 (Cement 200 Bags)',
          amount: 95000,
          balanceAfter: 95000,
        },
        {
          id: 'TXN-C-PAY-04',
          date: dateStr(8),
          type: 'payment',
          description: 'Payment Received - Cheque (Ref: 88722)',
          amount: 50000,
          balanceAfter: 45000,
        },
      ],
    },
    {
      id: 'CUST-0005',
      name: 'Priya Singh',
      phone: '+91 70114 99887',
      email: 'priyasingh@gmail.com',
      address: '22A, Vikas Marg',
      city: 'Delhi',
      gstin: '',
      customerType: 'retail',
      creditLimit: 10000,
      outstandingBalance: 3200,
      status: 'active',
      createdAt: dateStr(15),
      ledger: [
        {
          id: 'TXN-C-INIT-05',
          date: dateStr(15),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 3200,
          balanceAfter: 3200,
        },
      ],
    },
    {
      id: 'CUST-0006',
      name: 'Meena Devi',
      phone: '+91 88002 11223',
      email: 'meenadevi@gmail.com',
      address: 'Gali No. 4, Janta Colony',
      city: 'Rohtak',
      gstin: '',
      customerType: 'retail',
      creditLimit: 5000,
      outstandingBalance: -1500,
      status: 'active',
      createdAt: dateStr(12),
      ledger: [
        {
          id: 'TXN-C-INIT-06',
          date: dateStr(12),
          type: 'opening_balance',
          description: 'Opening Balance (Advance Deposit)',
          amount: -1500,
          balanceAfter: -1500,
        },
      ],
    },
    {
      id: 'CUST-0007',
      name: 'Modern Traders & Wholesalers',
      phone: '+91 90123 45678',
      email: 'moderntraders@gmail.com',
      address: 'G.T. Road, Near bypass',
      city: 'Rohtak',
      gstin: '06AABCM1122D1Z0',
      customerType: 'wholesaler',
      creditLimit: 500000,
      outstandingBalance: 0,
      status: 'inactive',
      createdAt: dateStr(60),
      ledger: [
        {
          id: 'TXN-C-INIT-07',
          date: dateStr(60),
          type: 'opening_balance',
          description: 'Opening Balance',
          amount: 0,
          balanceAfter: 0,
        },
      ],
    },
  ]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
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
