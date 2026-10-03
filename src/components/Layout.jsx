import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { formatINR } from '../utils/erp'
import Footer from './footer'
import guptaTradersLogo from '../assets/gupta traders logo.png'
import { useAuth } from '../context/AuthContext'
import {
  FaUsers,
  FaCoins,
  FaChartLine,
  FaExclamationTriangle,
  FaBox,
  FaBuilding,
  FaBalanceScale,
  FaLightbulb,
  FaBolt,
  FaTag,
  FaReceipt,
  FaSearch,
} from 'react-icons/fa'
import NotificationBell from './NotificationBell'
import { listCategories, listUICustomers, listUIProducts, listUISales, listUISuppliers } from '../services/erpService'

// Emoji map for category icons fallback
const emojiToFaMap = {
  '💡': <FaLightbulb />,
  '📦': <FaBox />,
  '👥': <FaUsers />,
  '💰': <FaCoins />,
  '📈': <FaChartLine />,
  '⚠️': <FaExclamationTriangle />,
  '🏢': <FaBuilding />,
  '⚖️': <FaBalanceScale />,
  '⚡': <FaBolt />,
  '🏷️': <FaTag />,
  '🧾': <FaReceipt />,
  '🔍': <FaSearch />
}

// ─── Navigation Items ───────────────────────────────────────────
const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: 'POS Billing',
    path: '/pos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
      </svg>
    ),
    highlight: true,
  },
  { type: 'divider', label: 'Inventory' },
  {
    label: 'Products',
    path: '/products',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    label: 'Quick Product Entry',
    path: '/packaged-scanner',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 15.75h6m-3-3v6" />
      </svg>
    ),
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    label: 'Barcode Generator',
    path: '/barcode-generator',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14M6 5v14M8 5v14M12 5v14M15 5v14M18 5v14M21 5v14" />
      </svg>
    ),
  },
  { type: 'divider', label: 'Transactions' },
  {
    label: 'Purchase',
    path: '/purchase',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
  },
  {
    label: 'Sales History',
    path: '/sales/history',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  { type: 'divider', label: 'People' },
  {
    label: 'Suppliers',
    path: '/suppliers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.143-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  { type: 'divider', label: 'System' },
  {
    label: 'User Management',
    path: '/users',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },

  {
    label: 'Trash',
    path: '/trash',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
      </svg>
    ),
  },
]

// ─── Sidebar Toggle Icons ───────────────────────────────────────
function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
    </svg>
  )
}

// ─── ERP Natural Language Query Assistant ───────────────────────
function getAIAnswer(query, {products=[],suppliers=[],customers=[],bills=[]}={}) {
  const q = (query || '').toLowerCase().trim()
  if (!q) return null

  const getTodaySalesStats = () => {
    const todayStr = new Date().toDateString()
    const todayBills = bills.filter(b => {
      const d = b.date || b.timestamp
      return d ? new Date(d).toDateString() === todayStr : false
    })
    const count = todayBills.length
    const total = todayBills.reduce((sum, b) => sum + (b.grandTotal || b.totalAmount || 0), 0)
    return { count, total }
  }

  const getPayableStats = () => {
    let totalPayables = 0
    let totalAdvances = 0
    suppliers.forEach(s => {
      const bal = Number(s.outstandingBalance) || 0
      if (bal > 0) totalPayables += bal
      else if (bal < 0) totalAdvances += Math.abs(bal)
    })
    return { totalPayables, totalAdvances }
  }

  // 1. Total Payables / Owed Balance
  if (q.includes('payable') || q.includes('owe') || q.includes('due') || q.includes('debt') || q.includes('outstanding')) {
    const isSpecificSupplier = suppliers.some(s => q.includes(s.companyName.toLowerCase()) || (s.contactPerson && q.includes(s.contactPerson.toLowerCase())))
    if (!isSpecificSupplier) {
      const { totalPayables, totalAdvances } = getPayableStats()
      return {
        type: 'summary',
        title: 'ERP Financial payables summary',
        icon: '💰',
        lines: [
          { label: 'Total Outstanding Payables', value: formatINR(totalPayables), color: 'text-rose-400 font-bold' },
          { label: 'Total Advances Paid to Vendors', value: formatINR(totalAdvances), color: 'text-emerald-400' },
          { label: 'Net Payable Amount', value: formatINR(totalPayables - totalAdvances), color: 'text-slate-200' },
        ],
        actionText: 'View Suppliers Directory',
        actionPath: '/suppliers'
      }
    }
  }

  // 2. Today's Sales / Revenue
  if (q.includes('sale') || q.includes('revenue') || q.includes('profit') || q.includes('today\'s') || q.includes('income') || q.includes('earning') || q.includes('turnover')) {
    const { count, total } = getTodaySalesStats()
    return {
      type: 'summary',
      title: 'Today\'s Sales Revenue',
      icon: '📈',
      lines: [
        { label: 'Completed Invoices Today', value: `${count} bills`, color: 'text-slate-200' },
        { label: 'Total Sales Revenue Today', value: formatINR(total), color: 'text-emerald-400 font-bold' },
        { label: 'Average Ticket Size', value: count > 0 ? formatINR(total / count) : formatINR(0), color: 'text-slate-400' }
      ],
      actionText: 'Go to POS Billing Screen',
      actionPath: '/pos'
    }
  }

  // 3. Low stock alerts
  if (q.includes('low') || q.includes('stock') || q.includes('alert') || q.includes('shortage') || q.includes('reorder') || q.includes('limit') || q.includes('warning')) {
    const isSpecificProduct = products.some(p => q.includes(p.name.toLowerCase()))
    if (!isSpecificProduct) {
      const lowStockItems = products.filter(p => {
        const stock = Number(p.currentStock) || 0
        const min = Number(p.minStock) || 10
        return stock <= min
      })
      return {
        type: 'list',
        title: `Low Stock Alerts (${lowStockItems.length} items)`,
        icon: '⚠️',
        items: lowStockItems.slice(0, 4).map(p => ({
          label: p.name,
          badge: `${p.currentStock} ${p.unit} left`,
          subText: `Min threshold: ${p.minStock || 10} ${p.unit}`,
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        })),
        actionText: 'Manage Inventory & Stock',
        actionPath: '/inventory'
      }
    }
  }

  // 4. General Counts
  if (q.includes('how many') || q.includes('total') || q.includes('count') || q.includes('catalog') || q.includes('size')) {
    if (q.includes('product') || q.includes('item')) {
      const packaged = products.filter(p => p.type === 'packaged').length
      const loose = products.filter(p => p.type === 'loose').length
      return {
        type: 'summary',
        title: 'ERP Catalogue Summary',
        icon: '📦',
        lines: [
          { label: 'Total Products Registered', value: `${products.length} items`, color: 'text-slate-200 font-bold' },
          { label: 'Packaged Products', value: `${packaged} items`, color: 'text-blue-400' },
          { label: 'Loose Products (By weight)', value: `${loose} items`, color: 'text-amber-400' }
        ],
        actionText: 'View Product Catalogue',
        actionPath: '/products'
      }
    }
    if (q.includes('supplier') || q.includes('vendor')) {
      const active = suppliers.filter(s => s.status === 'active').length
      return {
        type: 'summary',
        title: 'ERP Supplier Summary',
        icon: '🏢',
        lines: [
          { label: 'Total Registered Suppliers', value: `${suppliers.length} vendors`, color: 'text-slate-200 font-bold' },
          { label: 'Active Suppliers', value: `${active} active`, color: 'text-emerald-400' },
          { label: 'Inactive Suppliers', value: `${suppliers.length - active} inactive`, color: 'text-slate-500' }
        ],
        actionText: 'View Supplier Directory',
        actionPath: '/suppliers'
      }
    }
    if (q.includes('customer') || q.includes('client')) {
      const active = customers.filter(c => c.status === 'active').length
      return {
        type: 'summary',
        title: 'ERP Customer Summary',
        icon: '👥',
        lines: [
          { label: 'Total Registered Customers', value: `${customers.length} clients`, color: 'text-slate-200 font-bold' },
          { label: 'Active Customers', value: `${active} active`, color: 'text-emerald-400' },
          { label: 'Inactive Customers', value: `${customers.length - active} inactive`, color: 'text-slate-500' }
        ],
        actionText: 'View Customers Directory',
        actionPath: '/customers'
      }
    }
  }

  // 4.5. Specific Customer Lookup
  for (const cust of customers) {
    const nameLower = cust.name.toLowerCase()
    const matchesCust = q.includes(nameLower) ||
      nameLower.split(' ').some(word => word.length > 3 && q.includes(word))

    if (matchesCust) {
      const bal = Number(cust.outstandingBalance) || 0
      const balText = bal > 0 ? `${formatINR(bal)} (Owed to us)` : bal < 0 ? `${formatINR(Math.abs(bal))} (Advance deposit)` : 'Settled (₹0.00)'
      const balColor = bal > 0 ? 'text-rose-400 font-bold' : bal < 0 ? 'text-emerald-400 font-bold' : 'text-slate-450'

      return {
        type: 'customer_lookup',
        title: `Customer Card`,
        icon: '👥',
        name: cust.name,
        lines: [
          { label: 'Outstanding Balance', value: balText, color: balColor },
          { label: 'Customer Type', value: cust.customerType ? cust.customerType.toUpperCase() : 'REGULAR', color: 'text-teal-400 font-semibold' },
          { label: 'Phone', value: cust.phone || 'N/A', color: 'text-blue-400 font-semibold' },
          { label: 'Credit Limit', value: formatINR(cust.creditLimit || 0), color: 'text-slate-350' },
          { label: 'GSTIN', value: cust.gstin || 'N/A', color: 'text-violet-400 font-mono text-xs' },
          { label: 'City', value: cust.city || 'N/A', color: 'text-slate-400 text-xs' }
        ],
        actionText: 'Open Transaction Ledger',
        actionPath: `/customers?search=${encodeURIComponent(cust.name)}`
      }
    }
  }

  // 5. Specific Supplier Lookup
  for (const sup of suppliers) {
    const companyLower = sup.companyName.toLowerCase()
    const contactLower = (sup.contactPerson || '').toLowerCase()

    const matchesSupplier = q.includes(companyLower) ||
      companyLower.split(' ').some(word => word.length > 3 && q.includes(word)) ||
      (contactLower && q.includes(contactLower)) ||
      (contactLower && contactLower.split(' ').some(word => word.length > 3 && q.includes(word)))

    if (matchesSupplier) {
      const bal = Number(sup.outstandingBalance) || 0
      const balText = bal > 0 ? `${formatINR(bal)} (Payable)` : bal < 0 ? `${formatINR(Math.abs(bal))} (Advance)` : 'Settled (₹0.00)'
      const balColor = bal > 0 ? 'text-rose-400 font-bold' : bal < 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'

      return {
        type: 'supplier',
        title: `Vendor Financial & Contact Info`,
        icon: '🏢',
        name: sup.companyName,
        lines: [
          { label: 'Outstanding Balance', value: balText, color: balColor },
          { label: 'Contact Person', value: sup.contactPerson || 'N/A', color: 'text-slate-200' },
          { label: 'Phone', value: sup.phone || 'N/A', color: 'text-blue-400 font-semibold' },
          { label: 'Email', value: sup.email || 'N/A', color: 'text-slate-300' },
          { label: 'GSTIN', value: sup.gstin || 'N/A', color: 'text-violet-400 font-mono text-xs' },
          { label: 'Address', value: `${sup.address || ''}, ${sup.city || ''}`, color: 'text-slate-400 text-xs' }
        ],
        actionText: 'Open Transaction Ledger',
        actionPath: `/suppliers?search=${encodeURIComponent(sup.companyName)}`
      }
    }
  }

  // 6. Specific Product Lookup
  for (const prod of products) {
    const prodLower = prod.name.toLowerCase()
    const matchProdName = q.includes(prodLower) || prodLower.split(' ').some(word => word.length > 3 && q.includes(word))

    if (matchProdName) {
      const isLowStock = prod.currentStock <= (prod.minStock || 10)
      return {
        type: 'product_lookup',
        title: `Product Inventory Card`,
        icon: prod.type === 'packaged' ? '📦' : '⚖️',
        name: prod.name,
        lines: [
          { label: 'Rate (Our Price)', value: formatINR(prod.rate || prod.sellingPrice), color: 'text-emerald-400 font-bold' },
          { label: 'Purchase Cost', value: formatINR(prod.purchasePrice), color: 'text-slate-400' },
          { label: 'Current Inventory', value: `${prod.currentStock} ${prod.unit}`, color: isLowStock ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-200 font-semibold' },
          { label: 'Product Brand', value: prod.brand || 'General', color: 'text-blue-400' },
          { label: 'Barcode', value: prod.barcode || 'N/A', color: 'text-slate-500 font-mono text-xs' }
        ],
        actionText: 'Manage Product Stock',
        actionPath: `/products?search=${encodeURIComponent(prod.name)}&tab=${prod.type}`
      }
    }
  }

  // 7. General Help Fallback
  if (q.includes('help') || q.includes('how') || q.includes('ai') || q.includes('assistant') || q.includes('ask')) {
    return {
      type: 'help',
      title: 'ERP Assistant Quick Guide',
      icon: '💡',
      lines: [
        { label: 'Outstanding Payables', value: 'Ask: "how much we owe?"' },
        { label: 'Today\'s Sales', value: 'Ask: "sales today"' },
        { label: 'Inventory Shortages', value: 'Ask: "what is low in stock?"' },
        { label: 'Supplier Balance', value: 'Ask: "[Supplier Name] balance"' },
        { label: 'Supplier Phone', value: 'Ask: "[Supplier Name] contact"' },
        { label: 'Product Details', value: 'Ask: "stock of [Product Name]"' }
      ]
    }
  }

  return null
}

// ─── Header Search with Live Suggestions ────────────────────────
function HeaderSearch({ navigate, isMobile, onClose }) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)

  const [prodResults, setProdResults] = useState([])
  const [supResults, setSupResults] = useState([])
  const [custResults, setCustResults] = useState([])
  const [catResults, setCatResults] = useState([])
  const [billResults, setBillResults] = useState([])
  const [searchData, setSearchData] = useState({ products: [], suppliers: [], customers: [], categories: [], bills: [] })
  const searchDataLoadingRef = useRef(false)
  const searchDataLoadedRef = useRef(false)

  const ensureSearchData = useCallback(() => {
    if (searchDataLoadedRef.current || searchDataLoadingRef.current) return
    searchDataLoadingRef.current = true
    Promise.all([
      listUIProducts(),
      listUISuppliers(),
      listUICustomers(),
      listCategories(),
      listUISales()
    ]).then(([products, suppliers, customers, categories, bills]) => {
      setSearchData({ products, suppliers, customers, categories, bills })
      searchDataLoadedRef.current = true
    }).catch(console.error).finally(() => {
      searchDataLoadingRef.current = false
    })
  }, [])
  const [actionResults, setActionResults] = useState([])
  const [aiAnswer, setAiAnswer] = useState(null)
  const [selectableItems, setSelectableItems] = useState([])

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (val) => {
    ensureSearchData()
    setQuery(val)
    setHighlightIdx(-1)
    if (val.trim().length > 0) {
      const valLower = val.toLowerCase().trim()

      const prods = searchData.products.filter(p=>p.name.toLowerCase().includes(valLower)||p.sku?.toLowerCase().includes(valLower)||p.barcode?.toLowerCase().includes(valLower))
      setProdResults(prods)

      let sups = []
      try {
        const allSups = searchData.suppliers
        sups = allSups.filter(s =>
          s.companyName.toLowerCase().includes(valLower) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(valLower)) ||
          (s.city && s.city.toLowerCase().includes(valLower)) ||
          (s.phone && s.phone.includes(valLower)) ||
          (s.email && s.email.toLowerCase().includes(valLower)) ||
          (s.gstin && s.gstin.toLowerCase().includes(valLower))
        )
      } catch (e) {
        console.error(e)
      }
      setSupResults(sups)

      let cats = []
      try {
        const allCats = searchData.categories
        cats = allCats.filter(c =>
          c.name.toLowerCase().includes(valLower) ||
          (c.description && c.description.toLowerCase().includes(valLower))
        )
      } catch (e) {
        console.error(e)
      }
      setCatResults(cats)

      let bills = []
      try {
        const allBills = searchData.bills.map(b=>({...b,billNumber:b.invoice,customerName:b.customer,grandTotal:b.total}))
        bills = allBills.filter(b =>
          b.billNumber.toLowerCase().includes(valLower) ||
          (b.customerName && b.customerName.toLowerCase().includes(valLower)) ||
          (b.items && b.items.some(item => item.name.toLowerCase().includes(valLower)))
        )
      } catch (e) {
        console.error(e)
      }
      setBillResults(bills)

      const actions = [
        { label: 'POS Billing', path: '/pos', desc: 'Create new invoices', keyword: 'pos billing sales checkout invoice print' },
        { label: 'Products Directory', path: '/products', desc: 'Manage inventory catalogs', keyword: 'products items barcode sku' },
        { label: 'Categories', path: '/categories', desc: 'Organize products by departments', keyword: 'categories sections departments' },
        { label: 'Inventory Stock Control', path: '/inventory', desc: 'Physical audit and inward/outward logs', keyword: 'inventory stock warehouse logs audit reconcile adjustment' },
        { label: 'Suppliers & Vendors', path: '/suppliers', desc: 'Manage payables, ledgers, and vendor details', keyword: 'suppliers vendors payables purchase ledger company' },
        { label: 'Sales History', path: '/sales/history', desc: 'Track sales records and transactions', keyword: 'sales bills transaction invoices history' },
        { label: 'Expenses Tracker', path: '/expenses', desc: 'Log and monitor utility, rent, and other costs', keyword: 'expenses cost pay spend bill cash' },
        { label: 'Settings & Config', path: '/settings', desc: 'App customization, backup & business profile', keyword: 'settings backup theme configurations' },
      ]
      const matchedActions = actions.filter(a =>
        a.label.toLowerCase().includes(valLower) ||
        a.desc.toLowerCase().includes(valLower) ||
        a.keyword.toLowerCase().includes(valLower)
      )
      setActionResults(matchedActions)

      const answer = getAIAnswer(val,searchData)
      setAiAnswer(answer)

      const selectables = []
      if (answer) selectables.push({ type: 'ai', data: answer })
      matchedActions.slice(0, 3).forEach(act => selectables.push({ type: 'action', data: act }))
      prods.slice(0, 4).forEach(prod => selectables.push({ type: 'product', data: prod }))
      sups.slice(0, 4).forEach(sup => selectables.push({ type: 'supplier', data: sup }))
      cats.slice(0, 4).forEach(cat => selectables.push({ type: 'category', data: cat }))
      bills.slice(0, 3).forEach(bill => selectables.push({ type: 'bill', data: bill }))
      setSelectableItems(selectables)

      setShowDropdown(true)
    } else {
      setProdResults([])
      setSupResults([])
      setCustResults([])
      setCatResults([])
      setBillResults([])
      setActionResults([])
      setAiAnswer(null)
      setSelectableItems([])
      setShowDropdown(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setProdResults([])
    setSupResults([])
    setCustResults([])
    setCatResults([])
    setBillResults([])
    setActionResults([])
    setAiAnswer(null)
    setSelectableItems([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const pickSelectableItem = (item) => {
    setShowDropdown(false)
    onClose?.()
    if (item.type === 'ai') {
      if (item.data.actionPath) {
        navigate(item.data.actionPath)
      }
    } else if (item.type === 'action') {
      navigate(item.data.path)
    } else if (item.type === 'product') {
      navigate(`/products?search=${encodeURIComponent(item.data.name)}&tab=${item.data.type}`)
    } else if (item.type === 'supplier') {
      navigate(`/suppliers?search=${encodeURIComponent(item.data.companyName)}`)
    } else if (item.type === 'customer') {
      navigate(`/customers?search=${encodeURIComponent(item.data.name)}`)
    } else if (item.type === 'category') {
      navigate(`/categories?search=${encodeURIComponent(item.data.name)}`)
    } else if (item.type === 'bill') {
      navigate('/pos')
    }
  }

  const handleSearchSubmit = () => {
    if (!query.trim()) return
    setShowDropdown(false)
    onClose?.()

    if (supResults.length > 0 && prodResults.length === 0) {
      navigate(`/suppliers?search=${encodeURIComponent(query)}`)
    } else if (custResults.length > 0 && prodResults.length === 0 && supResults.length === 0) {
      navigate(`/customers?search=${encodeURIComponent(query)}`)
    } else if (catResults.length > 0 && prodResults.length === 0 && supResults.length === 0 && custResults.length === 0) {
      navigate(`/categories?search=${encodeURIComponent(query)}`)
    } else {
      navigate(`/products?search=${encodeURIComponent(query)}`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(prev => Math.min(prev + 1, selectableItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && selectableItems[highlightIdx]) {
        pickSelectableItem(selectableItems[highlightIdx])
      } else if (query.trim()) {
        handleSearchSubmit()
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={wrapperRef} className={isMobile ? "flex flex-1 relative z-[100]" : "hidden sm:flex items-center gap-2 flex-1 max-w-lg ml-4 lg:ml-0 relative"}>
      <div className="relative w-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { ensureSearchData(); if (query.trim() && selectableItems.length > 0) setShowDropdown(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Search products, suppliers, bills, ask questions..."
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-900/80 border border-slate-800/60 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
        />

        {query ? (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-y-auto max-h-[80vh] z-[100] animate-fadeIn scrollbar-thin">
          {aiAnswer && (
            <div className="p-4 m-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 rounded-2xl shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none"></div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-base text-emerald-400">{emojiToFaMap[aiAnswer.icon] || aiAnswer.icon}</span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{aiAnswer.title}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-500/15 text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest border border-emerald-500/20">
                  AI Assistant
                </span>
              </div>

              {aiAnswer.name && (
                <h4 className="text-sm font-bold text-slate-100 mb-2 truncate">{aiAnswer.name}</h4>
              )}

              {aiAnswer.lines && (
                <div className="space-y-2 mb-3">
                  {aiAnswer.lines.map((line, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{line.label}</span>
                      <span className={`font-semibold ${line.color || 'text-slate-200'}`}>{line.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiAnswer.items && (
                <div className="space-y-2 mb-3">
                  {aiAnswer.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/40 border border-slate-800/40 text-xs">
                      <div>
                        <span className="font-semibold text-slate-200 block">{item.label}</span>
                        {item.subText && <span className="text-[10px] text-slate-500">{item.subText}</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {aiAnswer.actionText && (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onClose?.();
                    navigate(aiAnswer.actionPath);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/20"
                >
                  <span>{aiAnswer.actionText}</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}

          {actionResults.length > 0 && (
            <div className="border-t border-slate-800/40 first:border-0">
              <div className="px-4 py-2 bg-slate-950/40 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quick ERP Navigation</p>
              </div>
              <div className="py-1">
                {actionResults.slice(0, 3).map((act) => {
                  const globalIdx = selectableItems.findIndex(x => x.type === 'action' && x.data.path === act.path)
                  const isHighlighted = globalIdx === highlightIdx
                  return (
                    <button
                      key={act.path}
                      onClick={() => pickSelectableItem({ type: 'action', data: act })}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer border-b border-slate-800/10 last:border-0 ${isHighlighted ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">
                        <FaBolt />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{act.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{act.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {prodResults.length > 0 && (
            <div className="border-t border-slate-800/40 first:border-0">
              <div className="px-4 py-2 bg-slate-950/40 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inventory Products</p>
                {prodResults.length > 4 && (
                  <button
                    onClick={() => { setShowDropdown(false); navigate(`/products?search=${encodeURIComponent(query)}`); }}
                    className="text-[10px] text-emerald-400 font-semibold hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    View All ({prodResults.length}) →
                  </button>
                )}
              </div>
              <div className="py-1">
                {prodResults.slice(0, 4).map((prod) => {
                  const globalIdx = selectableItems.findIndex(x => x.type === 'product' && x.data.id === prod.id)
                  const isHighlighted = globalIdx === highlightIdx
                  const isLow = prod.currentStock <= (prod.minStock || 10)
                  return (
                    <button
                      key={prod.id}
                      onClick={() => pickSelectableItem({ type: 'product', data: prod })}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer border-b border-slate-800/10 last:border-0 ${isHighlighted ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${prod.type === 'packaged' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {prod.type === 'packaged' ? <FaBox /> : <FaBalanceScale />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{prod.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{prod.barcode} • {prod.brand || 'General'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">{formatINR(prod.sellingPrice)}</p>
                        <p className={`text-[9px] font-bold ${isLow ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>{prod.currentStock} {prod.unit}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {supResults.length > 0 && (
            <div className="border-t border-slate-800/40 first:border-0">
              <div className="px-4 py-2 bg-slate-950/40 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Suppliers & Vendors</p>
                {supResults.length > 4 && (
                  <button
                    onClick={() => { setShowDropdown(false); navigate(`/suppliers?search=${encodeURIComponent(query)}`); }}
                    className="text-[10px] text-indigo-400 font-semibold hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    View All ({supResults.length}) →
                  </button>
                )}
              </div>
              <div className="py-1">
                {supResults.slice(0, 4).map((sup) => {
                  const globalIdx = selectableItems.findIndex(x => x.type === 'supplier' && x.data.id === sup.id)
                  const isHighlighted = globalIdx === highlightIdx
                  return (
                    <button
                      key={sup.id}
                      onClick={() => pickSelectableItem({ type: 'supplier', data: sup })}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer border-b border-slate-800/10 last:border-0 ${isHighlighted ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs">
                        <FaBuilding />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{sup.companyName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{sup.contactPerson} • {sup.city}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${sup.outstandingBalance > 0 ? 'text-rose-400' : sup.outstandingBalance < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {formatINR(sup.outstandingBalance)}
                        </p>
                        <p className="text-[9px] text-slate-500">Balance</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {custResults.length > 0 && (
            <div className="border-t border-slate-800/40 first:border-0">
              <div className="px-4 py-2 bg-slate-950/40 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Customers & Clients</p>
                {custResults.length > 4 && (
                  <button
                    onClick={() => { setShowDropdown(false); navigate(`/customers?search=${encodeURIComponent(query)}`); }}
                    className="text-[10px] text-teal-400 font-semibold hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    View All ({custResults.length}) →
                  </button>
                )}
              </div>
              <div className="py-1">
                {custResults.slice(0, 4).map((cust) => {
                  const globalIdx = selectableItems.findIndex(x => x.type === 'customer' && x.data.id === cust.id)
                  const isHighlighted = globalIdx === highlightIdx
                  return (
                    <button
                      key={cust.id}
                      onClick={() => pickSelectableItem({ type: 'customer', data: cust })}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer border-b border-slate-800/10 last:border-0 ${isHighlighted ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {cust.profilePic ? (
                          <img src={cust.profilePic} alt={cust.name} className="w-full h-full object-cover" />
                        ) : (
                          <FaUsers />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{cust.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{cust.customerType ? cust.customerType.toUpperCase() : 'REGULAR'} • {cust.city || 'No City'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${cust.outstandingBalance > 0 ? 'text-rose-400' : cust.outstandingBalance < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {formatINR(cust.outstandingBalance)}
                        </p>
                        <p className="text-[9px] text-slate-500">Balance</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {catResults.length > 0 && (
            <div className="border-t border-slate-800/40 first:border-0">
              <div className="px-4 py-2 bg-slate-950/40 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Product Categories</p>
                {catResults.length > 4 && (
                  <button
                    onClick={() => { setShowDropdown(false); navigate(`/categories?search=${encodeURIComponent(query)}`); }}
                    className="text-[10px] text-amber-400 font-semibold hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    View All ({catResults.length}) →
                  </button>
                )}
              </div>
              <div className="py-1">
                {catResults.slice(0, 4).map((cat) => {
                  const globalIdx = selectableItems.findIndex(x => x.type === 'category' && x.data.id === cat.id)
                  const isHighlighted = globalIdx === highlightIdx
                  return (
                    <button
                      key={cat.id}
                      onClick={() => pickSelectableItem({ type: 'category', data: cat })}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer border-b border-slate-800/10 last:border-0 ${isHighlighted ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs">
                        {emojiToFaMap[cat.icon] || cat.icon || <FaTag />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{cat.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{cat.description || 'No description available'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {billResults.length > 0 && (
            <div className="border-t border-slate-800/40 first:border-0">
              <div className="px-4 py-2 bg-slate-950/40 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Saved Sales Invoices</p>
              </div>
              <div className="py-1">
                {billResults.slice(0, 3).map((bill) => {
                  const globalIdx = selectableItems.findIndex(x => x.type === 'bill' && x.data.billNumber === bill.billNumber)
                  const isHighlighted = globalIdx === highlightIdx
                  return (
                    <button
                      key={bill.billNumber}
                      onClick={() => pickSelectableItem({ type: 'bill', data: bill })}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer border-b border-slate-800/10 last:border-0 ${isHighlighted ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs">
                        <FaReceipt />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{bill.billNumber}</p>
                        <p className="text-[10px] text-slate-500 truncate">Customer: {bill.customerName || 'Walk-in'} • {new Date(bill.date || bill.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">{formatINR(bill.grandTotal)}</p>
                        <p className="text-[9px] text-slate-500">{bill.items?.length || 0} items</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {selectableItems.length === 0 && (
            <div className="px-4 py-8 text-center bg-slate-900 flex flex-col items-center justify-center">
              <div className="text-2xl mb-2 text-slate-500"><FaSearch /></div>
              <p className="text-slate-400 text-sm font-medium">No results found for "{query}"</p>
              <p className="text-slate-600 text-xs mt-1">Try another keyword, or ask a question like "sales today"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Layout Component ───────────────────────────────────────────
export default function Layout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)



  const location = useLocation()
  const { profile, signOut } = useAuth()
  const userName = profile?.name || 'ERP User'
  const userRole = profile?.role === 'admin' ? 'Admin' : 'Cashier'
  const userTitle = profile?.title || userRole

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const filteredNavItems = navItems.filter((item) => {
    if (userRole === 'Admin') return true

    if (userRole === 'Cashier') {
      const allowedPaths = [
        '/pos',
        '/sales/history'
      ]
      return item.type === 'divider' || allowedPaths.includes(item.path)
    }

    return true
  })

  const cleanNavItems = []
  filteredNavItems.forEach((item, index) => {
    if (item.type === 'divider') {
      const hasContentAfter = filteredNavItems.slice(index + 1).some(nextItem => {
        if (nextItem.type === 'divider') return false
        if (userRole === 'Cashier') {
          return ['/pos', '/sales/history'].includes(nextItem.path)
        }
        return true
      })
      if (cleanNavItems.length > 0 && hasContentAfter) {
        cleanNavItems.push(item)
      }
    } else {
      cleanNavItems.push(item)
    }
  })

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try { await signOut(); navigate('/login') } catch (error) { window.alert(`Unable to sign out: ${error.message}`) }
  }
  const pendingSyncCount = 0

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved) return saved
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      const root = window.document.documentElement
      if (theme === 'light') {
        root.classList.add('light')
      } else {
        root.classList.remove('light')
      }
      localStorage.setItem('theme', theme)
      window.dispatchEvent(new CustomEvent('erp:theme_changed', { detail: { theme } }))
    } catch (e) {}
  }, [theme])

  useEffect(() => {
    const handleThemeChange = (e) => {
      const newTheme = e.detail?.theme || localStorage.getItem('theme')
      if (newTheme && newTheme !== theme) {
        setTheme(newTheme)
      }
    }
    window.addEventListener('erp:theme_changed', handleThemeChange)
    window.addEventListener('storage', handleThemeChange)
    return () => {
      window.removeEventListener('erp:theme_changed', handleThemeChange)
      window.removeEventListener('storage', handleThemeChange)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const [missingMrpCount, setMissingMrpCount] = useState(0)
  useEffect(() => {
    const handleCountChange = (e) => {
      setMissingMrpCount(e.detail?.count || 0)
    }
    window.addEventListener('erp:missing_mrp_count_changed', handleCountChange)
    return () => window.removeEventListener('erp:missing_mrp_count_changed', handleCountChange)
  }, [])

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* ─── Mobile Overlay ────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ──────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-full shrink-0
          flex flex-col
          bg-slate-950/95 backdrop-blur-2xl
          border-r border-slate-800/60
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-[72px]'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Logo Area ──────────────────────────────────── */}
        <div className={`flex items-center h-16 border-b border-slate-800/60 flex-shrink-0 ${sidebarOpen ? 'px-5 gap-3' : 'px-0 justify-center'}`}>
          <img
            src={guptaTradersLogo}
            alt="Gupta Traders Logo"
            className="w-9 h-9 object-contain rounded-xl shadow-md border border-slate-800/80 bg-slate-900/50 p-0.5 flex-shrink-0 animate-pulse-slow"
          />
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-slate-50 leading-tight whitespace-nowrap font-gupta">Gupta Traders</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase whitespace-nowrap">Management System</p>
            </div>
          )}
        </div>

        {/* ── Navigation ─────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 scrollbar-thin">
          {cleanNavItems.map((item, idx) => {
            if (item.type === 'divider') {
              return (
                <div key={`divider-${idx}`} className="pt-4 pb-2">
                  {sidebarOpen && (
                    <p className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                      {item.label}
                    </p>
                  )}
                  {!sidebarOpen && <div className="border-t border-slate-800/60 mx-2" />}
                </div>
              )
            }

            const isSalesRoute = item.path === '/sales/history' && location.pathname.startsWith('/sales')

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) => {
                  const active = isActive || isSalesRoute
                  return `group flex items-center gap-3 rounded-xl transition-all duration-200 relative
                   ${sidebarOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'}
                   ${active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }
                   ${item.highlight && !active ? '!text-amber-400 hover:!text-amber-300 hover:!bg-amber-500/10' : ''}
                  `
                }}
              >
                {({ isActive }) => {
                  const active = isActive || isSalesRoute
                  return (
                    <>
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400" />
                      )}

                      <span className={`flex-shrink-0 transition-colors ${active ? 'text-emerald-400' : ''}`}>
                        {item.icon}
                      </span>

                      {sidebarOpen && (
                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                          {item.label}
                        </span>
                      )}

                      {item.highlight && sidebarOpen && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          POS
                        </span>
                      )}

                      {!sidebarOpen && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl border border-slate-700/60 z-[60] pointer-events-none">
                          {item.label}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700/60 rotate-45" />
                        </div>
                      )}
                    </>
                  )
                }}
              </NavLink>
            )
          })}
        </nav>

        {/* ── Sidebar Toggle (Desktop) ───────────────────── */}
        <div className="flex-shrink-0 border-t border-slate-800/60 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden lg:flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-200 ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
            {sidebarOpen && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* ── Top Bar ────────────────────────────────────── */}
        <header className="shrink-0 z-30 h-16 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {mobileSearchOpen && (
            <div className="absolute inset-0 bg-slate-950 flex items-center px-4 gap-2 z-50 animate-fadeIn">
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                title="Close Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
              <HeaderSearch navigate={navigate} isMobile={true} onClose={() => setMobileSearchOpen(false)} />
            </div>
          )}

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <MenuIcon />
          </button>

          <button
            onClick={() => setMobileSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
            title="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>

          <HeaderSearch navigate={navigate} />

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m8.966-8.966h-2.25m-13.5 0H3m15.364 6.364l-1.591-1.591M6.75 6.75L5.159 5.159m12.728 0l-1.591 1.591M6.75 17.25l-1.591 1.591M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Offline Sync Queue Indicator */}
            {pendingSyncCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold animate-pulse">
                <span>⚡</span>
                <span>{pendingSyncCount} Syncing</span>
              </div>
            )}

            {/* Missing MRP Alert Header Indicator */}
            {missingMrpCount > 0 && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('erp:open_missing_mrp_modal'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-amber-500/5 animate-pulse"
                title={`${missingMrpCount} products missing MRP. Click to review.`}
              >
                <span>⚠️</span>
                <span className="hidden sm:inline">{missingMrpCount} Missing MRP</span>
                <span className="sm:hidden">{missingMrpCount}</span>
              </button>
            )}

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{userName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{userTitle} ({userRole})</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-800/60 md:hidden">
                    <p className="text-xs font-semibold text-slate-200">{userName}</p>
                    <p className="text-[10px] text-slate-500">{userTitle} ({userRole})</p>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-colors"
                  >
                    Account Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Outlet Content ────────────────────────── */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="shrink-0">
          <Footer />
        </div>
      </div>


    </div>
  )
}
