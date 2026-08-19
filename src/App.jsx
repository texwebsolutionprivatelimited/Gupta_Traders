import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layout
import Layout from "./components/Layout";
// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";
// Common
import PlaceholderPage from "./pages/Dashboard/PlaceholderPage";
// Billing
import POSBilling from "./pages/Billing/POSBilling";

// Products
import ProductList from "./pages/Products/ProductList";
import AddProduct from "./pages/Products/AddProduct";
import EditProduct from "./pages/Products/EditProduct";
import ProductDetails from "./pages/Products/ProductDetails";

// Categories
import Categories from "./pages/Categories/Categories";

// Inventory
import Inventory from "./pages/Inventory/Inventory";

// Purchase
import PurchaseEntry from "./pages/Purchase/PurchaseEntry";
import PurchaseReturn from "./pages/Purchase/PurchaseReturn";
import PurchaseHistory from "./pages/Purchase/PurchaseHistory";

// Sales
import SalesEntry from "./pages/Sales/SalesEntry";
import SalesHistory from "./pages/Sales/SalesHistory";
import SalesReturn from "./pages/Sales/SalesReturn";
import InvoiceReprint from "./pages/Sales/InvoiceReprint";

// Expenses
import Expenses from "./pages/Expenses/Expenses";
import Rent from "./pages/Expenses/Rent";
import Electricity from "./pages/Expenses/Electricity";
import StaffSalary from "./pages/Expenses/StaffSalary";
import Miscellaneous from "./pages/Expenses/Miscellaneous";

// Reports
import Reports from "./pages/Reports/Reports";
import SalesReport from "./pages/Reports/SalesReport";
import PurchaseReport from "./pages/Reports/PurchaseReport";
import StockReport from "./pages/Reports/StockReport";
import ProfitReport from "./pages/Reports/ProfitReport";
import ExpenseReport from "./pages/Reports/ExpenseReport";
import LowStockReport from "./pages/Reports/LowStockReport";
import CustomerReport from "./pages/Reports/CustomerReport";
import SupplierReport from "./pages/Reports/SupplierReport";

// Suppliers
import SupplierManagement from "./pages/Suppliers/SupplierManagement";
import SupplierPurchaseHistory from "./pages/Suppliers/SupplierPurchaseHistory";
import PendingSupplierPayment from "./pages/Suppliers/PendingSupplierPayment";
import SupplierList from "./pages/Suppliers/SupplierList";
import AddSupplier from "./pages/Suppliers/AddSupplier";

// Customers
import CustomerManagement from "./pages/Customers/CustomerManagement";
import CustomerList from "./pages/Customers/CustomerList";
import CustomerPurchaseHistory from "./pages/Customers/CustomerPurchaseHistory";
import CustomerKhata from "./pages/Customers/CustomerKhata";
import DuePayment from "./pages/Customers/DuePayment";

function App() {
  return (
    <Router>
      <Routes>

        {/* =====================================================
            POS BILLING
            POS is outside Layout intentionally
        ===================================================== */}
        <Route path="/pos" element={<POSBilling />} />

        {/* =====================================================
            MAIN APPLICATION LAYOUT
        ===================================================== */}
        <Route element={<Layout />}>

          {/* ===================================================
              DASHBOARD
          =================================================== */}
          <Route path="/" element={<Dashboard />} />

          {/* ===================================================
              PRODUCTS
          =================================================== */}
          <Route path="/products" element={<ProductList />} />

          <Route
            path="/products/add"
            element={<AddProduct />}
          />

          <Route
            path="/products/edit/:id"
            element={<EditProduct />}
          />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          {/* ===================================================
              CATEGORIES
          =================================================== */}
          <Route
            path="/categories"
            element={<Categories />}
          />

          {/* ===================================================
              INVENTORY
          =================================================== */}
          <Route
            path="/inventory"
            element={<Inventory />}
          />

          {/* ===================================================
              PURCHASE
          =================================================== */}
          <Route
            path="/purchase"
            element={<PurchaseEntry />}
          />

          <Route
            path="/purchase/history"
            element={<PurchaseHistory />}
          />

          <Route
            path="/purchase/return"
            element={<PurchaseReturn />}
          />

          {/* ===================================================
              SALES
          =================================================== */}
          <Route
            path="/sales"
            element={<SalesEntry />}
          />

          <Route
            path="/sales/history"
            element={<SalesHistory />}
          />

          <Route
            path="/sales/return"
            element={<SalesReturn />}
          />

          <Route
            path="/sales/invoice-reprint"
            element={<InvoiceReprint />}
          />

          {/* ===================================================
              SUPPLIERS
          =================================================== */}
          <Route
            path="/suppliers"
            element={<SupplierManagement />}
          />

          <Route
            path="/suppliers/add"
            element={<AddSupplier />}
          />

          <Route
            path="/suppliers/list"
            element={<SupplierList />}
          />

          <Route
            path="/suppliers/purchase-history"
            element={<SupplierPurchaseHistory />}
          />

          <Route
            path="/suppliers/pending-payment"
            element={<PendingSupplierPayment />}
          />

          {/* ===================================================
              CUSTOMERS
          =================================================== */}
          <Route
            path="/customers"
            element={<CustomerManagement />}
          />

          <Route
            path="/customers/list"
            element={<CustomerList />}
          />

          <Route
            path="/customers/purchase-history"
            element={<CustomerPurchaseHistory />}
          />

          <Route
            path="/customers/khata"
            element={<CustomerKhata />}
          />

          <Route
            path="/customers/due-payment"
            element={<DuePayment />}
          />

          {/* ===================================================
              EXPENSES
          =================================================== */}
          <Route
            path="/expenses"
            element={<Expenses />}
          />

          <Route
            path="/expenses/rent"
            element={<Rent />}
          />

          <Route
            path="/expenses/electricity"
            element={<Electricity />}
          />

          <Route
            path="/expenses/staff-salary"
            element={<StaffSalary />}
          />

          <Route
            path="/expenses/miscellaneous"
            element={<Miscellaneous />}
          />

          {/* ===================================================
              REPORTS
          =================================================== */}
          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/reports/sales"
            element={<SalesReport />}
          />

          <Route
            path="/reports/purchase"
            element={<PurchaseReport />}
          />

          <Route
            path="/reports/stock"
            element={<StockReport />}
          />

          <Route
            path="/reports/profit"
            element={<ProfitReport />}
          />

          <Route
            path="/reports/expense"
            element={<ExpenseReport />}
          />

          <Route
            path="/reports/low-stock"
            element={<LowStockReport />}
          />

          <Route
            path="/reports/customer"
            element={<CustomerReport />}
          />

          <Route
            path="/reports/supplier"
            element={<SupplierReport />}
          />

          {/* ===================================================
              USERS
          =================================================== */}
          <Route
            path="/users"
            element={
              <PlaceholderPage
                title="User Management"
                description="Manage users, roles, and permissions"
                icon="users"
              />
            }
          />

          {/* ===================================================
              SETTINGS
          =================================================== */}
          <Route
            path="/settings"
            element={
              <PlaceholderPage
                title="Settings"
                description="Application settings and configuration"
                icon="settings"
              />
            }
          />

          {/* ===================================================
              HARDWARE
          =================================================== */}
          <Route
            path="/hardware"
            element={
              <PlaceholderPage
                title="Hardware"
                description="Manage connected hardware devices"
                icon="hardware"
              />
            }
          />

          {/* ===================================================
              404
              Keep this LAST
          =================================================== */}
          <Route
            path="*"
            element={
              <PlaceholderPage
                title="Page Not Found"
                description="The page you are looking for does not exist."
                icon="settings"
              />
            }
          />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;