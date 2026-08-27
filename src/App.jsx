import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { initSyncManager, pullSupabaseData } from './supabase/syncManager'
import Home from './pages/Dashboard/Dashboard'
import POSBilling from './pages/Billing/POSBilling'
import ProductsPage from './pages/Products/ProductsPage'
import CategoriesPage from './pages/Categories/CategoriesPage'
import InventoryPage from './pages/Inventory'
import SuppliersPage from './pages/Suppliers'
import CustomersPage from './pages/Customers'
import LoginPage from './pages/login'
import TrashPage from './pages/Trash'
import guptaTradersLogo from './assets/gupta traders logo.png'

// Context Providers
import { ExpenseProvider } from './context/ExpenseContext'
import { ReportProvider } from './context/ReportContext'

// Purchase components
import PurchaseEntry from './pages/Purchase/PurchaseEntry'
import PurchaseHistory from './pages/Purchase/PurchaseHistory'
import PurchaseReturn from './pages/Purchase/PurchaseReturn'

// Sales components
import SalesEntry from './pages/Sales/SalesEntry'
import SalesHistory from './pages/Sales/SalesHistory'
import SalesReturn from './pages/Sales/SalesReturn'
import InvoiceReprint from './pages/Sales/InvoiceReprint'

// Expenses components
import Expenses from './pages/Expenses/Expenses'
import Rent from './pages/Expenses/Rent'
import Electricity from './pages/Expenses/Electricity'
import StaffSalary from './pages/Expenses/StaffSalary'
import Miscellaneous from './pages/Expenses/Miscellaneous'

// Reports components
import Reports from './pages/Reports/Reports'
import SalesReport from './pages/Reports/SalesReport'
import PurchaseReport from './pages/Reports/PurchaseReport'
import StockReport from './pages/Reports/StockReport'
import ProfitReport from './pages/Reports/ProfitReport'
import ExpenseReport from './pages/Reports/ExpenseReport'
import CustomerReport from './pages/Reports/CustomerReport'
import SupplierReport from './pages/Reports/SupplierReport'
import LowStockReport from './pages/Reports/LowStockReport'

// User Management components
import UserManagement from './pages/UserManagement/UserManagement'
import AddUser from './pages/UserManagement/AddUser'
import EditUser from './pages/UserManagement/EditUser'
import RolePermissions from './pages/UserManagement/RolePermissions'
import UserDetails from './pages/UserManagement/UserDetails'

// Settings components
import Settings from './pages/Settings/Settings'
import ShopInformation from './pages/Settings/ShopInformation'
import GSTSettings from './pages/Settings/GSTSettings'
import InvoiceSettings from './pages/Settings/InvoiceSettings'
import PrinterSettings from './pages/Settings/PrinterSettings'
import BackupRestore from './pages/Settings/BackupRestore'

// Hardware components
import Hardware from './pages/Hardware/Hardware'
import BarcodeScanner from './pages/Hardware/BarcodeScanner'
import ThermalPrinter from './pages/Hardware/ThermalPrinter'
import USBPrinter from './pages/Hardware/USBPrinter'
import BarcodeGenerator from './pages/Barcode Generator/BarcodeGenerator'

function ProtectedRoute() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true'
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'Admin'
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  const path = location.pathname

  if (userRole === 'Cashier') {
    const allowed = ['/', '/pos', '/customers', '/sales']
    if (!allowed.includes(path)) {
      return <Navigate to="/pos" replace />
    }
  } else if (userRole === 'Manager') {
    const forbidden = ['/categories', '/expenses', '/users', '/settings', '/hardware']
    if (forbidden.includes(path)) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}

function App() {
  const [syncing, setSyncing] = useState(true)

  useEffect(() => {
    async function initSync() {
      try {
        console.log('[Supabase Sync] Preloading database from Supabase...')
        await pullSupabaseData()
      } catch (err) {
        console.warn('[Supabase Sync] Preload failed, running in local fallback:', err)
      } finally {
        initSyncManager()
        setSyncing(false)
      }
    }
    initSync()
  }, [])

  if (syncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-500/5 blur-[90px] pointer-events-none" />

        <div className="flex items-center gap-6 relative z-10 bg-slate-900/40 border border-slate-800/60 p-8 rounded-3xl backdrop-blur-xl">
          {/* Logo container with outer rotating border */}
          <div className="relative flex items-center justify-center w-28 h-28 flex-shrink-0">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            {/* Logo image */}
            <img
              src={guptaTradersLogo}
              alt="Gupta Traders Logo"
              className="w-18 h-18 object-contain rounded-2xl p-1.5 bg-slate-900/60 border border-slate-800/80 shadow-2xl shadow-emerald-500/10"
            />
          </div>

          <div className="text-left space-y-1.5">
            <h2 className="text-3xl font-bold tracking-tight text-slate-50 leading-none font-gupta">
              Gupta Traders
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ERP Management System
            </p>
            <p className="text-xs text-emerald-500 tracking-widest uppercase font-bold animate-pulse pt-2">
              Loading Workspace...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ReportProvider>
      <ExpenseProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/pos" element={<POSBilling />} />

              {/* All other pages — with sidebar layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />

                {/* Purchase Routes */}
                <Route path="/purchase" element={<PurchaseEntry />} />
                <Route path="/purchase/history" element={<PurchaseHistory />} />
                <Route path="/purchase/return" element={<PurchaseReturn />} />

                {/* Sales Routes */}
                <Route path="/sales" element={<SalesEntry />} />
                <Route path="/sales/history" element={<SalesHistory />} />
                <Route path="/sales/return" element={<SalesReturn />} />
                <Route path="/sales/invoice-reprint" element={<InvoiceReprint />} />

                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/customers" element={<CustomersPage />} />

                {/* Expenses Routes */}
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/expenses/rent" element={<Rent />} />
                <Route path="/expenses/electricity" element={<Electricity />} />
                <Route path="/expenses/staff-salary" element={<StaffSalary />} />
                <Route path="/expenses/miscellaneous" element={<Miscellaneous />} />

                {/* Reports Routes */}
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/sales" element={<SalesReport />} />
                <Route path="/reports/purchase" element={<PurchaseReport />} />
                <Route path="/reports/stock" element={<StockReport />} />
                <Route path="/reports/profit" element={<ProfitReport />} />
                <Route path="/reports/expense" element={<ExpenseReport />} />
                <Route path="/reports/customer" element={<CustomerReport />} />
                <Route path="/reports/supplier" element={<SupplierReport />} />
                <Route path="/reports/low-stock" element={<LowStockReport />} />

                {/* User Management Routes */}
                <Route path="/users" element={<UserManagement />} />
                <Route path="/users/add" element={<AddUser />} />
                <Route path="/users/edit/:id" element={<EditUser />} />
                <Route path="/users/permissions" element={<RolePermissions />} />
                <Route path="/users/:id" element={<UserDetails />} />

                {/* Settings Routes */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/shop-information" element={<ShopInformation />} />
                <Route path="/settings/gst" element={<GSTSettings />} />
                <Route path="/settings/invoice" element={<InvoiceSettings />} />
                <Route path="/settings/printer" element={<PrinterSettings />} />
                <Route path="/settings/backup" element={<BackupRestore />} />

                {/* Hardware Routes */}
                <Route path="/hardware" element={<Hardware />} />
                <Route path="/hardware/barcode-scanner" element={<BarcodeScanner />} />
                <Route path="/hardware/thermal-printer" element={<ThermalPrinter />} />
                <Route path="/hardware/usb-printer" element={<USBPrinter />} />

                <Route path="/trash" element={<TrashPage />} />
                <Route path="/barcode-generator" element={<BarcodeGenerator />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </ExpenseProvider>
    </ReportProvider>
  )
}
export default App