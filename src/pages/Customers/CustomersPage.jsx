import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { deleteCustomer, listUICustomers, subscribeToTable } from '../../services/erpService'
import { useAuth } from '../../context/AuthContext'
import { formatINR } from '../../utils/erp'

// Components
import Toast from './Toast'
import DeleteConfirmModal from './DeleteConfirmModal'
import CustomerFormModal from './CustomerFormModal'
import CustomerLedgerModal from './CustomerLedgerModal'

// Icons
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon,
  CloseIcon,
  CustomersIcon,
  LedgerIcon,
  POSIcon
} from './Icons'

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const userRole = role === 'cashier' ? 'Cashier' : role === 'manager' ? 'Manager' : 'Admin'

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Lists & Stats
  const [customers, setCustomers] = useState([])

  // Reset page to 1 when filters or sort order change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, statusFilter, sortBy])

  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalReceivables: 0,
    totalAdvances: 0,
    totalCreditLimit: 0,
    utilisedCredit: 0,
    overdueCount: 0
  })

  // Modals & UI Controls
  const [showFormModal, setShowFormModal] = useState(false)
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Toast notifications
  const [toast, setToast] = useState(null)

  // Sync Search Query from URL Search Params (e.g. from POS clicking view customer)
  useEffect(() => {
    const searchVal = searchParams.get('search')
    if (searchVal !== null) {
      setSearchQuery(searchVal)
    }
  }, [searchParams])

  // Load Data
  const loadData = async () => {
    try { const list = await listUICustomers()
    setCustomers(list)
    const active=list.filter(c=>c.status==='active');setStats({totalCustomers:list.length,activeCustomers:active.length,totalReceivables:active.reduce((n,c)=>n+Math.max(0,c.outstandingBalance),0),totalAdvances:active.reduce((n,c)=>n+Math.max(0,-c.outstandingBalance),0),totalCreditLimit:active.reduce((n,c)=>n+c.creditLimit,0),utilisedCredit:active.reduce((n,c)=>n+Math.min(Math.max(0,c.outstandingBalance),c.creditLimit),0),overdueCount:active.filter(c=>c.outstandingBalance>c.creditLimit).length})

    // If ledger modal is open, update selected customer details to match updated stats
    if (showLedgerModal && selectedCustomer) {
      const updatedCust = list.find(c => c.id === selectedCustomer.id)
      if (updatedCust) {
        setSelectedCustomer(updatedCust)
      }
    }
    }catch(error){triggerToast(error.message,'error')}
  }

  useEffect(() => {
    loadData()
    return subscribeToTable('customers',loadData)
  }, [showLedgerModal])

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleSaveCustomer = (data, action) => {
    if (userRole === 'Cashier') {
      triggerToast('Permission Denied: Cashier cannot register or edit customers', 'error')
      return
    }
    setShowFormModal(false)
    setSelectedCustomer(null)
    loadData()
    triggerToast(
      `Customer "${data.name}" ${action === 'updated' ? 'details updated' : 'registered successfully'}`,
      'success'
    )
  }

  const handleDeleteConfirm = async (id) => {
    if (userRole === 'Cashier') {
      triggerToast('Permission Denied: Cashier cannot delete customers', 'error')
      return
    }
    try {await deleteCustomer(id);setShowDeleteModal(false);setSelectedCustomer(null);await loadData()
      triggerToast('Customer deleted successfully', 'success')
    }catch(error){triggerToast(error.message,'error')}
  }

  const handleTransactionRecorded = (updatedCust, message) => {
    loadData()
    setSelectedCustomer(updatedCust)
    triggerToast(message, 'success')
  }

  // Clear Filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setStatusFilter('all')
    setSortBy('newest')
    setCurrentPage(1)
    setSearchParams({})
  }

  // Filter & Search logic
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query ||
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.gstin && c.gstin.toLowerCase().includes(query)) ||
      (c.city && c.city.toLowerCase().includes(query)) ||
      c.id.toLowerCase().includes(query)

    const matchesType = typeFilter === 'all' || c.customerType === typeFilter

    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = c.status === 'active'
    else if (statusFilter === 'inactive') matchesStatus = c.status === 'inactive'
    else if (statusFilter === 'receivables') matchesStatus = c.status === 'active' && c.outstandingBalance > 0
    else if (statusFilter === 'advances') matchesStatus = c.status === 'active' && c.outstandingBalance < 0
    else if (statusFilter === 'overdue') matchesStatus = c.status === 'active' && c.outstandingBalance > c.creditLimit

    return matchesSearch && matchesType && matchesStatus
  })

  // Sort logic
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name)
    }
    return 0
  })

  // Pagination logic
  const totalItems = sortedCustomers.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Ensure current page doesn't exceed total pages if list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Format type badges
  const renderTypeBadge = (type) => {
    let classes = ''
    switch (type) {
      case 'contractor':
        classes = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        break
      case 'wholesaler':
        classes = 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
        break
      case 'regular':
        classes = 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
        break
      default:
        classes = 'bg-slate-500/10 text-slate-400 border border-slate-800'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${classes}`}>
        {type}
      </span>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 font-semibold text-slate-400">
              ERP Module
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer credit, outstanding invoices, advances, and transaction ledgers.
          </p>
        </div>
        {userRole !== 'Cashier' && (
          <button
            onClick={() => {
              setSelectedCustomer(null)
              setShowFormModal(true)
            }}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-100 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 hover:-translate-y-0.5 cursor-pointer"
          >
            <PlusIcon />
            <span>Register Customer</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Customers */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <CustomersIcon />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Clients</p>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{stats.totalCustomers}</h3>
            <p className="text-[10px] text-emerald-400 font-semibold mt-1">
              {stats.activeCustomers} Active Profiles
            </p>
          </div>
        </div>

        {/* Card 2: Receivables */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.727.054a3.5 3.5 0 1 0 0-7.09l-.727.054M15 6.341C14.5 5.5 13 4.5 12 4.5c-1 0-2.5 1-3 1.841M15 17.66c-.5.84-2 1.84-3 1.84-1 0-2.5-1-3-1.841" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Owed Receivables</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">{formatINR(stats.totalReceivables)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Outstanding credit balance
            </p>
          </div>
        </div>

        {/* Card 3: Advances */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Advances Held</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatINR(stats.totalAdvances)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Deposit credits/advance pay
            </p>
          </div>
        </div>

        {/* Card 4: Limit Breaches */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl hover:border-slate-800 transition-all flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Limit Breaches</p>
            <h3 className={`text-2xl font-black mt-1 ${stats.overdueCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {stats.overdueCount}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Outstanding exceeds limit
            </p>
          </div>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setSearchParams(e.target.value ? { search: e.target.value } : {})
            }}
            placeholder="Search by Name, Contact, GSTIN, or City..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-teal-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchParams({}); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/85 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="retail">Retail Clients</option>
              <option value="regular">Regular</option>
              <option value="contractor">Contractors</option>
              <option value="wholesaler">Wholesalers</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/85 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Balance:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="receivables">Owed/Receivables (&gt;0)</option>
              <option value="advances">Advances/Credits (&lt;0)</option>
              <option value="overdue">Credit Breached</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/85 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-semibold focus:outline-none cursor-pointer text-slate-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>

          {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-semibold text-teal-400 hover:text-teal-300 border border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 rounded-xl cursor-pointer transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop view table — hidden on mobile */}
      <div className="hidden lg:block bg-slate-900 border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Client Type</th>
                <th className="px-6 py-4">Credit Utilisation</th>
                <th className="px-6 py-4 text-right">Outstanding Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/40">
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((cust) => {
                  const creditLimit = cust.creditLimit || 1
                  const usagePct = Math.min(Math.round((cust.outstandingBalance / creditLimit) * 100), 100)
                  const isBreach = cust.outstandingBalance > creditLimit
                  const barColor = isBreach ? 'bg-rose-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-teal-500'

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-950/20 transition-colors group"
                    >
                      {/* Column 1: Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 text-slate-400 border border-slate-850 flex items-center justify-center text-xs font-bold leading-none shrink-0 group-hover:border-teal-500/35 overflow-hidden transition-colors">
                            {cust.profilePic ? (
                              <img src={cust.profilePic} alt={cust.name} className="w-full h-full object-cover" />
                            ) : (
                              cust.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-200 group-hover:text-slate-100 transition-colors">
                                {cust.name}
                              </span>
                              <span className="text-[9px] font-bold font-mono text-slate-500 bg-slate-800/40 border border-slate-800 px-1.5 py-0.2 rounded">
                                {cust.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium space-x-2 mt-1">
                              {cust.phone && <span>📞 {cust.phone}</span>}
                              {cust.city && <span>📍 {cust.city}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Type */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {renderTypeBadge(cust.customerType)}
                          {cust.gstin && (
                            <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase">
                              GSTIN: {cust.gstin}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Credit Usage */}
                      <td className="px-6 py-4 min-w-[180px]">
                        {cust.outstandingBalance > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-400 leading-none">
                              <span>Used: {usagePct}%</span>
                              <span>Lim: {formatINR(cust.creditLimit)}</span>
                            </div>
                            <div className="w-full bg-slate-950 border border-slate-850 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barColor} transition-all duration-300`}
                                style={{ width: `${usagePct}%` }}
                              ></div>
                            </div>
                            {isBreach && (
                              <p className="text-[9px] text-rose-400 font-bold leading-none animate-pulse">
                                Over credit limit!
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium italic">
                            No credit used
                          </span>
                        )}
                      </td>

                      {/* Column 4: Outstanding Balance */}
                      <td className="px-6 py-4 text-right">
                        <div className="font-mono">
                          <span className={`text-sm font-black ${cust.outstandingBalance > 0
                            ? 'text-rose-400'
                            : cust.outstandingBalance < 0
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                            }`}>
                            {formatINR(cust.outstandingBalance)}
                          </span>
                          <p className="text-[9px] text-slate-500 font-sans mt-0.5">
                            {cust.outstandingBalance > 0
                              ? 'receivables'
                              : cust.outstandingBalance < 0
                                ? 'advance deposit'
                                : 'settled'}
                          </p>
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cust.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-500/10 text-slate-400'
                          }`}>
                          {cust.status}
                        </span>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(cust)
                              setShowLedgerModal(true)
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-teal-400 hover:bg-slate-850 hover:text-teal-300 transition-all cursor-pointer"
                            title="Account Ledger Statement"
                          >
                            <LedgerIcon />
                          </button>

                          <button
                            onClick={() => {
                              navigate(`/pos?customerName=${encodeURIComponent(cust.name)}`)
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-emerald-400 hover:bg-slate-850 hover:text-emerald-300 transition-all cursor-pointer"
                            title="Generate Bill for Customer"
                          >
                            <POSIcon />
                          </button>

                          {userRole !== 'Cashier' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust)
                                  setShowFormModal(true)
                                }}
                                className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-blue-400 hover:bg-slate-850 hover:text-blue-300 transition-all cursor-pointer"
                                title="Edit Customer Details"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(cust)
                                  setShowDeleteModal(true)
                                }}
                                className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-rose-500 hover:bg-slate-850 hover:text-rose-400 transition-all cursor-pointer"
                                title="Delete Customer"
                              >
                                <DeleteIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-550">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-650 mx-auto mb-3">
                      <CustomersIcon />
                    </div>
                    <p className="text-sm font-semibold">No customers found</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Try adjusting your keywords, type filter, or add a new customer.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view card grid — hidden on desktop */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {paginatedCustomers.length > 0 ? (
          paginatedCustomers.map((cust) => {
            const creditLimit = cust.creditLimit || 1
            const usagePct = Math.min(Math.round((cust.outstandingBalance / creditLimit) * 100), 100)
            const isBreach = cust.outstandingBalance > creditLimit
            const barColor = isBreach ? 'bg-rose-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-teal-500'

            return (
              <div key={cust.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200 space-y-3">
                {/* Top Row: Profile, Name, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 text-slate-400 border border-slate-850 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                      {cust.profilePic ? (
                        <img src={cust.profilePic} alt={cust.name} className="w-full h-full object-cover" />
                      ) : (
                        cust.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-200 truncate">{cust.name}</h3>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {cust.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${cust.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-500/10 text-slate-400'
                    }`}>
                    {cust.status}
                  </span>
                </div>

                {/* Client Type & GSTIN */}
                <div className="flex flex-wrap items-center gap-2">
                  {renderTypeBadge(cust.customerType)}
                  {cust.gstin && (
                    <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 uppercase tracking-wider">
                      GSTIN: {cust.gstin}
                    </span>
                  )}
                </div>

                {/* Contact & Location Details */}
                {(cust.phone || cust.city) && (
                  <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/40">
                    {cust.phone && (
                      <div className="flex items-center gap-1.5">
                        <span>📞</span>
                        <a href={`tel:${cust.phone}`} className="hover:underline font-medium">{cust.phone}</a>
                      </div>
                    )}
                    {cust.city && (
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{cust.city}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Credit Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 leading-none">
                    <span>Credit Used: {cust.outstandingBalance > 0 ? `${usagePct}%` : '0%'}</span>
                    <span>Limit: {formatINR(creditLimit)}</span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-850 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-300`}
                      style={{ width: `${cust.outstandingBalance > 0 ? usagePct : 0}%` }}
                    ></div>
                  </div>
                  {cust.outstandingBalance > creditLimit && (
                    <p className="text-[9px] text-rose-400 font-bold leading-none animate-pulse">
                      Over credit limit!
                    </p>
                  )}
                </div>

                {/* Balance & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                  <div>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider leading-none mb-1">Outstanding</p>
                    <div className="font-mono">
                      <span className={`text-sm font-black ${cust.outstandingBalance > 0
                        ? 'text-rose-400'
                        : cust.outstandingBalance < 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                        }`}>
                        {formatINR(cust.outstandingBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedCustomer(cust)
                        setShowLedgerModal(true)
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-500/10 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-100 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <LedgerIcon />
                      Ledger
                    </button>

                    <button
                      onClick={() => {
                        navigate(`/pos?customerName=${encodeURIComponent(cust.name)}`)
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-500/10 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-455 hover:text-slate-100 font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <POSIcon />
                      Bill
                    </button>

                    {userRole !== 'Cashier' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCustomer(cust)
                            setShowFormModal(true)
                          }}
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-blue-400 hover:text-slate-200 transition-all cursor-pointer"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(cust)
                            setShowDeleteModal(true)
                          }}
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-rose-500 hover:text-slate-200 transition-all cursor-pointer"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-16 text-center text-slate-500 col-span-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-650 mx-auto mb-3">
              <CustomersIcon />
            </div>
            <p className="text-sm font-semibold">No customers found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400">
            Showing <span className="text-slate-200">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to{' '}
            <span className="text-slate-200">{Math.min(totalItems, currentPage * pageSize)}</span> of{' '}
            <span className="text-slate-200">{totalItems}</span> customers
          </div>

          <div className="flex items-center gap-1.5">
            {/* Prev Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border border-slate-800 bg-slate-950/40 text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${currentPage === 1
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-350 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-900'
                }`}
              title="Previous Page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (
                totalPages <= 5 ||
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              ) {
                const isActive = page === currentPage
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isActive
                      ? 'bg-teal-600 border-teal-500/30 text-slate-100 shadow-md shadow-teal-600/20'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                  >
                    {page}
                  </button>
                )
              }
              if (page === 2 || page === totalPages - 1) {
                return (
                  <span key={page} className="px-1 text-slate-500 text-xs font-bold">
                    ...
                  </span>
                )
              }
              return null
            })}

            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border border-slate-800 bg-slate-950/40 text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${currentPage === totalPages
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-350 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-900'
                }`}
              title="Next Page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Form Dialog Modal */}
      {showFormModal && (
        <CustomerFormModal
          customer={selectedCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setShowFormModal(false)
            setSelectedCustomer(null)
          }}
        />
      )}

      {/* Ledger Modal Drawer */}
      {showLedgerModal && selectedCustomer && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          onTransactionRecorded={handleTransactionRecorded}
          onClose={() => {
            setShowLedgerModal(false)
            setSelectedCustomer(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && selectedCustomer && (
        <DeleteConfirmModal
          customer={selectedCustomer}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false)
            setSelectedCustomer(null)
          }}
        />
      )}

    </div>
  )
}
