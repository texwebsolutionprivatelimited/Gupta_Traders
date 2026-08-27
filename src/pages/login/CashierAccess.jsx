import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaReceipt,
  FaUsers,
  FaChartLine
} from 'react-icons/fa'

// Static Sample Shift Data removed. Sourced dynamically from localStorage.

export default function CashierAccess() {
  const navigate = useNavigate()
  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const [shiftStats, setShiftStats] = useState({
    billsBilled: 0,
    totalBilled: 0,
    cashCollected: 0,
    cardCollected: 0,
    shiftStarted: '09:00 AM',
    drawerStatus: 'Balanced',
  })

  const [shiftSales, setShiftSales] = useState([])

  useEffect(() => {
    const sales = JSON.parse(localStorage.getItem('salesHistory') || '[]')
    const todayStr = new Date().toISOString().split('T')[0]
    const todaySales = sales.filter(s => s.date === todayStr)

    const billsCount = todaySales.length
    const revenue = todaySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0)

    const cash = todaySales
      .filter(s => (s.paymentMode || '').toLowerCase() === 'cash')
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0)

    const card = todaySales
      .filter(s => (s.paymentMode || '').toLowerCase() !== 'cash')
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0)

    setShiftStats({
      billsBilled: billsCount,
      totalBilled: revenue,
      cashCollected: cash,
      cardCollected: card,
      shiftStarted: '09:00 AM',
      drawerStatus: 'Balanced',
    })

    const recent = todaySales.slice(0, 5).map(s => {
      const itemsDesc = Array.isArray(s.items) 
        ? s.items.map(it => `${it.product} (${it.quantity})`).join(', ') 
        : ''
      return {
        id: s.invoice || s.id,
        customer: s.customer,
        items: itemsDesc || 'No items',
        amount: Number(s.total) || 0,
        time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Today',
        method: s.paymentMode || 'Cash'
      }
    })
    setShiftSales(recent)
  }, [])


  return (
    <div className="selection:bg-emerald-500 selection:text-white pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header & Shift Status */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800/40 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Authenticated: Cashier / Accountant
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-50 tracking-tight">
              Cashier Terminal Dashboard
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">{formattedDate} • Terminal #01 Active Session</p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={() => navigate('/pos')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer shadow-emerald-950/20"
            >
              <FaReceipt className="text-white text-sm" />
              <span>Open POS Billing Terminal</span>
            </button>
          </div>
        </div>

        {/* ─── Shift Summary Cards Grid ────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          {/* Bills count */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-4.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoices Billed Today</p>
            <p className="text-2xl font-bold text-slate-50 mt-1.5">{shiftStats.billsBilled} bills</p>
            <p className="text-[10px] text-slate-400 mt-2">Billed during current shift</p>
          </div>

          {/* Shift Revenue */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-4.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift Billed Amount</p>
            <p className="text-2xl font-bold text-emerald-450 mt-1.5">₹{shiftStats.totalBilled.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-2">Active Drawer Balance</p>
          </div>

          {/* Cash vs Card Split */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-4.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method Split</p>
            <div className="flex justify-between items-center mt-2.5">
              <div>
                <p className="text-[10px] font-medium text-slate-500">Cash</p>
                <p className="text-sm font-bold text-slate-200">₹{shiftStats.cashCollected.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <p className="text-[10px] font-medium text-slate-500">Card/UPI</p>
                <p className="text-sm font-bold text-slate-200">₹{shiftStats.cardCollected.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Drawer health */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-4.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift Session</p>
            <p className="text-lg font-bold text-slate-100 mt-1.5">Started at {shiftStats.shiftStarted}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-400 font-semibold">Drawer Status: {shiftStats.drawerStatus}</span>
            </div>
          </div>

        </div>

        {/* ─── Cashier Quick Access Shortcut Cards ──────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer text-left group hover:scale-[1.01]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FaReceipt className="text-emerald-450 text-2xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-400">1. POS Billing Terminal</h4>
              <p className="text-xs text-slate-400 mt-0.5">Create new invoices, scan products, print receipts.</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-4 p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer text-left group hover:scale-[1.01]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FaUsers className="text-blue-400 text-2xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-400">2. Customer Registry</h4>
              <p className="text-xs text-slate-400 mt-0.5">Manage customer directory, view balances, check credit limits.</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/sales')}
            className="flex items-center gap-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer text-left group hover:scale-[1.01]"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FaChartLine className="text-amber-400 text-2xl" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-400">3. Sales History</h4>
              <p className="text-xs text-slate-400 mt-0.5">Verify past invoices, check payment modes, void/reprint receipts.</p>
            </div>
          </button>

        </div>

        {/* ─── Recent Shift Receipts Table ──────────────────── */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FaReceipt className="text-cyan-400 text-lg" />
              <span>Your Recent Receipts Billed</span>
            </h3>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              View Shift Log →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-950/20">
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Billed Items</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Mode</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {shiftSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-bold text-cyan-400">{sale.id}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-semibold text-slate-200">{sale.customer}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{sale.time}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{sale.items}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                        {sale.method}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-slate-100">₹{sale.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => navigate('/pos')}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-cyan-500/10"
                      >
                        Reprint
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
