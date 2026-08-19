
import { createContext, useContext, useState } from "react";

const ReportContext = createContext();

export function ReportProvider({ children }) {
  /* ==========================
     SALES RECORDS
  ========================== */
  const [salesRecords, setSalesRecords] = useState([
    {
      id: 1,
      invoiceNo: "INV-1001",
      customer: "Rahul Sharma",
      amount: 12500,
      items: 4,
      paymentMode: "UPI",
      date: "2026-08-17",
      status: "Paid",
    },
    {
      id: 2,
      invoiceNo: "INV-1002",
      customer: "Amit Traders",
      amount: 18500,
      items: 7,
      paymentMode: "Cash",
      date: "2026-08-16",
      status: "Paid",
    },
    {
      id: 3,
      invoiceNo: "INV-1003",
      customer: "Shree Construction",
      amount: 32000,
      items: 10,
      paymentMode: "Bank Transfer",
      date: "2026-08-15",
      status: "Paid",
    },
    {
      id: 4,
      invoiceNo: "INV-1004",
      customer: "Raj Enterprises",
      amount: 15000,
      items: 5,
      paymentMode: "UPI",
      date: "2026-08-14",
      status: "Paid",
    },
    {
      id: 5,
      invoiceNo: "INV-1005",
      customer: "Verma Hardware",
      amount: 22000,
      items: 8,
      paymentMode: "Cash",
      date: "2026-08-13",
      status: "Paid",
    },
  ]);

  /* ==========================
     PURCHASE RECORDS
  ========================== */
  const [purchaseRecords, setPurchaseRecords] = useState([
    {
      id: 1,
      invoiceNo: "PUR-1001",
      supplier: "ABC Cement Suppliers",
      amount: 28000,
      items: 12,
      date: "2026-08-17",
      status: "Received",
    },
    {
      id: 2,
      invoiceNo: "PUR-1002",
      supplier: "Shree Traders",
      amount: 19000,
      items: 7,
      date: "2026-08-16",
      status: "Received",
    },
    {
      id: 3,
      invoiceNo: "PUR-1003",
      supplier: "Raj Hardware",
      amount: 14000,
      items: 5,
      date: "2026-08-15",
      status: "Received",
    },
    {
      id: 4,
      invoiceNo: "PUR-1004",
      supplier: "Gupta Building Materials",
      amount: 35000,
      items: 15,
      date: "2026-08-14",
      status: "Received",
    },
    {
      id: 5,
      invoiceNo: "PUR-1005",
      supplier: "JK Suppliers",
      amount: 22000,
      items: 9,
      date: "2026-08-13",
      status: "Received",
    },
  ]);

  /* ==========================
     STOCK ITEMS
  ========================== */
  const [stockItems, setStockItems] = useState([
    {
      id: 1,
      product: "UltraTech Cement",
      sku: "UTC001",
      stock: 150,
      minStock: 20,
      price: 420,
      category: "Cement",
    },
    {
      id: 2,
      product: "ACC Cement",
      sku: "ACC002",
      stock: 80,
      minStock: 15,
      price: 410,
      category: "Cement",
    },
    {
      id: 3,
      product: "TMT Steel 12mm",
      sku: "TMT003",
      stock: 50,
      minStock: 10,
      price: 650,
      category: "Steel",
    },
    {
      id: 4,
      product: "Asian Paints",
      sku: "APT004",
      stock: 25,
      minStock: 10,
      price: 1450,
      category: "Paint",
    },
    {
      id: 5,
      product: "Berger Paint",
      sku: "BPG005",
      stock: 12,
      minStock: 15,
      price: 1350,
      category: "Paint",
    },
    {
      id: 6,
      product: "Floor Tiles",
      sku: "TIL006",
      stock: 45,
      minStock: 20,
      price: 550,
      category: "Tiles",
    },
    {
      id: 7,
      product: "Wall Tiles",
      sku: "TIL007",
      stock: 18,
      minStock: 20,
      price: 600,
      category: "Tiles",
    },
    {
      id: 8,
      product: "PVC Pipe",
      sku: "PVC008",
      stock: 60,
      minStock: 15,
      price: 250,
      category: "Plumbing",
    },
  ]);

  /* ==========================
     CUSTOMERS
  ========================== */
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "Rahul Sharma",
      mobile: "9876543210",
      city: "Lucknow",
      totalPurchase: 12500,
    },
    {
      id: 2,
      name: "Amit Traders",
      mobile: "9123456780",
      city: "Kanpur",
      totalPurchase: 18500,
    },
    {
      id: 3,
      name: "Shree Construction",
      mobile: "9012345678",
      city: "Ayodhya",
      totalPurchase: 32000,
    },
    {
      id: 4,
      name: "Raj Enterprises",
      mobile: "9988776655",
      city: "Prayagraj",
      totalPurchase: 15000,
    },
    {
      id: 5,
      name: "Verma Hardware",
      mobile: "8899776655",
      city: "Varanasi",
      totalPurchase: 22000,
    },
  ]);

  /* ==========================
     SUPPLIERS
  ========================== */
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: "ABC Cement Suppliers",
      mobile: "9877001122",
      city: "Lucknow",
      totalPurchase: 28000,
    },
    {
      id: 2,
      name: "Shree Traders",
      mobile: "9877001133",
      city: "Kanpur",
      totalPurchase: 19000,
    },
    {
      id: 3,
      name: "Raj Hardware",
      mobile: "9877001144",
      city: "Ayodhya",
      totalPurchase: 14000,
    },
    {
      id: 4,
      name: "Gupta Building Materials",
      mobile: "9877001155",
      city: "Prayagraj",
      totalPurchase: 35000,
    },
    {
      id: 5,
      name: "JK Suppliers",
      mobile: "9877001166",
      city: "Varanasi",
      totalPurchase: 22000,
    },
  ]);

  return (
    <ReportContext.Provider
      value={{
        salesRecords,
        setSalesRecords,

        purchaseRecords,
        setPurchaseRecords,

        stockItems,
        setStockItems,

        customers,
        setCustomers,

        suppliers,
        setSuppliers,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export const useReport = () =>
  useContext(ReportContext);


