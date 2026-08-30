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
import CustomersPage from './pages/Customers'
import LoginPage from './pages/login'
import TrashPage from './pages/Trash'

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
  const { user, role, loading, error } = useAuth()
  const location = useLocation()
  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-200 grid place-items-center">Verifying secure session…</div>
  if (!user || error || !role) {
    return <Navigate to="/login" replace />
  }

  const path = location.pathname

  if (role === 'cashier') {
    const allowed = ['/', '/pos', '/customers', '/sales']
    if (!allowed.includes(path)) {
      return <Navigate to="/pos" replace />
    }
  } else if (role === 'manager') {
    const forbidden = ['/categories', '/expenses', '/users', '/settings', '/hardware']
    if (forbidden.includes(path)) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}

function App() {
  // Global Hardware Connectivity manager
  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const handleConnect = (event) => {
      const dev = event.device;
      const devName = dev.productName || dev.manufacturerName || "";
      const lowerName = devName.toLowerCase();

      // Check if it's a USB Printer
      const isUsbPrinter = (dev.vendorId === 0x03f0 && dev.productId === 0x0117) || 
                          lowerName.includes("usb printer") || 
                          lowerName.includes("laserjet") ||
                          lowerName.includes("inkjet");
      
      // Check if it's a Thermal Printer
      const isThermal = (dev.vendorId === 0x0fe6 && dev.productId === 0x811e) || 
                        (dev.vendorId === 0x04b8 && dev.productId === 0x0202) || 
                        lowerName.includes("thermal") || 
                        lowerName.includes("receipt printer") ||
                        lowerName.includes("epson") || 
                        lowerName.includes("pos-58") || 
                        lowerName.includes("pos-80");

      // Check if it's a Barcode Scanner
      const isScanner = (dev.vendorId === 0x05f9 && dev.productId === 0x2201) || 
                        lowerName.includes("scanner") || 
                        lowerName.includes("barcode") || 
                        lowerName.includes("hid scanner");

      if (isUsbPrinter) {
        try {
          const saved = localStorage.getItem("usbPrinterSettings");
          const settings = saved ? JSON.parse(saved) : {};
          const updated = {
            ...settings,
            printerName: dev.productName || settings.printerName || "USB Printer",
            connected: true,
          };
          localStorage.setItem("usbPrinterSettings", JSON.stringify(updated));
          window.dispatchEvent(new Event("storage"));
          console.log("[Global Hardware] USB Printer Connected:", dev.productName);
        } catch (e) {
          console.error("Error setting usb printer connection status:", e);
        }
      }

      if (isThermal) {
        try {
          const saved = localStorage.getItem("thermalPrinterSettings");
          const settings = saved ? JSON.parse(saved) : {};
          const updated = {
            ...settings,
            printerName: dev.productName || settings.printerName || "Thermal Receipt Printer",
            connected: true,
          };
          localStorage.setItem("thermalPrinterSettings", JSON.stringify(updated));
          window.dispatchEvent(new Event("storage"));
          console.log("[Global Hardware] Thermal Printer Connected:", dev.productName);
        } catch (e) {
          console.error("Error setting thermal printer connection status:", e);
        }
      }

      if (isScanner) {
        try {
          const saved = localStorage.getItem("barcodeScannerSettings");
          const settings = saved ? JSON.parse(saved) : {};
          const updated = {
            ...settings,
            scannerName: dev.productName || settings.scannerName || "USB Barcode Scanner",
            connected: true,
            erpConnected: true
          };
          localStorage.setItem("barcodeScannerSettings", JSON.stringify(updated));
          window.dispatchEvent(new Event("storage"));
          console.log("[Global Hardware] Barcode Scanner Connected:", dev.productName);
        } catch (e) {
          console.error("Error setting barcode scanner connection status:", e);
        }
      }
    };

    const handleDisconnect = (event) => {
      const dev = event.device;
      const devName = dev.productName || dev.manufacturerName || "";
      const lowerName = devName.toLowerCase();

      // Check if it's a USB Printer
      const isUsbPrinter = (dev.vendorId === 0x03f0 && dev.productId === 0x0117) || 
                          lowerName.includes("usb printer") || 
                          lowerName.includes("laserjet") ||
                          lowerName.includes("inkjet");
      
      // Check if it's a Thermal Printer
      const isThermal = (dev.vendorId === 0x0fe6 && dev.productId === 0x811e) || 
                        (dev.vendorId === 0x04b8 && dev.productId === 0x0202) || 
                        lowerName.includes("thermal") || 
                        lowerName.includes("receipt printer") ||
                        lowerName.includes("epson") || 
                        lowerName.includes("pos-58") || 
                        lowerName.includes("pos-80");

      // Check if it's a Barcode Scanner
      const isScanner = (dev.vendorId === 0x05f9 && dev.productId === 0x2201) || 
                        lowerName.includes("scanner") || 
                        lowerName.includes("barcode") || 
                        lowerName.includes("hid scanner");

      if (isUsbPrinter) {
        try {
          const saved = localStorage.getItem("usbPrinterSettings");
          const settings = saved ? JSON.parse(saved) : {};
          const updated = { ...settings, connected: false };
          localStorage.setItem("usbPrinterSettings", JSON.stringify(updated));
          window.dispatchEvent(new Event("storage"));
          console.log("[Global Hardware] USB Printer Disconnected:", dev.productName);
        } catch (e) {
          console.error("Error disconnecting usb printer status:", e);
        }
      }

      if (isThermal) {
        try {
          const saved = localStorage.getItem("thermalPrinterSettings");
          const settings = saved ? JSON.parse(saved) : {};
          const updated = { ...settings, connected: false };
          localStorage.setItem("thermalPrinterSettings", JSON.stringify(updated));
          window.dispatchEvent(new Event("storage"));
          console.log("[Global Hardware] Thermal Printer Disconnected:", dev.productName);
        } catch (e) {
          console.error("Error disconnecting thermal printer status:", e);
        }
      }

      if (isScanner) {
        try {
          const saved = localStorage.getItem("barcodeScannerSettings");
          const settings = saved ? JSON.parse(saved) : {};
          const updated = { ...settings, connected: false, erpConnected: false };
          localStorage.setItem("barcodeScannerSettings", JSON.stringify(updated));
          window.dispatchEvent(new Event("storage"));
          console.log("[Global Hardware] Barcode Scanner Disconnected:", dev.productName);
        } catch (e) {
          console.error("Error disconnecting barcode scanner status:", e);
        }
      }
    };

    if (navigator.usb) {
      navigator.usb.addEventListener("connect", handleConnect);
      navigator.usb.addEventListener("disconnect", handleDisconnect);
    }
    if (navigator.hid) {
      navigator.hid.addEventListener("connect", handleConnect);
      navigator.hid.addEventListener("disconnect", handleDisconnect);
    }

    return () => {
      if (navigator.usb) {
        navigator.usb.removeEventListener("connect", handleConnect);
        navigator.usb.removeEventListener("disconnect", handleDisconnect);
      }
      if (navigator.hid) {
        navigator.hid.removeEventListener("connect", handleConnect);
        navigator.hid.removeEventListener("disconnect", handleDisconnect);
      }
    };
  }, []);

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
