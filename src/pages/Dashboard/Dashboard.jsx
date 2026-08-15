import { useState, useEffect } from 'react'

// ─── Sample Data ────────────────────────────────────────────────
const dashboardData = {
  todaysSales: 24850,
  todaysPurchase: 18200,
  todaysProfit: 6650,
  totalProducts: 342,
  totalCustomers: 1285,
  lowStockItems: 8,
}

const recentSales = [
  { id: 'INV-001', customer: 'Rajesh Kumar', items: 'Cement (50 bags)', amount: 12500, time: '2 min ago', status: 'completed' },
  { id: 'INV-002', customer: 'Amit Sharma', items: 'Steel Rods (20 pcs)', amount: 8400, time: '15 min ago', status: 'completed' },
  { id: 'INV-003', customer: 'Priya Singh', items: 'Paint (10 L)', amount: 3200, time: '45 min ago', status: 'pending' },
  { id: 'INV-004', customer: 'Sunil Gupta', items: 'Bricks (500 pcs)', amount: 4500, time: '1 hr ago', status: 'completed' },
  { id: 'INV-005', customer: 'Meena Devi', items: 'Sand (2 trucks)', amount: 7800, time: '2 hr ago', status: 'completed' },
  { id: 'INV-006', customer: 'Vikram Patel', items: 'Tiles (100 sqft)', amount: 6200, time: '3 hr ago', status: 'pending' },
]

const salesOverview = [
  { day: 'Mon', sales: 18500 },
  { day: 'Tue', sales: 22300 },
  { day: 'Wed', sales: 19800 },
  { day: 'Thu', sales: 27600 },
  { day: 'Fri', sales: 24100 },
  { day: 'Sat', sales: 31200 },
  { day: 'Sun', sales: 14500 },
]

// ─── Icons (inline SVG) ─────────────────────────────────────────
function SalesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function PurchaseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  )
}

function ProfitIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  )
}

function ProductsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function CustomersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

// ─── Animated Counter ───────────────────────────────────────────
function AnimatedNumber({ value, isCurrency = false }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const end = value
    const duration = 1200
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

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ title, value, icon, gradient, isCurrency = false }) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl p-5 transition-all duration-300 hover:border-slate-700/80 hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-1">
      {/* Gradient glow on hover */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-slate-50 tabular-nums">
            <AnimatedNumber value={value} isCurrency={isCurrency} />
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${gradient}`} />
    </div>
  )
}

// ─── Sales Overview Bar Chart ───────────────────────────────────
function SalesChart({ data }) {
  const maxSales = Math.max(...data.map(d => d.sales))
  const chartHeight = 200

  return (
    <div className="flex items-end justify-between gap-3 px-2" style={{ height: chartHeight }}>
      {data.map((item) => {
        const barHeight = (item.sales / maxSales) * (chartHeight - 40)
        return (
          <div key={item.day} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-semibold text-emerald-400 whitespace-nowrap">
              ₹{item.sales.toLocaleString('en-IN')}
            </div>
            <div
              className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 ease-out group-hover:from-emerald-500 group-hover:to-cyan-400 relative overflow-hidden"
              style={{ height: `${barHeight}px` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
              {item.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Completed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      Pending
    </span>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening'
  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const stats = [
    { title: "Today's Sales", value: dashboardData.todaysSales, icon: <SalesIcon />, gradient: 'from-emerald-500 to-teal-600', isCurrency: true },
    { title: "Today's Purchase", value: dashboardData.todaysPurchase, icon: <PurchaseIcon />, gradient: 'from-blue-500 to-indigo-600', isCurrency: true },
    { title: "Today's Profit", value: dashboardData.todaysProfit, icon: <ProfitIcon />, gradient: 'from-violet-500 to-purple-600', isCurrency: true },
    { title: 'Total Products', value: dashboardData.totalProducts, icon: <ProductsIcon />, gradient: 'from-cyan-500 to-sky-600', isCurrency: false },
    { title: 'Total Customers', value: dashboardData.totalCustomers, icon: <CustomersIcon />, gradient: 'from-orange-500 to-amber-600', isCurrency: false },
    { title: 'Low Stock Alert', value: dashboardData.lowStockItems, icon: <AlertIcon />, gradient: 'from-rose-500 to-red-600', isCurrency: false },
  ]

  return (
    <div className="selection:bg-emerald-500 selection:text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-50">
            {greeting} 👋
          </h2>
          <p className="text-slate-400 mt-1 text-sm">{formattedDate} — Here&apos;s your business overview</p>
        </div>

        {/* ─── Stat Cards Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
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

        {/* ─── Bottom Section: Recent Sales + Sales Overview ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Recent Sales Table */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Recent Sales</h3>
              </div>
              <button className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10">
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-slate-300">{sale.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-slate-200">{sale.customer}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{sale.time}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">{sale.items}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-semibold text-slate-100">₹{sale.amount.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={sale.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales Overview Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Sales Overview</h3>
              </div>
              <span className="text-xs font-medium text-slate-500 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40">This Week</span>
            </div>

            <div className="grid grid-cols-2 gap-4 p-5 border-b border-slate-800/40">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
                <p className="text-xl font-bold text-slate-50">₹{salesOverview.reduce((a, b) => a + b.sales, 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Avg. Daily</p>
                <p className="text-xl font-bold text-slate-50">₹{Math.round(salesOverview.reduce((a, b) => a + b.sales, 0) / 7).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="p-5">
              <SalesChart data={salesOverview} />
            </div>

            <div className="mx-5 mb-5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/15">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-semibold">Best Day: Saturday</p>
                <p className="text-xs text-slate-500">₹31,200 in sales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
