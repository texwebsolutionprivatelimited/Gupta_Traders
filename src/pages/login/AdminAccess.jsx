import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listUICustomers, listUIPurchases, listUIProducts, listUISales } from '../../services/erpService'
import {
  FaChartPie,
  FaReceipt,
  FaBox,
  FaTags,
  FaWarehouse,
  FaShoppingCart,
  FaChartLine,
  FaBuilding,
  FaUsers,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaKey,
  FaCog,
  FaPlug,
  FaLock,
  FaExclamationTriangle,
  FaChartBar
} from 'react-icons/fa'

// Dashboard data is loaded from Supabase.

// ─── Icons ─────────────────────────────────────────

function AnimatedNumber({ value, isCurrency = false }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const end = value
    const duration = 800
    const stepTime = 16
    const steps = Math.ceil(duration / stepTime)
    const increment = end / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        current = end
        clearInterval(timer)
      }
      setDisplay(Math.floor(current))
    }, stepTime)

    return () => clearInterval(timer)
  }, [value])

  if (isCurrency) {
    return <span>₹{display.toLocaleString('en-IN')}</span>
  }
  return <span>{display.toLocaleString('en-IN')}</span>
}

function StatCard({ title, value, icon, gradient, isCurrency = false }) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-3.5 sm:p-5 transition-all duration-300 hover:border-slate-700/80 hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-1">
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="space-y-2.5 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-wide uppercase leading-tight">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-50 tabular-nums">
            <AnimatedNumber value={value} isCurrency={isCurrency} />
          </p>
        </div>
        <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg flex-shrink-0`}>
          {icon}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${gradient}`} />
    </div>
  )
}

function SalesChart({ data }) {
  const maxSales = Math.max(...data.map(d => d.sales))
  const chartHeight = 150

  return (
    <div className="flex items-end justify-between gap-3 px-2 pt-4" style={{ height: chartHeight }}>
      {data.map((item) => {
        const barHeight = (item.sales / maxSales) * (chartHeight - 30)
        return (
          <div key={item.day} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold text-emerald-450 whitespace-nowrap">
              ₹{item.sales.toLocaleString('en-IN')}
            </div>
            <div
              className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-450 transition-all duration-700 ease-out group-hover:from-emerald-500 group-hover:to-cyan-400 relative overflow-hidden"
              style={{ height: `${barHeight}px` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
              {item.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminAccess() {
  const navigate = useNavigate()
  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const [dashboardData, setDashboardData] = useState({
    todaysSales: 0,
    todaysPurchase: 0,
    todaysProfit: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockItems: 0,
  })

  const [recentSales, setRecentSales] = useState([])
  const [salesOverview, setSalesOverview] = useState([])

  useEffect(() => {
    Promise.all([listUIProducts(), listUICustomers(), listUISales(), listUIPurchases()]).then(([products, customers, sales, purchases]) => {

    const todayStr = new Date().toISOString().split('T')[0]

    const todaysSalesVal = sales
      .filter(s => s.date === todayStr)
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0)

    const todaysPurchaseVal = purchases
      .filter(p => p.date === todayStr)
      .reduce((sum, p) => sum + (Number(p.total) || 0), 0)

    const todaysProfitVal = todaysSalesVal - todaysPurchaseVal

    const lowStockCount = products.filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 10)).length

    setDashboardData({
      todaysSales: todaysSalesVal,
      todaysPurchase: todaysPurchaseVal,
      todaysProfit: todaysProfitVal,
      totalProducts: products.length,
      totalCustomers: customers.length,
      lowStockItems: lowStockCount,
    })

    const recent = sales.slice(0, 5).map(s => {
      const itemsDesc = Array.isArray(s.items) 
        ? s.items.map(it => `${it.product} (${it.quantity})`).join(', ') 
        : ''
      return {
        id: s.invoice || s.id,
        customer: s.customer,
        items: itemsDesc || 'No items',
        amount: Number(s.total) || 0,
        time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Today',
        status: s.status === 'Returned' ? 'returned' : 'completed'
      }
    })
    setRecentSales(recent)

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - idx))
      const dateStr = d.toISOString().split('T')[0]
      const daySales = sales
        .filter(s => s.date === dateStr)
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0)
      return {
        day: days[d.getDay()],
        sales: daySales
      }
    })
    setSalesOverview(last7Days)
    }).catch(error => console.error('Unable to load dashboard', error))
  }, [])

  // List of all modules allowed for Admin/Owner
  const adminModules = [
    { label: 'Dashboard', path: '/', desc: 'Business summary', icon: <FaChartPie className="text-emerald-450" />, color: 'border-emerald-500/20 bg-emerald-500/5' },
    { label: 'POS Billing', path: '/pos', desc: 'Create sales receipt', icon: <FaReceipt className="text-amber-400" />, color: 'border-amber-500/20 bg-amber-500/5' },
    { label: 'Products', path: '/products', desc: 'Item database', icon: <FaBox className="text-blue-400" />, color: 'border-blue-500/20 bg-blue-500/5' },
    { label: 'Categories', path: '/categories', desc: 'Product groups', icon: <FaTags className="text-purple-400" />, color: 'border-purple-500/20 bg-purple-500/5' },
    { label: 'Inventory', path: '/inventory', desc: 'Manage stock', icon: <FaWarehouse className="text-cyan-400" />, color: 'border-cyan-500/20 bg-cyan-500/5' },
    { label: 'Purchase', path: '/purchase', desc: 'Vendor orders', icon: <FaShoppingCart className="text-indigo-400" />, color: 'border-indigo-500/20 bg-indigo-500/5' },
    { label: 'Sales', path: '/sales', desc: 'Invoices & records', icon: <FaChartLine className="text-emerald-450" />, color: 'border-emerald-500/20 bg-emerald-500/5' },
    { label: 'Suppliers', path: '/suppliers', desc: 'Vendor directory', icon: <FaBuilding className="text-sky-400" />, color: 'border-sky-500/20 bg-sky-500/5' },
    { label: 'Customers', path: '/customers', desc: 'Client profiles', icon: <FaUsers className="text-orange-400" />, color: 'border-orange-500/20 bg-orange-500/5' },
    { label: 'Expenses', path: '/expenses', desc: 'Store spendings', icon: <FaMoneyBillWave className="text-rose-400" />, color: 'border-rose-500/20 bg-rose-500/5' },
    { label: 'Reports', path: '/reports', desc: 'Store reports', icon: <FaFileInvoiceDollar className="text-teal-400" />, color: 'border-teal-500/20 bg-teal-500/5' },
    { label: 'Users', path: '/users', desc: 'Staff access config', icon: <FaKey className="text-violet-400" />, color: 'border-violet-500/20 bg-violet-500/5' },
    { label: 'Settings', path: '/settings', desc: 'ERP Preferences', icon: <FaCog className="text-slate-400" />, color: 'border-slate-500/20 bg-slate-500/5' },
    { label: 'Hardware', path: '/hardware', desc: 'Printers & scales', icon: <FaPlug className="text-pink-400" />, color: 'border-pink-500/20 bg-pink-500/5' },
  ]

  const stats = [
    { title: "Today's Sales", value: dashboardData.todaysSales, icon: <FaChartLine className="w-6 h-6" />, gradient: 'from-emerald-500 to-teal-600', isCurrency: true },
    { title: "Today's Purchase", value: dashboardData.todaysPurchase, icon: <FaShoppingCart className="w-6 h-6" />, gradient: 'from-blue-500 to-indigo-600', isCurrency: true },
    { title: "Today's Profit", value: dashboardData.todaysProfit, icon: <FaMoneyBillWave className="w-6 h-6" />, gradient: 'from-violet-500 to-purple-600', isCurrency: true },
    { title: 'Total Products', value: dashboardData.totalProducts, icon: <FaBox className="w-6 h-6" />, gradient: 'from-cyan-500 to-sky-600', isCurrency: false },
    { title: 'Total Customers', value: dashboardData.totalCustomers, icon: <FaUsers className="w-6 h-6" />, gradient: 'from-orange-500 to-amber-600', isCurrency: false },
    { title: 'Low Stock Alerts', value: dashboardData.lowStockItems, icon: <FaExclamationTriangle className="w-6 h-6" />, gradient: 'from-rose-500 to-red-600', isCurrency: false },
  ]

  return (
    <div className="selection:bg-emerald-500 selection:text-white pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header and Welcome */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800/40 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Authenticated: Admin / Owner
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-50 tracking-tight">
              Owner Cockpit
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">{formattedDate} • Full System Administrator Access</p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={() => navigate('/pos')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Open POS Terminal
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Configure ERP Settings
            </button>
          </div>
        </div>

        {/* ─── Stat Cards Grid ─────────────────────────────── */}
        <div className="dashboard-stats-grid">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              gradient={stat.gradient}
              isCurrency={stat.isCurrency}
            />
          ))}
        </div>

        {/* ─── Layout Section: Module Access Grid + Charts ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Admin authorized modules checklist */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-5">
            <div className="flex items-center gap-3 mb-4.5 border-b border-slate-800/40 pb-3">
              <FaLock className="text-lg text-slate-450" />
              <h3 className="text-base font-bold text-slate-100">Owner Access Directory ({adminModules.length} Modules)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {adminModules.map((mod) => (
                <button
                  key={mod.label}
                  onClick={() => navigate(mod.path)}
                  className={`flex flex-col items-start text-left p-3.5 rounded-xl border ${mod.color} hover:bg-slate-800/20 transition-all hover:border-slate-700 group cursor-pointer hover:shadow-lg`}
                >
                  <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform">{mod.icon}</span>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-450 transition-colors">{mod.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{mod.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Side stats: chart or warnings */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <FaChartBar className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="text-base font-bold text-slate-100">Revenue overview</h3>
              </div>
              <span className="text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 uppercase tracking-widest">This Week</span>
            </div>

            <div className="grid grid-cols-2 gap-4 px-5 py-4 border-b border-slate-800/40">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Weekly Revenue</p>
                <p className="text-lg font-bold text-slate-100">₹{salesOverview.reduce((a, b) => a + b.sales, 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Daily</p>
                <p className="text-lg font-bold text-slate-100">₹{Math.round(salesOverview.reduce((a, b) => a + b.sales, 0) / 7).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="px-5 py-2 flex-1">
              <SalesChart data={salesOverview} />
            </div>
          </div>
        </div>

        {/* ─── Bottom Section: Recent Sales table ─── */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FaReceipt className="text-emerald-450 text-base" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Recent Sales Audit</h3>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-500/20 cursor-pointer"
            >
              Audit All Sales →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-950/20">
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No.</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Billed Items</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Dispatch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-emerald-450">{sale.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-slate-200">{sale.customer}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{sale.time}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">{sale.items}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold text-slate-100">₹{sale.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${sale.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        <span className={`w-1 h-1 rounded-full ${sale.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                        {sale.status.toUpperCase()}
                      </span>
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
