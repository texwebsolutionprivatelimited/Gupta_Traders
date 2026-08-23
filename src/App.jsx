import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Dashboard/Dashboard'
import PlaceholderPage from './pages/Dashboard/PlaceholderPage'
import POSBilling from './pages/Billing/POSBilling'
import ProductsPage from './pages/Products/ProductsPage'
import CategoriesPage from './pages/Categories/CategoriesPage'
import InventoryPage from './pages/Inventory'
import SuppliersPage from './pages/Suppliers'
import CustomersPage from './pages/Customers'
import LoginPage from './pages/login'
import TrashPage from './pages/Trash'

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
  return (
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
            <Route path="/purchase" element={<PlaceholderPage title="Purchase" description="Record and manage purchase orders" icon="purchase" />} />
            <Route path="/sales" element={<PlaceholderPage title="Sales History" description="Track sales records and transactions" />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/expenses" element={<PlaceholderPage title="Expenses" description="Track and categorize business expenses" icon="expenses" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" description="Business analytics and detailed reports" icon="reports" />} />
            <Route path="/users" element={<PlaceholderPage title="User Management" description="Manage users, roles, and permissions" icon="users" />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" description="Application settings and configuration" icon="settings" />} />
            <Route path="/hardware" element={<PlaceholderPage title="Hardware" description="Manage connected hardware devices" icon="hardware" />} />
            <Route path="/trash" element={<TrashPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}
export default App