import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Dashboard/Dashboard'
import PlaceholderPage from './pages/Dashboard/PlaceholderPage'
import POSBilling from './pages/Billing/POSBilling'
import ProductsPage from './pages/Products/ProductsPage'
import CategoriesPage from './pages/Categories/CategoriesPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/pos" element={<POSBilling />} />

        {/* All other pages — with sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/inventory" element={<PlaceholderPage title="Inventory" description="Track stock levels and manage inventory" icon="inventory" />} />
          <Route path="/purchase" element={<PlaceholderPage title="Purchase" description="Record and manage purchase orders" icon="purchase" />} />
          <Route path="/sales" element={<PlaceholderPage title="Sales" description="View and manage all sales transactions" icon="sales" />} />
          <Route path="/suppliers" element={<PlaceholderPage title="Suppliers" description="Manage supplier contacts and orders" icon="suppliers" />} />
          <Route path="/customers" element={<PlaceholderPage title="Customers" description="Customer database and transaction history" icon="customers" />} />
          <Route path="/expenses" element={<PlaceholderPage title="Expenses" description="Track and categorize business expenses" icon="expenses" />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" description="Business analytics and detailed reports" icon="reports" />} />
          <Route path="/users" element={<PlaceholderPage title="User Management" description="Manage users, roles, and permissions" icon="users" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" description="Application settings and configuration" icon="settings" />} />
          <Route path="/hardware" element={<PlaceholderPage title="Hardware" description="Manage connected hardware devices" icon="hardware" />} />
        </Route>
      </Routes>
    </Router>
  )
}
export default App