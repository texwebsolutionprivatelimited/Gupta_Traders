import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'
import Home from './pages/Dashboard/Dashboard'
import POSBilling from './pages/Billing/POSBilling'
import ProductsPage from './pages/Products/ProductsPage'
import CategoriesPage from './pages/Categories/CategoriesPage'
import InventoryPage from './pages/Inventory'
import SuppliersPage from './pages/Suppliers'
import LoginPage from './pages/login'
import TrashPage from './pages/Trash'
import PackagedProductScanner from './pages/Products/PackagedProductScanner'
import MissingMrpAlertManager from './alert/MissingMrpAlertManager'

// Context Providers
import { ExpenseProvider } from './context/ExpenseContext'

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
import BackupRestore from './pages/Settings/BackupRestore'


import BarcodeGenerator from './pages/Barcode Generator/BarcodeGenerator'

function ProtectedRoute() {
  const { user, role, loading, error } = useAuth()
  const location = useLocation()
  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">Verifying secure session…</div>
  if (!user || error || !role) {
    return <Navigate to="/login" replace />
  }

  const path = location.pathname

  if (role === 'cashier') {
    const allowed = ['/', '/pos', '/sales', '/sales/history', '/sales/return', '/sales/invoice-reprint']
    if (!allowed.includes(path) && !path.startsWith('/sales')) {
      return <Navigate to="/pos" replace />
    }
  }

  return <Outlet />
}

function App() {
  // ─── Global Theme Manager & Cross-Route Synchronizer ──────────
  useEffect(() => {
    const applyTheme = () => {
      try {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentTheme = saved || (prefersDark ? 'dark' : 'light');
        if (currentTheme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      } catch (e) { }
    };

    applyTheme();
    window.addEventListener('storage', applyTheme);
    window.addEventListener('erp:theme_changed', applyTheme);
    return () => {
      window.removeEventListener('storage', applyTheme);
      window.removeEventListener('erp:theme_changed', applyTheme);
    };
  }, []);



  // ─── Universal Background Scroll Lock for Whole ERP ───────────
  useEffect(() => {
    const isModalVisible = (el) => {
      if (!el || (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0)) return false;
      if (el.classList.contains('-translate-x-full')) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };

    const updateScrollLock = () => {
      const overlayCandidates = document.querySelectorAll(
        '.fixed.inset-0:not(.pointer-events-none), [role="dialog"], [data-modal="true"]'
      );
      const hasActiveModal = Array.from(overlayCandidates).some(isModalVisible);

      if (hasActiveModal) {
        if (!document.body.classList.contains('modal-open')) {
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
          const mainContent = document.getElementById('main-content') || document.querySelector('main');
          if (mainContent) {
            mainContent.style.overflow = 'hidden';
          }
        }
      } else {
        if (document.body.classList.contains('modal-open')) {
          document.body.classList.remove('modal-open');
          document.documentElement.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          const mainContent = document.getElementById('main-content') || document.querySelector('main');
          if (mainContent) {
            mainContent.style.overflow = '';
          }
        }
      }
    };

    const observer = new MutationObserver(updateScrollLock);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open']
    });

    const handleWheelOnBackdrop = (e) => {
      const target = e.target;
      if (target && target.classList && target.classList.contains('fixed') && target.classList.contains('inset-0')) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheelOnBackdrop, { passive: false });
    updateScrollLock();

    return () => {
      observer.disconnect();
      window.removeEventListener('wheel', handleWheelOnBackdrop);
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <ExpenseProvider>
      <Router>
        <MissingMrpAlertManager />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pos" element={<POSBilling />} />

            {/* All other pages — with sidebar layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/packaged-scanner" element={<PackagedProductScanner />} />
              <Route path="/quick-product-entry" element={<PackagedProductScanner />} />
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


              {/* Expenses Routes */}
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/expenses/rent" element={<Rent />} />
              <Route path="/expenses/electricity" element={<Electricity />} />
              <Route path="/expenses/staff-salary" element={<StaffSalary />} />
              <Route path="/expenses/miscellaneous" element={<Miscellaneous />} />

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
              <Route path="/settings/backup" element={<BackupRestore />} />



              <Route path="/trash" element={<TrashPage />} />
              <Route path="/barcode-generator" element={<BarcodeGenerator />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ExpenseProvider>
  )
}
export default App
