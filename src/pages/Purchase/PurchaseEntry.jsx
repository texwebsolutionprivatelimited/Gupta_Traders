import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Eye,
  Edit3,
  Trash2,
  Plus,
  ArrowLeft,
  Download,
  FileText,
  Search,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  X,
  AlertTriangle
} from "lucide-react";
import SearchableSelect from "../../components/SearchableSelect";
import {
  listUIPurchases,
  savePurchaseBill,
  deletePurchaseBill,
  listUISuppliers,
  listUIProducts,
  subscribeToTable
} from "../../services/erpService";

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(val) || 0);

const getCurrentDateTimeLocal = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDisplayDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  product: "",
  quantity: 1,
  purchasePrice: 0,
  gst: 18,
  isManual: false,
});

export default function PurchaseEntry() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Records state
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Form mode state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Active viewing/deleting modals
  const [viewingBill, setViewingBill] = useState(null);
  const [deletingBill, setDeletingBill] = useState(null);

  // Catalog data for autocomplete
  const [remoteProducts, setRemoteProducts] = useState([]);
  const [remoteSuppliers, setRemoteSuppliers] = useState([]);

  // Form fields
  const [purchaseDateTime, setPurchaseDateTime] = useState(getCurrentDateTimeLocal());
  const [billNo, setBillNo] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyItem()]);

  // Load purchase bills and catalog
  const loadBills = async () => {
    try {
      const data = await listUIPurchases();
      setPurchaseBills(data || []);
    } catch (e) {
      console.error("Error loading purchase bills:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
    Promise.all([listUIProducts(), listUISuppliers()])
      .then(([p, s]) => {
        setRemoteProducts(p || []);
        setRemoteSuppliers(s || []);
      })
      .catch((e) => console.warn(e.message));

    const unsubscribe = subscribeToTable("purchases", () => {
      loadBills();
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Handle URL query params for ?new=1 or ?edit=ID
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openNewBillForm();
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("edit")) {
      const editId = searchParams.get("edit");
      const target = purchaseBills.find((b) => b.id === editId);
      if (target) {
        openEditBillForm(target);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, purchaseBills]);

  const productOptions = useMemo(
    () => remoteProducts.map((p) => p.name).filter(Boolean),
    [remoteProducts]
  );

  // Filtered bills for list view
  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return purchaseBills;
    return purchaseBills.filter((bill) => {
      const matchSupplier = (bill.supplier || "").toLowerCase().includes(q);
      const matchInvoice = (bill.invoice || "").toLowerCase().includes(q);
      const matchBillNo = (bill.billNo || "").toLowerCase().includes(q);
      const matchContact = (bill.supplierContact || "").toLowerCase().includes(q);
      const matchAddress = (bill.supplierAddress || "").toLowerCase().includes(q);
      const matchProducts = (bill.items || []).some((item) =>
        (item.product || "").toLowerCase().includes(q)
      );
      return (
        matchSupplier ||
        matchInvoice ||
        matchBillNo ||
        matchContact ||
        matchAddress ||
        matchProducts
      );
    });
  }, [purchaseBills, searchQuery]);

  // Form Calculations
  const calculateItem = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.purchasePrice) || 0;
    const gstRate = Number(item.gst) || 0;
    const amount = qty * price;
    const gstAmount = (amount * gstRate) / 100;
    const total = amount + gstAmount;
    return { amount, gstAmount, total };
  };

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const c = calculateItem(item);
        acc.subtotal += c.amount;
        acc.gst += c.gstAmount;
        acc.total += c.total;
        return acc;
      },
      { subtotal: 0, gst: 0, total: 0 }
    );
  }, [items]);

  // Row operations
  const addItemRow = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItemRow = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemRow = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "product") {
          const matched = remoteProducts.find(
            (p) =>
              (p.name || "").trim().toLowerCase() ===
                String(value).trim().toLowerCase() || p.id === value
          );
          return {
            ...item,
            product: value,
            purchasePrice: matched
              ? Number(
                  matched.purchasePrice ??
                    matched.purchase_price ??
                    matched.rate ??
                    item.purchasePrice ??
                    0
                )
              : item.purchasePrice,
            gst:
              matched &&
              (matched.gstRate !== undefined || matched.gst_rate !== undefined)
                ? Number(matched.gstRate ?? matched.gst_rate ?? 18)
                : item.gst,
          };
        }

        return {
          ...item,
          [field]:
            field === "quantity" || field === "purchasePrice" || field === "gst"
              ? Number(value)
              : value,
        };
      })
    );
  };

  // Open Form
  const openNewBillForm = () => {
    setEditingBillId(null);
    setPurchaseDateTime(getCurrentDateTimeLocal());
    setBillNo("");
    setSupplierName("");
    setSupplierContact("");
    setSupplierAddress("");
    setPaymentMode("Cash");
    setNotes("");
    setItems([emptyItem()]);
    setIsFormOpen(true);
  };

  const openEditBillForm = (bill) => {
    setEditingBillId(bill.id);
    setPurchaseDateTime(getCurrentDateTimeLocal(bill.date));
    setBillNo(bill.billNo || bill.invoice || "");
    setSupplierName(bill.supplier || "");
    setSupplierContact(bill.supplierContact || "");
    setSupplierAddress(bill.supplierAddress || "");
    setPaymentMode(bill.paymentMode || "Cash");
    setNotes(bill.notes || "");
    setItems(
      Array.isArray(bill.items) && bill.items.length > 0
        ? bill.items.map((it, idx) => ({
            id: it.id || idx + 1,
            product: it.product || it.product_name || "",
            quantity: Number(it.quantity) || 1,
            purchasePrice: Number(it.purchasePrice ?? it.unit_price ?? 0),
            gst: Number(it.gst ?? it.tax_rate ?? 18),
            isManual: !!it.isManual,
          }))
        : [emptyItem()]
    );
    setIsFormOpen(true);
  };

  const handleSelectSupplier = (name) => {
    setSupplierName(name);
    const matched = remoteSuppliers.find(
      (s) =>
        (s.companyName || s.name || "").trim().toLowerCase() ===
        name.trim().toLowerCase()
    );
    if (matched) {
      if (matched.phone && !supplierContact) setSupplierContact(matched.phone);
      if (matched.address && !supplierAddress) setSupplierAddress(matched.address);
    }
  };

  // Form submission
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      alert("Please enter the supplier name.");
      return;
    }

    const validItems = items.filter(
      (item) => item.product && item.product.trim() && Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      alert("Please add at least one product with valid name and quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const billData = {
        supplierName: supplierName.trim(),
        supplierContact: supplierContact.trim(),
        supplierAddress: supplierAddress.trim(),
        purchaseDate: purchaseDateTime,
        billNo: billNo.trim(),
        notes: notes.trim(),
        paymentMode,
        subtotal: totals.subtotal,
        taxAmount: totals.gst,
        total: totals.total,
      };

      await savePurchaseBill(billData, validItems, editingBillId);
      setStatusMessage({
        type: "success",
        text: editingBillId
          ? "Purchase bill updated successfully!"
          : "Purchase bill recorded successfully!",
      });

      setTimeout(() => setStatusMessage(null), 4000);
      setIsFormOpen(false);
      await loadBills();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save purchase bill.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete bill
  const handleConfirmDelete = async () => {
    if (!deletingBill) return;
    try {
      await deletePurchaseBill(deletingBill.id);
      setPurchaseBills((prev) => prev.filter((b) => b.id !== deletingBill.id));
      setDeletingBill(null);
      setStatusMessage({
        type: "success",
        text: "Purchase bill deleted successfully!",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      alert(err.message || "Failed to delete purchase bill.");
    }
  };

  // Printable receipt download
  const handleDownloadInvoice = (bill) => {
    if (!bill) return;
    const billItems = Array.isArray(bill.items) ? bill.items : [];
    const itemRows = billItems
      .map((it, idx) => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.purchasePrice) || 0;
        const gst = Number(it.gst) || 0;
        const amt = qty * rate;
        const taxAmt = (amt * gst) / 100;
        const tot = amt + taxAmt;
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${it.product || "Product"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${qty}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${rate.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${gst}%</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${amt.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${tot.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Bill - ${bill.billNo || bill.invoice}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 30px; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .title { font-size: 24px; font-weight: bold; color: #0f172a; }
          .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
          .section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background: #f8fafc; padding: 10px 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
          .totals { margin-top: 20px; width: 300px; margin-left: auto; font-size: 14px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand-total { font-weight: bold; font-size: 16px; border-top: 2px solid #0f172a; padding-top: 8px; color: #059669; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Gupta Traders</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Purchase Bill Soft-Copy Record</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">Record Copy</div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 6px;">Bill No: ${bill.billNo || bill.invoice}</div>
            <div style="font-size: 12px; color: #64748b;">Date: ${formatDisplayDateTime(bill.date)}</div>
          </div>
        </div>

        <div class="section">
          <div>
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Supplier Information</strong>
            <div style="font-size: 15px; font-weight: bold; margin-top: 4px;">${bill.supplier}</div>
            ${bill.supplierContact ? `<div>Phone: ${bill.supplierContact}</div>` : ""}
            ${bill.supplierAddress ? `<div>Address: ${bill.supplierAddress}</div>` : ""}
          </div>
          <div style="text-align: right;">
            <strong style="color: #64748b; text-transform: uppercase; font-size: 11px;">Record Details</strong>
            <div>Payment: ${bill.paymentMode || "Cash"} (${bill.payment || "Paid"})</div>
            ${bill.notes ? `<div>Notes: ${bill.notes}</div>` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center;">#</th>
              <th>Product Name</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: center;">GST %</th>
              <th style="text-align: right;">Amount</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span>₹${bill.subtotal.toFixed(2)}</span></div>
          <div class="total-row"><span>GST Amount:</span><span>₹${bill.gst.toFixed(2)}</span></div>
          <div class="total-row grand-total"><span>Total Amount:</span><span>₹${bill.total.toFixed(2)}</span></div>
        </div>

        <div style="margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center;">
          This soft-copy record was entered into Gupta Traders ERP for physical hard-copy bill reference.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.focus();
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = `Purchase-Bill-${bill.billNo || bill.invoice}.html`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Toast Alert Notification */}
        {statusMessage && (
          <div className="fixed top-6 right-6 z-[120] flex items-center gap-3 rounded-2xl bg-emerald-500 px-5 py-3.5 text-white shadow-2xl animate-fadeIn">
            <CheckCircle size={20} />
            <span className="font-semibold text-sm">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="ml-2 rounded-lg p-1 hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── Top Header ─── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>ERP</span>
              <span>/</span>
              <span className="text-emerald-500 font-semibold">Purchase</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Purchase Bill Records
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Record-keeping system for supplier hard-copy purchase bills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/purchase/return"
              className="rounded-xl border border-slate-700/60 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              Purchase Return
            </Link>

            {/* Rename Button: Add Product -> Purchase Bill */}
            <button
              type="button"
              id="add-purchase-bill-btn"
              onClick={openNewBillForm}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Purchase Bill</span>
            </button>
          </div>
        </div>

        {/* ─── Stats Overview ─── */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Bills Recorded
            </span>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {purchaseBills.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Recorded Value
            </span>
            <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(purchaseBills.reduce((acc, b) => acc + (Number(b.total) || 0), 0))}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Suppliers Represented
            </span>
            <p className="mt-1 text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {new Set(purchaseBills.map((b) => (b.supplier || "").trim().toLowerCase()).filter(Boolean)).size}
            </p>
          </div>
        </div>

        {/* ─── Form Section (When Open) ─── */}
        {isFormOpen && (
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 transition-all animate-fadeIn">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <FileText size={18} />
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {editingBillId ? "Edit Purchase Bill Record" : "New Purchase Bill Record"}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Enter details from the physical/hard-copy supplier invoice for soft-copy archiving.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="self-start sm:self-auto rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                ✕ Close Form
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Supplier & Bill Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Date & Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={purchaseDateTime}
                    onChange={(e) => setPurchaseDateTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                {/* Hard Copy Bill / Invoice Number */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bill / Invoice Number
                  </label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="e.g. INV-2026-001"
                    className="input-field"
                  />
                </div>

                {/* Supplier Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="suppliers-catalog-list"
                    value={supplierName}
                    onChange={(e) => handleSelectSupplier(e.target.value)}
                    placeholder="Type or select supplier..."
                    className="input-field"
                    required
                  />
                  <datalist id="suppliers-catalog-list">
                    {remoteSuppliers.map((s) => (
                      <option key={s.id} value={s.companyName || s.name} />
                    ))}
                  </datalist>
                </div>

                {/* Supplier Contact Details */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Supplier Contact Details
                  </label>
                  <input
                    type="text"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="input-field"
                  />
                </div>

                {/* Supplier Shop Address */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Supplier Shop Address
                  </label>
                  <input
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="e.g. Shop #12, Grain Market, Bhopal, MP"
                    className="input-field"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit">Credit (Outstanding)</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* ─── Products Table (Multi-Row Support) ─── */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Products Included in Bill
                    </h3>
                    <p className="text-xs text-slate-500">
                      Search catalog or type custom products manually.
                    </p>
                  </div>

                  {/* Add Row Button */}
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-400 px-3.5 py-2 transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+ Add Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3 min-w-[240px]">Product</th>
                        <th className="py-2.5 px-3 w-24">Quantity</th>
                        <th className="py-2.5 px-3 w-32">Price (₹)</th>
                        <th className="py-2.5 px-3 w-28">GST %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                        <th className="py-2.5 px-3 w-28 text-right">Total</th>
                        <th className="py-2.5 px-3 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      {items.map((item) => {
                        const calculated = calculateItem(item);
                        return (
                          <tr key={item.id} className="hover:bg-slate-500/5">
                            {/* Product column with Search and Manual modes */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 min-w-[240px]">
                                {item.isManual ? (
                                  <>
                                    <input
                                      type="text"
                                      list={`product-options-${item.id}`}
                                      value={item.product}
                                      onChange={(e) =>
                                        updateItemRow(item.id, "product", e.target.value)
                                      }
                                      placeholder="Type product name..."
                                      className="input-field flex-1 min-w-0"
                                      required
                                      autoFocus
                                    />
                                    <datalist id={`product-options-${item.id}`}>
                                      {productOptions.map((opt, idx) => (
                                        <option key={idx} value={opt} />
                                      ))}
                                    </datalist>
                                  </>
                                ) : (
                                  <div className="flex-1 min-w-0">
                                    <SearchableSelect
                                      value={item.product}
                                      onChange={(val) =>
                                        updateItemRow(item.id, "product", val)
                                      }
                                      options={productOptions}
                                      placeholder={
                                        productOptions.length > 0
                                          ? "Select Product"
                                          : "Type product..."
                                      }
                                      className="input-field"
                                      allowCustom={true}
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateItemRow(item.id, "isManual", false)}
                                    className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                      !item.isManual
                                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm"
                                        : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                    }`}
                                    title={
                                      !item.isManual
                                        ? "Product Search (Active)"
                                        : "Switch to Product Search"
                                    }
                                    aria-label="Product Search"
                                  >
                                    🔍
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateItemRow(item.id, "isManual", true)}
                                    className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                      item.isManual
                                        ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-sm"
                                        : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                    }`}
                                    title={
                                      item.isManual
                                        ? "Manual Typing (Active)"
                                        : "Switch to Manual Typing"
                                    }
                                    aria-label="Manual Typing"
                                  >
                                    ✍️
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className="py-3 px-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItemRow(item.id, "quantity", e.target.value)
                                }
                                className="input-field w-24 text-center font-medium"
                                required
                              />
                            </td>

                            {/* Purchase Price */}
                            <td className="py-3 px-3">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.purchasePrice}
                                onChange={(e) =>
                                  updateItemRow(item.id, "purchasePrice", e.target.value)
                                }
                                className="input-field w-32 font-medium"
                                required
                              />
                            </td>

                            {/* GST % */}
                            <td className="py-3 px-3">
                              <select
                                value={item.gst}
                                onChange={(e) =>
                                  updateItemRow(item.id, "gst", e.target.value)
                                }
                                className="input-field w-28 min-w-[6.5rem] cursor-pointer text-center"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>

                            {/* Amount */}
                            <td className="py-3 px-3 text-right font-medium">
                              ₹{calculated.amount.toFixed(2)}
                            </td>

                            {/* Total with Tax */}
                            <td className="py-3 px-3 text-right font-bold text-emerald-500">
                              ₹{calculated.total.toFixed(2)}
                            </td>

                            {/* Remove Row Action */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => removeItemRow(item.id)}
                                disabled={items.length <= 1}
                                title={items.length <= 1 ? "At least one row required" : "Remove Row"}
                                className={`rounded-lg p-2 transition ${
                                  items.length <= 1
                                    ? "text-slate-600 cursor-not-allowed"
                                    : "text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                }`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ─── Notes & Bill Totals ─── */}
              <div className="grid gap-6 sm:grid-cols-2 items-start">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Record Notes / Physical Bill Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any reference notes, transport details, or physical storage box remarks..."
                    className="input-field resize-none w-full"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4.5 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>GST Tax Amount</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(totals.gst)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-base font-extrabold">
                    <span>Bill Grand Total</span>
                    <span className="text-emerald-500">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Saving Record...</span>
                  ) : (
                    <span>{editingBillId ? "Update Purchase Bill" : "Save Purchase Bill"}</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ─── Search and Filters Bar ─── */}
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier, bill #, product..."
              className="input-field pl-10 w-full"
            />
          </div>

          <div className="text-xs text-slate-500 self-end sm:self-auto font-medium">
            Showing <strong className="text-slate-200">{filteredBills.length}</strong> recorded bills
          </div>
        </div>

        {/* ─── Record Management Table ─── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                <tr>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4">Bill / Invoice #</th>
                  <th className="px-5 py-4">Supplier Details</th>
                  <th className="px-5 py-4">Products</th>
                  <th className="px-5 py-4 text-right">Total Amount</th>
                  <th className="px-5 py-4 text-center">Record Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading purchase bill records...
                    </td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="mx-auto max-w-sm">
                        <FileText size={40} className="mx-auto text-slate-600 mb-3" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">
                          No purchase bills recorded yet
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 mb-4">
                          Enter your physical hard-copy bills into Gupta Traders ERP for permanent record keeping.
                        </p>
                        <button
                          type="button"
                          onClick={openNewBillForm}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 cursor-pointer"
                        >
                          <Plus size={16} />
                          <span>+ Purchase Bill</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => {
                    const billItems = Array.isArray(bill.items) ? bill.items : [];
                    return (
                      <tr
                        key={bill.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Date & Time */}
                        <td className="px-5 py-4 font-medium text-xs whitespace-nowrap">
                          {formatDisplayDateTime(bill.date)}
                        </td>

                        {/* Invoice / Bill No */}
                        <td className="px-5 py-4 font-bold text-xs whitespace-nowrap">
                          <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-400 border border-emerald-500/20">
                            {bill.billNo || bill.invoice}
                          </span>
                        </td>

                        {/* Supplier Details */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {bill.supplier}
                          </div>
                          {bill.supplierContact && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <Phone size={12} />
                              <span>{bill.supplierContact}</span>
                            </div>
                          )}
                          {bill.supplierAddress && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 truncate max-w-xs mt-0.5">
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">{bill.supplierAddress}</span>
                            </div>
                          )}
                        </td>

                        {/* Products */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-semibold text-slate-300">
                            {billItems.length} {billItems.length === 1 ? "Product" : "Products"}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-xs">
                            {billItems.map((it) => it.product || it.name).join(", ")}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-5 py-4 text-right font-extrabold text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(bill.total)}
                        </td>

                        {/* Record Actions: View, Edit, Delete */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Action */}
                            <button
                              type="button"
                              onClick={() => setViewingBill(bill)}
                              title="View Bill Details"
                              className="rounded-lg p-2 text-blue-500 hover:bg-blue-500/10 transition cursor-pointer"
                            >
                              <Eye size={18} />
                            </button>

                            {/* Edit Action */}
                            <button
                              type="button"
                              onClick={() => openEditBillForm(bill)}
                              title="Edit Purchase Bill"
                              className="rounded-lg p-2 text-amber-500 hover:bg-amber-500/10 transition cursor-pointer"
                            >
                              <Edit3 size={18} />
                            </button>

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => setDeletingBill(bill)}
                              title="Delete Record"
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            >
                              <Trash2 size={18} />
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

      {/* ─── View Purchase Bill Modal ─── */}
      {viewingBill && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setViewingBill(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Purchase Bill Record
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {viewingBill.billNo || viewingBill.invoice}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recorded on: {formatDisplayDateTime(viewingBill.date)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingBill(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Supplier Details Card */}
            <div className="my-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Supplier Information
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {viewingBill.supplier}
              </h4>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <strong>Contact:</strong> {viewingBill.supplierContact || "Not specified"}
                </div>
                <div>
                  <strong>Address:</strong> {viewingBill.supplierAddress || "Not specified"}
                </div>
                <div>
                  <strong>Payment Mode:</strong> {viewingBill.paymentMode || "Cash"}
                </div>
                <div>
                  <strong>Status:</strong> {viewingBill.status || "Completed"}
                </div>
              </div>
            </div>

            {/* Products Breakdown Table */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Products Summary
              </span>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-center">GST %</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(viewingBill.items || []).map((it, idx) => {
                      const qty = Number(it.quantity) || 1;
                      const rate = Number(it.purchasePrice) || 0;
                      const gst = Number(it.gst) || 0;
                      const amt = qty * rate;
                      const tot = amt + (amt * gst) / 100;
                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-medium">{it.product}</td>
                          <td className="py-2.5 px-3 text-right">{qty}</td>
                          <td className="py-2.5 px-3 text-right">₹{rate.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-center">{gst}%</td>
                          <td className="py-2.5 px-3 text-right">₹{amt.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-500">
                            ₹{tot.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(viewingBill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax:</span>
                <span>{formatCurrency(viewingBill.gst)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 dark:border-slate-800 pt-1.5">
                <span>Bill Total:</span>
                <span className="text-emerald-500">{formatCurrency(viewingBill.total)}</span>
              </div>
            </div>

            {viewingBill.notes && (
              <p className="mt-3 text-xs text-slate-500 italic">
                <strong>Notes:</strong> {viewingBill.notes}
              </p>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setViewingBill(null);
                  openEditBillForm(viewingBill);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <Edit3 size={15} />
                <span>Edit This Bill</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(viewingBill)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 text-xs font-bold transition cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBill(null)}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deletingBill && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setDeletingBill(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <span className="p-2 rounded-xl bg-rose-500/10">
                <AlertTriangle size={24} />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Delete Purchase Bill Record?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Are you sure you want to delete purchase bill{" "}
              <strong>#{deletingBill.billNo || deletingBill.invoice}</strong> from{" "}
              <strong>{deletingBill.supplier}</strong> (₹{deletingBill.total})?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingBill(null)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local custom style for input fields */}
      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--slate-800);
          background-color: var(--slate-900);
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          color: var(--slate-200);
          outline: none;
          transition: all 0.2s;
        }

        .input-field::placeholder {
          color: var(--slate-500);
        }

        .input-field:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
        }

        .input-field option {
          background-color: var(--slate-900);
          color: var(--slate-200);
        }
      `}</style>
    </div>
  );
}
