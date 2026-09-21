import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  completeSalesReturn,
  listSalesReturns,
  listUISales,
  subscribeToTable,
} from "../../services/erpService";
import { formatINR } from "../../utils/erp";
import {
  printThermalReturnReceipt,
  printThermalReceipt,
  ReceiptPreview,
} from "../Billing/BillReceipt";
import {
  FaUndo as UndoIcon,
  FaReceipt as ReceiptIcon,
  FaPrint as PrintIcon,
  FaSearch as SearchIcon,
  FaCheckCircle as CheckCircleIcon,
  FaExclamationTriangle as WarningIcon,
  FaHistory as HistoryIcon,
  FaMoneyBillWave as MoneyIcon,
  FaTimes as CloseIcon,
  FaBoxOpen as BoxIcon,
  FaEye as EyeIcon,
} from "react-icons/fa";

const RETURN_REASONS = [
  "Defective / Faulty Product",
  "Incorrect Product / Spec Mismatch",
  "Customer Changed Mind / Not Needed",
  "Damage in Transit / Packing Issue",
  "Wrong Size / Dimensions",
  "Over-purchased / Leftover",
  "Other",
];

const REFUND_METHODS = ["Cash", "UPI", "Original Payment Method", "Store Credit"];

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SalesReturn() {
  const [searchParams] = useSearchParams();
  const initialInvoiceParam = searchParams.get("invoice") || "";

  // Tabs
  const [activeTab, setActiveTab] = useState("new_return"); // "new_return" | "history"
  const [salesList, setSalesList] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Sale & Lookup
  const [invoiceSearch, setInvoiceSearch] = useState(initialInvoiceParam);
  const [selectedSale, setSelectedSale] = useState(null);

  // Return Form State
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("Defective / Faulty Product");
  const [customReason, setCustomReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState({}); // { [saleItemId]: { selected: boolean, quantity: number } }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal & Receipt States
  const [completedReturnData, setCompletedReturnData] = useState(null);
  const [previewBillData, setPreviewBillData] = useState(null);
  const [selectedHistoryReturn, setSelectedHistoryReturn] = useState(null);

  // History search/filter
  const [historySearch, setHistorySearch] = useState("");

  // Handle invoice selection
  const handleSelectSale = useCallback((sale) => {
    setSelectedSale(sale);
    setInvoiceSearch(sale.invoice || sale.invoice_number || "");

    // Initialize item selection map
    const initialMap = {};
    (sale.items || []).forEach((item) => {
      const available = Number(item.returnableQuantity ?? item.quantity ?? 1);
      initialMap[item.id] = {
        selected: available > 0,
        quantity: available > 0 ? 1 : 0,
        max: available,
      };
    });
    setSelectedItems(initialMap);
  }, []);

  // Load Sales and Return History
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sales, returns] = await Promise.all([
        listUISales(),
        listSalesReturns().catch(() => []),
      ]);
      setSalesList(sales || []);
      setReturnHistory(returns || []);

      // If initial invoice query param exists, auto-select it
      if (initialInvoiceParam) {
        const found = (sales || []).find(
          (s) =>
            s.invoice === initialInvoiceParam ||
            s.invoice_number === initialInvoiceParam ||
            s.id === initialInvoiceParam
        );
        if (found) {
          handleSelectSale(found);
        }
      }
    } catch (err) {
      console.error("Error loading sales/return data:", err);
    } finally {
      setLoading(false);
    }
  }, [initialInvoiceParam, handleSelectSale]);

  useEffect(() => {
    loadData();
    const unsubSales = subscribeToTable("sales", loadData);
    const unsubReturns = subscribeToTable("sales_returns", loadData);
    return () => {
      unsubSales();
      unsubReturns();
    };
  }, [loadData]);

  // 7-day rule check on selected sale
  const policyCheck = useMemo(() => {
    if (!selectedSale) return null;
    const saleDate = new Date(selectedSale.date || selectedSale.createdAt);
    const selReturnDate = new Date(`${returnDate}T23:59:59`);
    const today = new Date();

    // Days difference between sale and return date
    const diffTime = selReturnDate.getTime() - saleDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const isWithin7Days = diffDays >= 0 && diffDays <= 7;
    const daysRemaining = Math.max(0, 7 - Math.floor((today - saleDate) / (1000 * 60 * 60 * 24)));

    return {
      diffDays,
      isWithin7Days,
      daysRemaining,
      saleDateFormatted: formatDate(saleDate),
    };
  }, [selectedSale, returnDate]);

  // Update item selection toggle
  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      const current = prev[itemId] || { selected: false, quantity: 1, max: 1 };
      return {
        ...prev,
        [itemId]: {
          ...current,
          selected: !current.selected,
          quantity: !current.selected && current.quantity <= 0 ? 1 : current.quantity,
        },
      };
    });
  };

  // Update item return quantity
  const updateItemQty = (itemId, val, max) => {
    const num = Math.max(1, Math.min(max, parseInt(val, 10) || 1));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        quantity: num,
      },
    }));
  };

  // Calculate live return refund totals
  const refundTotals = useMemo(() => {
    if (!selectedSale || !selectedSale.items) {
      return { subtotal: 0, gst: 0, total: 0, itemsCount: 0, totalQty: 0 };
    }

    let subtotal = 0;
    let gst = 0;
    let total = 0;
    let itemsCount = 0;
    let totalQty = 0;

    selectedSale.items.forEach((item) => {
      const state = selectedItems[item.id];
      if (state?.selected && state.quantity > 0) {
        const qty = state.quantity;
        const price = Number(item.price || item.salesPrice || 0);
        const gstRate = Number(item.gst || item.tax_rate || 0);
        const itemDiscount = Number(item.itemDiscount || 0);

        const lineNet = price * qty * (1 - itemDiscount / 100);
        const lineTax = (lineNet * gstRate) / 100;
        const lineTotal = lineNet + lineTax;

        subtotal += lineNet;
        gst += lineTax;
        total += lineTotal;
        itemsCount += 1;
        totalQty += qty;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemsCount,
      totalQty,
    };
  }, [selectedSale, selectedItems]);

  // Form Submit Handler
  const handleSubmitReturn = async (e) => {
    e.preventDefault();

    if (!selectedSale) {
      alert("Please select a sales invoice to return products from.");
      return;
    }

    if (!policyCheck?.isWithin7Days) {
      alert(
        `This bill is past the 7-day return limit (Purchased on ${policyCheck?.saleDateFormatted}). Products can only be returned within 7 days of purchase.`
      );
      return;
    }

    if (refundTotals.itemsCount === 0 || refundTotals.totalQty <= 0) {
      alert("Please select at least one product with a quantity to return.");
      return;
    }

    const effectiveReason =
      reason === "Other" && customReason.trim()
        ? `Other: ${customReason.trim()}`
        : reason;

    // Prepare return items payload
    const returnItemsPayload = [];
    selectedSale.items.forEach((item) => {
      const state = selectedItems[item.id];
      if (state?.selected && state.quantity > 0) {
        const price = Number(item.price || item.salesPrice || 0);
        const gstRate = Number(item.gst || item.tax_rate || 0);
        const itemDiscount = Number(item.itemDiscount || 0);
        const lineNet = price * state.quantity * (1 - itemDiscount / 100);
        const lineTotal = lineNet + (lineNet * gstRate) / 100;

        returnItemsPayload.push({
          sale_item_id: item.id,
          quantity: state.quantity,
          line_total: Math.round(lineTotal * 100) / 100,
        });
      }
    });

    try {
      setIsSubmitting(true);
      const result = await completeSalesReturn(
        {
          sale_id: selectedSale.id,
          return_date: returnDate,
          reason: effectiveReason,
          refund_method: refundMethod,
          notes: notes.trim() || null,
        },
        returnItemsPayload
      );

      // Construct completed return bundle for immediate voucher printing
      const completedBundle = {
        id: result?.id,
        return_number: result?.return_number,
        return_date: returnDate,
        total_amount: result?.total_amount || refundTotals.total,
        refund_method: refundMethod,
        reason: effectiveReason,
        sale: {
          invoice_number: selectedSale.invoice,
        },
        customer: selectedSale.customerObj || { name: selectedSale.customer },
        items: returnItemsPayload.map((rp) => {
          const originalItem = selectedSale.items.find((x) => x.id === rp.sale_item_id);
          return {
            product_name: originalItem?.name || originalItem?.product,
            unit: originalItem?.unit,
            quantity: rp.quantity,
            line_total: rp.line_total,
          };
        }),
      };

      setCompletedReturnData(completedBundle);

      // Refresh sales and return list
      await loadData();
    } catch (err) {
      alert(`Sales return failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form for another return
  const handleResetForm = () => {
    setSelectedSale(null);
    setInvoiceSearch("");
    setNotes("");
    setCustomReason("");
    setCompletedReturnData(null);
    setSelectedItems({});
  };

  // Filtered sales for autocomplete/picker
  const matchingSales = useMemo(() => {
    if (!invoiceSearch.trim()) {
      // Show sales within 7 days by default
      return salesList.filter((s) => s.isWithinReturnWindow && !s.isFullyReturned).slice(0, 10);
    }
    const q = invoiceSearch.toLowerCase().trim();
    return salesList.filter(
      (s) =>
        String(s.invoice || "").toLowerCase().includes(q) ||
        String(s.customer || "").toLowerCase().includes(q) ||
        String(s.id || "").toLowerCase().includes(q)
    );
  }, [salesList, invoiceSearch]);

  // Filtered return history
  const filteredReturnHistory = useMemo(() => {
    if (!historySearch.trim()) return returnHistory;
    const q = historySearch.toLowerCase().trim();
    return returnHistory.filter(
      (r) =>
        String(r.return_number || "").toLowerCase().includes(q) ||
        String(r.sale?.invoice_number || "").toLowerCase().includes(q) ||
        String(r.customer?.name || "").toLowerCase().includes(q) ||
        String(r.reason || "").toLowerCase().includes(q)
    );
  }, [returnHistory, historySearch]);

  const totalHistoryRefunded = returnHistory.reduce(
    (sum, r) => sum + Number(r.total_amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* HEADER & TABS */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/sales"
              className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
            >
              ← Back to Sales
            </Link>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl flex items-center gap-3">
              <UndoIcon className="w-7 h-7 text-rose-500" />
              Product Return & Refund
              {loading && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 animate-pulse">
                  Syncing...
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Return sold products back to inventory within the 7-day policy window and issue refunds.
            </p>
          </div>

          {/* TAB TOGGLE */}
          <div className="flex bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("new_return")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === "new_return"
                  ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
            >
              <UndoIcon className="w-3.5 h-3.5" />
              New Return & Refund
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === "history"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              Return History ({returnHistory.length})
            </button>
          </div>
        </div>

        {/* ─── TAB 1: NEW RETURN & REFUND ────────────────────────────── */}
        {activeTab === "new_return" && (
          <form onSubmit={handleSubmitReturn} className="space-y-6">
            {/* STEP 1: FIND ORIGINAL BILL */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <SearchIcon className="w-4 h-4 text-emerald-500" />
                    1. Find Original Sales Bill / Receipt
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Search or select an original completed sale to retrieve its product lines.
                  </p>
                </div>
                {selectedSale && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Change Bill
                  </button>
                )}
              </div>

              {/* Bill Search & Picker */}
              {!selectedSale ? (
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <SearchIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      placeholder="Search bill by invoice # (e.g. INV-2026...), customer name..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  {/* Matching Sales Suggestions */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {invoiceSearch.trim()
                        ? `Matching Invoices (${matchingSales.length})`
                        : "Recent Sales Eligible for 7-Day Return:"}
                    </p>
                    {matchingSales.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
                        No matching sales found. Please verify the invoice number or check Sales History.
                      </div>
                    ) : (
                      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-72 overflow-y-auto pr-1">
                        {matchingSales.map((sale) => (
                          <div
                            key={sale.id}
                            onClick={() => handleSelectSale(sale)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${sale.isWithinReturnWindow
                                ? "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-emerald-500/50"
                                : "border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 opacity-75"
                              }`}
                          >
                            <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                              <span>{sale.invoice}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold">
                                {formatINR(sale.total)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{sale.customer}</span>
                              <span>{formatDate(sale.date)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px]">
                              <span
                                className={`font-semibold px-2 py-0.5 rounded-full ${sale.isWithinReturnWindow
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  }`}
                              >
                                {sale.isWithinReturnWindow
                                  ? `${sale.daysRemaining} days left to return`
                                  : "Past 7-day policy"}
                              </span>
                              <span className="text-slate-400">{sale.items?.length || 0} items</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Bill Overview Card */
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Invoice Number</p>
                      <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                        {selectedSale.invoice}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Customer</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {selectedSale.customer}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Sale Date</p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {policyCheck?.saleDateFormatted}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Original Total</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatINR(selectedSale.total)}
                      </p>
                    </div>
                  </div>

                  {/* 7-DAY RETURN POLICY ELIGIBILITY BANNER */}
                  {policyCheck && (
                    <div
                      className={`p-4 rounded-xl flex items-start gap-3 border ${policyCheck.isWithin7Days
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200"
                          : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200"
                        }`}
                    >
                      {policyCheck.isWithin7Days ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <WarningIcon className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-bold">
                          {policyCheck.isWithin7Days
                            ? `Eligible for Return & Refund (${policyCheck.daysRemaining} day(s) remaining in 7-day window)`
                            : `Return Policy Expired — Purchased on ${policyCheck.saleDateFormatted} (${policyCheck.diffDays} days ago)`}
                        </p>
                        <p className="text-xs opacity-90 mt-0.5">
                          {policyCheck.isWithin7Days
                            ? `Products sold by Gupta Traders can be returned within 7 days of purchase. Select the returned products below.`
                            : `Gupta Traders policy strictly allows product returns within 7 days of purchase. Returns cannot be processed for sales older than 7 days.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* STEP 2: SELECT PRODUCTS & QUANTITIES TO RETURN */}
            {selectedSale && (
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BoxIcon className="w-4 h-4 text-rose-500" />
                      2. Select Products & Quantity Being Returned
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Check each item to return and adjust the quantity. Cannot exceed originally sold quantity.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    Selected for return:{" "}
                    <span className="text-rose-600 dark:text-rose-400">
                      {refundTotals.itemsCount} product(s) | {refundTotals.totalQty} qty
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-12">Return?</th>
                        <th className="px-4 py-3.5">Product Name</th>
                        <th className="px-4 py-3.5 text-center">Sold Qty</th>
                        <th className="px-4 py-3.5 text-center">Already Returned</th>
                        <th className="px-4 py-3.5 text-center">Available to Return</th>
                        <th className="px-4 py-3.5 text-right">Unit Price</th>
                        <th className="px-4 py-3.5 text-center w-32">Return Qty</th>
                        <th className="px-4 py-3.5 text-right">Refund Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {(selectedSale.items || []).map((item) => {
                        const itemState = selectedItems[item.id] || {
                          selected: false,
                          quantity: 0,
                          max: item.returnableQuantity ?? item.quantity ?? 1,
                        };
                        const available = item.returnableQuantity ?? item.quantity ?? 1;
                        const isFullyTakenBack = available <= 0;
                        const price = Number(item.price || item.salesPrice || 0);
                        const gstRate = Number(item.gst || 0);
                        const discount = Number(item.itemDiscount || 0);

                        const currentQty = itemState.quantity || 0;
                        const lineRefund =
                          itemState.selected && currentQty > 0
                            ? currentQty * price * (1 - discount / 100) * (1 + gstRate / 100)
                            : 0;

                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${itemState.selected
                                ? "bg-rose-500/5 dark:bg-rose-500/10 font-medium"
                                : isFullyTakenBack
                                  ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/30"
                                  : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                              }`}
                          >
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={itemState.selected}
                                disabled={isFullyTakenBack || !policyCheck?.isWithin7Days}
                                onChange={() => toggleItemSelection(item.id)}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {item.name || item.product}
                              </div>
                              <div className="text-xs text-slate-500">
                                Unit: {item.unit || "Pcs"} • GST: {gstRate}%
                                {discount > 0 && ` • Disc: -${discount}%`}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold">
                              {item.originalQuantity ?? item.quantity} {item.unit}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {item.returnedQuantity > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  {item.returnedQuantity} {item.unit}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold">
                              {isFullyTakenBack ? (
                                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2 py-1 rounded">
                                  Taken Back
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {available} {item.unit}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium">
                              {formatINR(price)}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="number"
                                min="1"
                                max={available}
                                disabled={!itemState.selected || isFullyTakenBack || !policyCheck?.isWithin7Days}
                                value={itemState.selected ? currentQty : ""}
                                onChange={(e) => updateItemQty(item.id, e.target.value, available)}
                                placeholder="0"
                                className="w-20 px-2.5 py-1.5 text-center font-bold text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-4 py-3.5 text-right font-black text-rose-600 dark:text-rose-400">
                              {formatINR(lineRefund)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* STEP 3: RETURN & REFUND DETAILS + SUMMARY */}
            {selectedSale && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Details Section (2 cols) */}
                <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <MoneyIcon className="w-4 h-4 text-emerald-500" />
                    3. Return & Refund Information
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Return Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={returnDate}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Refund Payment Method <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-rose-500"
                        required
                      >
                        {REFUND_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m} (रिफंड मोड)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Reason for Return (वापसी का कारण)
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-rose-500"
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {reason === "Other" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Specify Other Reason
                        </label>
                        <input
                          type="text"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="e.g. Broken packaging on opening"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Return Notes / Remarks (Optional)
                    </label>
                    <textarea
                      rows="3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any internal notes regarding this return, condition of goods, or verification details..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                </section>

                {/* Return Summary Card (1 col) */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      Refund Summary
                    </h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Original Bill Total</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatINR(selectedSale.total)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Items Selected</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {refundTotals.itemsCount} lines ({refundTotals.totalQty} units)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Taxable Subtotal Refund</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatINR(refundTotals.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>GST Refund</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatINR(refundTotals.gst)}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                            Total Refund Amount
                          </span>
                          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                            {formatINR(refundTotals.total)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Payment via: <span className="font-bold text-slate-700 dark:text-slate-300">{refundMethod}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 space-y-3">
                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !policyCheck?.isWithin7Days ||
                        refundTotals.itemsCount === 0 ||
                        refundTotals.totalQty <= 0
                      }
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm transition-all shadow-lg shadow-rose-500/25 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Processing Return...</span>
                      ) : (
                        <>
                          <UndoIcon className="w-4 h-4" />
                          Complete Return & Refund (वापसी दर्ज करें)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel / Select Another Bill
                    </button>
                  </div>
                </section>
              </div>
            )}
          </form>
        )}

        {/* ─── TAB 2: RETURN HISTORY ─────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* History Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Return Vouchers</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
                  {returnHistory.length}
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20 shadow-sm">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Refunded Value</p>
                <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatINR(totalHistoryRefunded)}
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-sm">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Restocked Items Count</p>
                <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {returnHistory.reduce(
                    (sum, r) => sum + (r.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0),
                    0
                  )}{" "}
                  units
                </p>
              </div>
            </div>

            {/* Filter Search */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <SearchIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search returns by voucher #, original invoice, customer name, reason..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-4">Return #</th>
                      <th className="px-5 py-4">Date & Time</th>
                      <th className="px-5 py-4">Original Invoice</th>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4 text-center">Items Returned</th>
                      <th className="px-5 py-4">Refund Mode</th>
                      <th className="px-5 py-4 text-right">Refund Amount</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredReturnHistory.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                          No return records found.
                        </td>
                      </tr>
                    ) : (
                      filteredReturnHistory.map((ret) => {
                        const itemsCount = (ret.items || []).reduce(
                          (sum, it) => sum + Number(it.quantity || 0),
                          0
                        );
                        return (
                          <tr
                            key={ret.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="px-5 py-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                              {ret.return_number}
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                              {formatDateTime(ret.return_date || ret.created_at)}
                            </td>
                            <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {ret.sale?.invoice_number || "—"}
                            </td>
                            <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                              {ret.customer?.name || "Walk-in Customer"}
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-xs">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                                {itemsCount} units ({ret.items?.length || 0} items)
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs font-semibold">
                              <span className="px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {ret.refund_method || "Cash"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-black text-rose-600 dark:text-rose-400">
                              {formatINR(ret.total_amount)}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedHistoryReturn(ret)}
                                  title="View Return Details"
                                  className="p-2 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition"
                                >
                                  <EyeIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => printThermalReturnReceipt(ret)}
                                  title="Print Return Voucher Slip"
                                  className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition"
                                >
                                  <PrintIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SUCCESS MODAL AFTER COMPLETING RETURN ────────────────── */}
      {completedReturnData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 text-2xl animate-pulse">
              <UndoIcon className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Return & Refund Processed!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Stock has been replenished in inventory and refund payment recorded.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Return Voucher:</span>
                <span className="font-mono font-bold text-rose-600">
                  {completedReturnData.return_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Original Invoice:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {completedReturnData.sale?.invoice_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Refund Method:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {completedReturnData.refund_method}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-sm">
                <span className="text-slate-900 dark:text-slate-100">Total Refunded:</span>
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  {formatINR(completedReturnData.total_amount)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => printThermalReturnReceipt(completedReturnData)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-md shadow-rose-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <PrintIcon className="w-4 h-4" />
                Print Return Slip (Thermal)
              </button>

              {selectedSale && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = salesList.find((s) => s.id === selectedSale.id) || selectedSale;
                    setPreviewBillData(updated);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <ReceiptIcon className="w-3.5 h-3.5 text-emerald-500" />
                  Reprint Updated Sales Receipt
                </button>
              )}

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
              >
                Done / Process Another Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RETURN DETAILS MODAL (FROM HISTORY) ──────────────────── */}
      {selectedHistoryReturn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setSelectedHistoryReturn(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Return Voucher Details
                </h3>
                <p className="font-mono text-xs font-bold text-rose-600">
                  {selectedHistoryReturn.return_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryReturn(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Original Invoice:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {selectedHistoryReturn.sale?.invoice_number || "—"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Date:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {formatDateTime(selectedHistoryReturn.return_date || selectedHistoryReturn.created_at)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Customer:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedHistoryReturn.customer?.name || "Walk-in Customer"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Refund Method:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedHistoryReturn.refund_method}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Reason:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedHistoryReturn.reason || "Customer return"}
                </p>
              </div>
              {selectedHistoryReturn.notes && (
                <div className="col-span-2">
                  <span className="text-slate-500">Notes:</span>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    {selectedHistoryReturn.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedHistoryReturn.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium">
                        {it.product_name || it.product?.name || "Product"}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">
                        {it.quantity} {it.unit || it.product?.unit || ""}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-rose-600">
                        {formatINR(it.line_total || it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between font-bold text-sm pt-2">
              <span>Total Refunded:</span>
              <span className="text-xl font-black text-rose-600">
                {formatINR(selectedHistoryReturn.total_amount)}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => printThermalReturnReceipt(selectedHistoryReturn)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PrintIcon className="w-3.5 h-3.5" />
                Print Return Slip
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistoryReturn(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BILL RECEIPT PREVIEW (FOR REPRINTING) ────────────────── */}
      {previewBillData && (
        <ReceiptPreview
          bill={previewBillData}
          onClose={() => setPreviewBillData(null)}
          onPrint={() => printThermalReceipt(previewBillData)}
        />
      )}
    </div>
  );
}
