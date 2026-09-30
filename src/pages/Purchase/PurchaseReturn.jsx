import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { addNotification, buildPurchaseReturnNotification } from "../../services/notificationService";
import {
  ReceiptText,
  ClipboardList,
  CheckCircle2,
  X,
  Package,
  Info,
  Search,
  Plus,
  PenLine,
  Phone,
  RotateCcw,
  FileText,
  PackageOpen,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
  Calendar,
  Building2,
  Save,
  Clock,
  AlertCircle,
  Printer,
  Download,
} from "lucide-react";
import SearchableSelect from "../../components/SearchableSelect";
import {
  listUIPurchases,
  listPurchases,
  listUISuppliers,
  listUIProducts,
  listPurchaseReturns,
  savePurchaseReturn,
  deletePurchaseReturn,
  subscribeToTable,
} from "../../services/erpService";
import {
  downloadPurchaseReturnReceipt,
  printPurchaseReturnReceipt,
} from "../../utils/purchaseReturnReceipt";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
};

const initialItems = [
  {
    id: 1,
    product: "",
    quantity: 1,
    purchasePrice: 0,
    gst: 5,
    selected: true,
  },
];

export default function PurchaseReturn() {
  const [searchParams] = useSearchParams();
  const [suppliersList, setSuppliersList] = useState([]);
  const [sourcePurchases, setSourcePurchases] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [remoteProducts, setRemoteProducts] = useState([]);
  const [returnRecords, setReturnRecords] = useState([]);

  // Active return form state
  const [supplier, setSupplier] = useState("");
  const [returnNo, setReturnNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState(initialItems);

  // Recent Receipts & Return Records Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedReturnReceipt, setSelectedReturnReceipt] = useState(null);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [expandedReceiptId, setExpandedReceiptId] = useState(null);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotification, setSuccessNotification] = useState(null);

  const loadData = () => {
    Promise.all([
      listUISuppliers(),
      listPurchases(),
      listUIPurchases(),
      listUIProducts(),
      listPurchaseReturns(),
    ])
      .then(([s, p, uip, prods, retRecs]) => {
        setSuppliersList(s || []);
        setSourcePurchases(p || []);
        setRecentPurchases(uip || []);
        setRemoteProducts(prods || []);
        setReturnRecords(retRecs || []);
      })
      .catch((error) => console.error("Error loading purchase return data:", error));
  };

  useEffect(() => {
    loadData();
    const unsubPurchases = subscribeToTable("purchases", loadData);
    const unsubReturns = subscribeToTable("purchase_returns", loadData);
    return () => {
      if (typeof unsubPurchases === "function") unsubPurchases();
      if (typeof unsubReturns === "function") unsubReturns();
    };
  }, []);

  // Auto-open Purchase Return record/receipt modal when navigated from notification
  useEffect(() => {
    const targetRecordId = searchParams.get('recordId') || searchParams.get('returnNo') || searchParams.get('id');
    if (targetRecordId && returnRecords.length > 0) {
      const targetLower = targetRecordId.toLowerCase().trim();
      const match = returnRecords.find(
        (r) =>
          String(r.id).toLowerCase() === targetLower ||
          String(r.returnNo || '').toLowerCase() === targetLower ||
          String(r.return_number || '').toLowerCase() === targetLower ||
          String(r.invoiceNo || '').toLowerCase() === targetLower
      );
      if (match) {
        setSelectedReturnReceipt(match);
        setShowRecordsModal(true);
        setExpandedRecordId(match.id);
        setRecordSearch(match.returnNo || match.return_number || '');
      }
    }
  }, [searchParams, returnRecords]);

  const productOptions = remoteProducts.map((p) => p.name).filter(Boolean);

  // Filtered recent purchases for modal
  const filteredReceipts = useMemo(() => {
    const q = receiptSearch.trim().toLowerCase();
    if (!q) return recentPurchases;
    return recentPurchases.filter((receipt) => {
      const matchInvoice = (receipt.invoice || "").toLowerCase().includes(q);
      const matchBillNo = (receipt.billNo || "").toLowerCase().includes(q);
      const matchSupplier = (receipt.supplier || "").toLowerCase().includes(q);
      const matchDate = (receipt.date || "").toLowerCase().includes(q);
      const matchItems = (receipt.items || []).some((it) =>
        (it.product || it.product_name || "").toLowerCase().includes(q)
      );
      return matchInvoice || matchBillNo || matchSupplier || matchDate || matchItems;
    });
  }, [recentPurchases, receiptSearch]);

  // Filtered return records for verification modal
  const filteredRecords = useMemo(() => {
    const q = recordSearch.trim().toLowerCase();
    if (!q) return returnRecords;
    return returnRecords.filter((rec) => {
      const matchReturnNo = (rec.returnNo || "").toLowerCase().includes(q);
      const matchInvoice = (rec.invoiceNo || "").toLowerCase().includes(q);
      const matchSupplier = (rec.supplierName || "").toLowerCase().includes(q);
      const matchReason = (rec.reason || "").toLowerCase().includes(q);
      return matchReturnNo || matchInvoice || matchSupplier || matchReason;
    });
  }, [returnRecords, recordSearch]);

  // Select a recent receipt and pre-fill return form
  const handleSelectReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setSupplier(receipt.supplier || "");
    const billRef = receipt.billNo || receipt.invoice || "";
    setInvoiceNo(billRef);

    if (!returnNo.trim()) {
      const autoNo = `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      setReturnNo(autoNo);
    }

    // Populate items from receipt with quantity & max purchase quantity
    if (receipt.items && receipt.items.length > 0) {
      const receiptReturnItems = receipt.items.map((it, idx) => ({
        id: Date.now() + idx + Math.random(),
        purchase_item_id: it.purchase_item_id || (String(it.id).includes("-") ? it.id : null),
        product_id: it.product_id || null,
        product: it.product || it.product_name || `Item ${idx + 1}`,
        originalQuantity: Number(it.quantity || 1),
        quantity: Number(it.quantity || 1),
        purchasePrice: Number(it.purchasePrice || it.unit_price || 0),
        gst: Number(it.gst || it.tax_rate || 5),
        selected: true,
        isManual: it.isManual ?? false,
        fromReceipt: true,
      }));
      setItems(receiptReturnItems);
    }

    setShowRecentModal(false);
  };

  const handleClearSelectedReceipt = () => {
    setSelectedReceipt(null);
    setSupplier("");
    setInvoiceNo("");
    setItems(initialItems);
  };

  const handleDeleteRecord = async (rec) => {
    if (!rec?.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete purchase return record "${rec.returnNo || rec.return_number || rec.id}"?`
    );
    if (!confirmDelete) return;

    try {
      await deletePurchaseReturn(rec.id);
      setReturnRecords((prev) => prev.filter((r) => r.id !== rec.id));
      if (selectedReturnReceipt?.id === rec.id) {
        setSelectedReturnReceipt(null);
      }
    } catch (err) {
      alert(err.message || "Failed to delete return record");
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        product: "",
        quantity: 1,
        purchasePrice: 0,
        gst: 5,
        selected: true,
      },
    ]);
  };

  const removeItem = (id) => {
    if (items.length === 1) {
      setItems([
        {
          id: Date.now(),
          product: "",
          quantity: 1,
          purchasePrice: 0,
          gst: 5,
          selected: true,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItemSelection = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleSelectAll = (select) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const updateItem = (id, field, value) => {
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
                ? Number(matched.gstRate ?? matched.gst_rate ?? 5)
                : item.gst,
          };
        }

        if (field === "quantity") {
          let numVal = Number(value);
          if (item.originalQuantity && numVal > item.originalQuantity) {
            numVal = item.originalQuantity;
          }
          return {
            ...item,
            quantity: numVal < 0 ? 0 : numVal,
          };
        }

        return {
          ...item,
          [field]:
            field === "purchasePrice" || field === "gst"
              ? Number(value)
              : value,
        };
      })
    );
  };

  const calculateItem = (item) => {
    const quantity = Number(item.quantity || 0);
    const purchasePrice = Number(item.purchasePrice || 0);
    const gst = Number(item.gst || 0);

    const amount = quantity * purchasePrice;
    const gstAmount = (amount * gst) / 100;

    return {
      amount,
      gstAmount,
      total: amount + gstAmount,
    };
  };

  // Only selected items contribute to the return total
  const activeItems = useMemo(
    () => items.filter((it) => it.selected !== false),
    [items]
  );

  const totals = useMemo(() => {
    return activeItems.reduce(
      (acc, item) => {
        const calculated = calculateItem(item);
        acc.subtotal += calculated.amount;
        acc.gst += calculated.gstAmount;
        acc.total += calculated.total;
        return acc;
      },
      { subtotal: 0, gst: 0, total: 0 }
    );
  }, [activeItems]);

  const allSelected = items.length > 0 && items.every((it) => it.selected !== false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplier) {
      alert("Please select a supplier.");
      return;
    }

    if (!reason) {
      alert("Please select a return reason.");
      return;
    }

    if (!invoiceNo.trim()) {
      alert("Please enter the original purchase invoice number.");
      return;
    }

    if (activeItems.length === 0) {
      alert("Please select at least one item to return using the checkboxes.");
      return;
    }

    const invalidItem = activeItems.some(
      (item) =>
        !item.product ||
        Number(item.quantity) <= 0 ||
        Number(item.purchasePrice) < 0
    );

    if (invalidItem) {
      alert("Please ensure all selected items have valid product details and quantities.");
      return;
    }

    const overLimitItem = activeItems.find(
      (item) =>
        item.originalQuantity && Number(item.quantity) > item.originalQuantity
    );
    if (overLimitItem) {
      alert(
        `Return quantity for "${overLimitItem.product}" (${overLimitItem.quantity}) cannot exceed purchased quantity (${overLimitItem.originalQuantity}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const matchedPurchase =
        selectedReceipt ||
        recentPurchases.find(
          (p) =>
            p.billNo === invoiceNo.trim() ||
            p.invoice === invoiceNo.trim() ||
            p.id === invoiceNo.trim()
        ) ||
        sourcePurchases.find(
          (p) =>
            p.purchase_number === invoiceNo.trim() ||
            p.supplier_invoice_number === invoiceNo.trim() ||
            p.id === invoiceNo.trim()
        );

      const matchedSupplier = suppliersList.find(
        (s) =>
          (s.companyName || "").trim().toLowerCase() ===
            supplier.trim().toLowerCase() || s.id === supplier
      );

      const generatedReturnNo =
        returnNo.trim() ||
        `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

      const returnPayload = {
        purchase_id: matchedPurchase?.id || null,
        supplier_id: matchedSupplier?.id || null,
        supplier_name: supplier.trim(),
        invoice_no: invoiceNo.trim(),
        return_no: generatedReturnNo,
        return_number: generatedReturnNo,
        return_date: returnDate,
        reason,
        notes,
        refund_method: "Refund",
        subtotal: totals.subtotal,
        tax_amount: totals.gst,
        total_amount: totals.total,
      };

      const returnItemsPayload = activeItems.map((it) => ({
        product: it.product,
        product_id: it.product_id || null,
        purchase_item_id: it.purchase_item_id || null,
        quantity: Number(it.quantity),
        original_quantity: it.originalQuantity || Number(it.quantity),
        purchasePrice: Number(it.purchasePrice),
        unit_price: Number(it.purchasePrice),
        gst: Number(it.gst),
        tax_rate: Number(it.gst),
        gstAmount: (Number(it.quantity) * Number(it.purchasePrice) * Number(it.gst)) / 100,
        amount: Number(it.quantity) * Number(it.purchasePrice),
        total: (Number(it.quantity) * Number(it.purchasePrice)) * (1 + Number(it.gst) / 100),
      }));

      await savePurchaseReturn(returnPayload, returnItemsPayload);

      // Trigger real-time ERP Activity Notification
      try {
        addNotification(buildPurchaseReturnNotification({
          returnNo: generatedReturnNo,
          supplierName: supplier.trim(),
          items: activeItems,
          totalAmount: totals.total,
          date: returnDate
        }));
      } catch (notifErr) {
        console.warn('Could not post purchase return notification:', notifErr);
      }

      // Refresh records
      const updatedRecs = await listPurchaseReturns();
      setReturnRecords(updatedRecs);

      const recordForReceipt = {
        id: generatedReturnNo,
        returnNo: generatedReturnNo,
        return_number: generatedReturnNo,
        invoiceNo: invoiceNo.trim(),
        purchase_invoice: invoiceNo.trim(),
        supplierName: supplier.trim(),
        supplier: supplier.trim(),
        date: returnDate,
        return_date: returnDate,
        reason: reason.trim() || "Supplier Return",
        notes: notes.trim(),
        items: returnItemsPayload,
        subtotal: totals.subtotal,
        tax_amount: totals.gst,
        total_amount: totals.total,
      };

      setSuccessNotification({
        returnNo: generatedReturnNo,
        invoiceNo: invoiceNo.trim(),
        supplier: supplier.trim(),
        total: totals.total,
        itemCount: activeItems.length,
        record: recordForReceipt,
      });

      // Reset form
      setSelectedReceipt(null);
      setSupplier("");
      setReturnNo("");
      setInvoiceNo("");
      setReason("");
      setNotes("");
      setReturnDate(new Date().toISOString().split("T")[0]);
      setItems(initialItems);
    } catch (error) {
      alert(error.message || "Failed to process purchase return");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern shadow-based borderless input style with smokey white background and clear dark text
  const inputStyle =
    "w-full rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] focus:bg-white px-4 py-2.5 text-sm font-semibold text-[#0f172a] placeholder-[#94a3b8] border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] focus:shadow-[0_0_0_2px_#3b82f6] focus:outline-none transition duration-150 disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 text-[#0f172a] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER SECTION - BORDERLESS */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              <Link to="/purchase" className="hover:text-blue-600 transition">
                Purchase
              </Link>
              <span>/</span>
              <span className="text-blue-600 font-bold">Return</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#0f172a] sm:text-3xl">
              Purchase Return
            </h1>
            <p className="mt-1 text-sm text-[#64748b]">
              Return purchased products to supplier from hard-copy receipts or recorded purchase bills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Recent Purchase Receipts Button */}
            <button
              type="button"
              onClick={() => {
                setReceiptSearch("");
                setShowRecentModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50/90 px-4 py-2.5 text-sm font-bold text-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.08)] transition hover:bg-blue-100 hover:shadow-sm cursor-pointer"
              title="Browse recently added purchase receipts"
              id="btn-recent-purchase-receipts"
            >
              <ReceiptText size={16} className="text-blue-600 shrink-0" />
              <span>Recent Receipts</span>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white shadow-2xs">
                {recentPurchases.length}
              </span>
            </button>

            {/* Return Records History Button */}
            <button
              type="button"
              onClick={() => {
                setRecordSearch("");
                setShowRecordsModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1e293b] shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
              title="View saved purchase return records"
              id="btn-view-return-records"
            >
              <ClipboardList size={16} className="text-[#475569] shrink-0" />
              <span>Return Records</span>
              <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-bold text-[#0f172a] shadow-2xs">
                {returnRecords.length}
              </span>
            </button>

            {/* Return Value Widget */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-white px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Return Value
                </p>
                <p className="text-2xl font-black text-[#0f172a] leading-tight">
                  ₹{totals.total.toFixed(2)}
                </p>
              </div>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-2xs">
                {activeItems.length} {activeItems.length === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>

        {/* SUCCESS NOTIFICATION TOAST */}
        {successNotification && (
          <div className="mb-6 flex flex-col gap-3.5 rounded-2xl bg-white p-5 text-[#0f172a] shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-sm">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <p className="font-bold text-[#0f172a] text-base">
                  Purchase Return Recorded Successfully
                </p>
                <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
                  Return No: <strong className="text-[#0f172a]">{successNotification.returnNo}</strong> for Invoice:{" "}
                  <strong className="text-[#0f172a]">{successNotification.invoiceNo}</strong> ({successNotification.supplier}).
                  Returned {successNotification.itemCount} item(s) worth{" "}
                  <strong className="text-blue-700 font-bold">₹{Number(successNotification.total).toFixed(2)}</strong>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {successNotification.record && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedReturnReceipt(successNotification.record)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <ReceiptText size={14} />
                    <span>View Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => printPurchaseReturnReceipt(successNotification.record)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-[#1e293b] shadow-2xs hover:bg-[#f1f5f9] transition cursor-pointer"
                    title="Print Receipt"
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setRecordSearch(successNotification.returnNo);
                  setShowRecordsModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                <Search size={14} />
                <span>Verify Record</span>
              </button>
              <button
                type="button"
                onClick={() => setSuccessNotification(null)}
                className="rounded-xl bg-[#f8fafc] p-2 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f172a] shadow-2xs transition cursor-pointer"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE RECEIPT BANNER - BORDERLESS */}
        {selectedReceipt && (
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-bold shadow-xs">
                  <Package size={22} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#0f172a] text-base">
                      Receipt: {selectedReceipt.billNo || selectedReceipt.invoice}
                    </span>
                    <span className="rounded-lg bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-bold text-[#0f172a] shadow-2xs">
                      Original Bill: ₹{Number(selectedReceipt.total || 0).toFixed(2)}
                    </span>
                    <span className="rounded-lg bg-[#f8fafc] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                      {selectedReceipt.items?.length || 0} Purchased Items
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1">
                    Supplier: <strong className="text-[#0f172a]">{selectedReceipt.supplier}</strong> • Date:{" "}
                    <strong>
                      {selectedReceipt.date
                        ? new Date(selectedReceipt.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </strong>
                  </p>
                  <p className="text-xs font-medium text-blue-700 mt-1 flex items-center gap-1.5">
                    <Info size={14} className="shrink-0 text-blue-600" />
                    <span>The original purchase receipt remains intact. Use the table below to select and adjust returned items.</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRecentModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 hover:shadow-sm cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Change Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSelectedReceipt}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#f8fafc] px-3.5 py-2 text-xs font-semibold text-[#475569] shadow-xs transition hover:bg-[#f1f5f9] hover:text-[#0f172a] cursor-pointer"
                >
                  <X size={13} />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* RETURN INFORMATION SECTION - SHADOW ELEVATED */}
          <section className="mb-6 rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">
                  Return Information
                </h2>
                <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                  Enter supplier and original invoice details, or select directly from recent purchase receipts.
                </p>
              </div>

              {!selectedReceipt && (
                <button
                  type="button"
                  onClick={() => setShowRecentModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-xs transition hover:bg-blue-100 hover:shadow-sm cursor-pointer"
                >
                  <Search size={14} />
                  <span>Pick From Recent Receipts</span>
                </button>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Supplier" icon={Building2} required>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliersList.map((sup) => (
                    <option key={sup.id} value={sup.companyName}>
                      {sup.companyName}
                    </option>
                  ))}
                  {supplier &&
                    !suppliersList.some(
                      (s) => s.companyName === supplier
                    ) && <option value={supplier}>{supplier}</option>}
                </select>
              </FormField>

              <FormField label="Return Number" icon={FileText}>
                <input
                  type="text"
                  value={returnNo}
                  onChange={(e) => setReturnNo(e.target.value)}
                  placeholder="PR-YYYYMMDD-XXXX (Auto-generated if blank)"
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Original Invoice Number" icon={ReceiptText} required>
                <div className="relative">
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="INV-001 or Supplier Bill #"
                    className={inputStyle}
                    required
                  />
                  {selectedReceipt && (
                    <span className="absolute right-3 top-2.5 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 shadow-2xs">
                      Receipt Linked
                    </span>
                  )}
                </div>
              </FormField>

              <FormField label="Return Date" icon={Calendar} required>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={inputStyle}
                  required
                />
              </FormField>

              <FormField label="Return Reason" icon={AlertCircle} required>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Select Reason</option>
                  <option value="Damaged">Damaged Product</option>
                  <option value="Expired">Expired Product</option>
                  <option value="Wrong Item">Wrong Item Received</option>
                  <option value="Leaking Package">Leaking Package</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Excess Stock">Excess Stock</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>

              <FormField label="Return Status" icon={Clock}>
                <div className="flex h-[42px] items-center justify-between rounded-xl bg-[#f8fafc] px-4 text-sm font-semibold text-[#0f172a] border-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    <span>Pending Completion</span>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-white px-2.5 py-0.5 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                    Refund Pending
                  </span>
                </div>
              </FormField>
            </div>
          </section>

          {/* RETURN ITEMS TABLE - BORDERLESS SHADOW DESIGN */}
          <section className="mb-6 rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-[#0f172a]">
                    Return Items
                  </h2>
                  <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                    {activeItems.length} of {items.length} selected for return
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
                  Select and edit only the specific items and quantities you want to return.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedReceipt && (
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(!allSelected)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-bold text-xs px-4 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition cursor-pointer"
                  >
                    <CheckCircle2 size={14} className={allSelected ? "text-blue-600" : "text-[#64748b]"} />
                    <span>{allSelected ? "Unselect All" : "Select All"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-sm cursor-pointer"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    <th className="py-3 px-4 w-12 text-center rounded-l-xl">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded-md border-0 shadow-[0_1px_3px_rgba(0,0,0,0.12)] text-blue-600 focus:ring-0 cursor-pointer"
                        title={allSelected ? "Unselect all items" : "Select all items"}
                      />
                    </th>
                    <th className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Package size={13} className="text-[#64748b] shrink-0" />
                        <span>Product</span>
                      </span>
                    </th>
                    <th className="py-3 px-4">Return Quantity</th>
                    <th className="py-3 px-4">Purchase Price</th>
                    <th className="py-3 px-4">GST %</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">GST</th>
                    <th className="py-3 px-4">Return Value</th>
                    <th className="py-3 px-4 text-center rounded-r-xl">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const isSelected = item.selected !== false;
                    const calculated = calculateItem(item);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors rounded-xl ${
                          !isSelected
                            ? "opacity-45 text-[#94a3b8]"
                            : "hover:bg-[#f8fafc]"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(item.id)}
                            className="h-4 w-4 rounded-md border-0 shadow-[0_1px_3px_rgba(0,0,0,0.12)] text-blue-600 focus:ring-0 cursor-pointer"
                            title={isSelected ? "Exclude from return" : "Include in return"}
                          />
                        </td>

                        {/* Product */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 min-w-[240px]">
                            <div className="flex items-center gap-1.5">
                              {item.fromReceipt ? (
                                <div className="flex-1 font-bold text-sm text-[#0f172a] py-1">
                                  {item.product}
                                </div>
                              ) : item.isManual ? (
                                <>
                                  <input
                                    type="text"
                                    list={`purchase-return-products-list-${item.id}`}
                                    value={item.product}
                                    onChange={(e) =>
                                      updateItem(item.id, "product", e.target.value)
                                    }
                                    placeholder="Type or select product..."
                                    className={`${inputStyle} flex-1 min-w-0`}
                                    required
                                    autoFocus
                                  />
                                  <datalist id={`purchase-return-products-list-${item.id}`}>
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
                                      updateItem(item.id, "product", val)
                                    }
                                    options={productOptions}
                                    placeholder={
                                      productOptions.length > 0
                                        ? "Select Product"
                                        : "Type product..."
                                    }
                                    className={inputStyle}
                                    allowCustom={true}
                                  />
                                </div>
                              )}

                              {!item.fromReceipt && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItem(item.id, "isManual", false)
                                    }
                                    className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                                      !item.isManual
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                                    title={
                                      !item.isManual
                                        ? "Product Search (Active)"
                                        : "Switch to Product Search"
                                    }
                                    aria-label="Product Search"
                                  >
                                    <Search size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItem(item.id, "isManual", true)
                                    }
                                    className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                                      item.isManual
                                        ? "bg-amber-100 text-amber-900"
                                        : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                                    title={
                                      item.isManual
                                        ? "Manual Typing (Active)"
                                        : "Switch to Manual Typing"
                                    }
                                    aria-label="Manual Typing"
                                  >
                                    <PenLine size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {item.originalQuantity && (
                              <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                                <span className="inline-flex items-center rounded-md bg-[#f1f5f9] px-2 py-0.5 font-bold text-[#1e293b] shadow-2xs">
                                  Purchased: {item.originalQuantity}
                                </span>
                                {item.quantity === item.originalQuantity ? (
                                  <span className="text-[11px] font-bold text-blue-600">
                                    (Returning all)
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-amber-700">
                                    (Partial return: {item.quantity} of {item.originalQuantity})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <input
                              type="number"
                              min="1"
                              max={item.originalQuantity || undefined}
                              value={item.quantity}
                              disabled={!isSelected}
                              onChange={(e) =>
                                updateItem(item.id, "quantity", e.target.value)
                              }
                              className={`${inputStyle} w-24 text-center ${
                                item.originalQuantity && Number(item.quantity) > item.originalQuantity
                                  ? "shadow-[0_0_0_2px_#ef4444]"
                                  : ""
                              }`}
                              required={isSelected}
                            />
                            {item.originalQuantity && (
                              <span className="text-[10px] text-[#94a3b8] text-center font-medium">
                                Max: {item.originalQuantity}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Purchase Price */}
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchasePrice}
                            disabled={!isSelected}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "purchasePrice",
                                e.target.value
                              )
                            }
                            className={`${inputStyle} w-32`}
                            required={isSelected}
                          />
                        </td>

                        {/* GST */}
                        <td className="py-3.5 px-4">
                          <select
                            value={item.gst}
                            disabled={!isSelected}
                            onChange={(e) =>
                              updateItem(item.id, "gst", e.target.value)
                            }
                            className={`${inputStyle} w-28 min-w-[6.5rem] cursor-pointer`}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-bold text-[#0f172a]">
                          ₹{calculated.amount.toFixed(2)}
                        </td>

                        {/* GST Amount */}
                        <td className="py-3.5 px-4 text-[#64748b] font-medium">
                          ₹{calculated.gstAmount.toFixed(2)}
                        </td>

                        {/* Return Total Value */}
                        <td className="py-3.5 px-4 font-black text-blue-700">
                          ₹{calculated.total.toFixed(2)}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove this item from return"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* NOTES + SUMMARY GRID - BORDERLESS SHADOW DESIGN */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* RETURN NOTES */}
            <section className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <h2 className="mb-1 text-lg font-bold text-[#0f172a]">
                  Return Remarks & Notes
                </h2>
                <p className="mb-4 text-xs sm:text-sm text-[#64748b]">
                  Add remarks, return conditions, supplier approval references, or debit note info.
                </p>
                <textarea
                  rows="6"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter details regarding this purchase return..."
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div className="mt-4 rounded-xl bg-[#f8fafc] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="text-xs text-[#475569]">
                  <strong className="text-[#0f172a]">Record-Keeping Integrity:</strong> Original purchase receipts remain completely unmodified. This return creates an independent audit trail for tracking and supplier ledger adjustment.
                </p>
              </div>
            </section>

            {/* RETURN SUMMARY */}
            <section className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <h2 className="mb-1 text-lg font-bold text-[#0f172a]">
                  Return Summary
                </h2>
                <p className="mb-5 text-xs sm:text-sm text-[#64748b]">
                  Calculated based only on items and quantities selected for return.
                </p>

                <div className="space-y-3.5">
                  <SummaryRow label="Subtotal (Taxable)" value={totals.subtotal} />
                  <SummaryRow label="Total GST Amount" value={totals.gst} />
                  <SummaryRow
                    label="Selected Return Items"
                    value={`${activeItems.length} of ${items.length} items`}
                    currency={false}
                  />

                  <div className="pt-2">
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-blue-50/90 p-5 shadow-[0_2px_12px_rgba(37,99,235,0.08)]">
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-blue-900">
                          Total Return Value
                        </span>
                        <span className="text-[11px] text-[#64748b]">
                          Inclusive of all applicable taxes
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black text-blue-700">
                        ₹{totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/purchase"
                  className="inline-flex items-center justify-center gap-2 flex-1 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] px-5 py-3.5 text-center text-sm font-bold text-[#1e293b] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:text-[#0f172a] cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Cancel</span>
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || activeItems.length === 0}
                  className="inline-flex items-center justify-center gap-2 flex-1 rounded-xl bg-blue-600 px-5 py-3.5 text-center text-sm font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  id="btn-submit-purchase-return"
                >
                  <Save size={16} />
                  <span>{isSubmitting ? "Saving Return..." : "Save Purchase Return"}</span>
                </button>
              </div>
            </section>
          </div>
        </form>
      </div>

      {/* MODAL: RECENT PURCHASE RECEIPTS - SHADOW ELEVATED */}
      {showRecentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border-0 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 bg-white">
              <div>
                <h3 className="text-xl font-black text-[#0f172a] flex items-center gap-2">
                  <ReceiptText size={20} className="text-blue-600 shrink-0" />
                  <span>Recent Purchase Receipts</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                    {recentPurchases.length} Available
                  </span>
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-[#64748b]">
                  Select a receipt to load its items into the return form. The original receipt remains intact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentModal(false)}
                className="rounded-xl p-2 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="bg-[#f8fafc] px-7 py-3.5">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-[#94a3b8]" />
                <input
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  placeholder="Search by Bill No, Invoice #, Supplier, Date, or Product..."
                  className="w-full rounded-xl bg-white py-2.5 pl-10 pr-12 text-sm font-semibold text-[#0f172a] placeholder-[#94a3b8] border-0 shadow-[0_2px_8px_rgba(0,0,0,0.05)] focus:shadow-[0_0_0_2px_#3b82f6] focus:outline-none"
                  autoFocus
                />
                {receiptSearch && (
                  <button
                    type="button"
                    onClick={() => setReceiptSearch("")}
                    className="absolute right-3.5 top-2.5 text-xs font-bold text-[#94a3b8] hover:text-[#0f172a] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Modal Receipts List */}
            <div className="flex-1 overflow-y-auto p-7 space-y-3.5 bg-[#f8fafc]">
              {filteredReceipts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <FileText size={44} className="text-[#94a3b8] stroke-1" />
                  <p className="mt-3 text-base font-bold text-[#1e293b]">
                    No matching purchase receipts found
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-[#64748b]">
                    Try searching with another keyword or enter invoice details manually.
                  </p>
                </div>
              ) : (
                filteredReceipts.map((receipt) => {
                  const isExpanded = expandedReceiptId === receipt.id;
                  const receiptItems = receipt.items || [];
                  const displayBillNo = receipt.billNo || receipt.invoice || "N/A";
                  const dateStr = receipt.date
                    ? new Date(receipt.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A";

                  return (
                    <div
                      key={receipt.id}
                      className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border-0"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base text-[#0f172a]">
                              {displayBillNo}
                            </span>
                            <span className="rounded-md bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-bold text-[#1e293b] shadow-2xs inline-flex items-center gap-1">
                              <Calendar size={11} className="text-[#64748b]" />
                              <span>{dateStr}</span>
                            </span>
                            <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                              {receiptItems.length} {receiptItems.length === 1 ? "Item" : "Items"}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-[#475569] flex items-center flex-wrap gap-1">
                            <Building2 size={13} className="text-[#64748b] shrink-0" />
                            <span>Supplier: <strong className="text-[#0f172a]">{receipt.supplier}</strong></span>
                            {receipt.supplierContact && (
                              <span className="text-xs text-[#64748b] ml-2 inline-flex items-center gap-1">
                                <Phone size={12} className="text-[#64748b]" />
                                <span>{receipt.supplierContact}</span>
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-[#94a3b8]">
                              Total Bill
                            </p>
                            <p className="text-lg font-black text-[#0f172a]">
                              ₹{Number(receipt.total || 0).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedReceiptId(isExpanded ? null : receipt.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] px-3.5 py-2 text-xs font-bold text-[#1e293b] shadow-2xs transition cursor-pointer"
                            >
                              {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{isExpanded ? "Hide Items" : "View Items"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectReceipt(receipt)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 hover:shadow-sm transition cursor-pointer"
                            >
                              <RotateCcw size={13} />
                              <span>Select for Return</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items Table */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 overflow-hidden">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                            Purchased Items in this Receipt:
                          </p>
                          <div className="overflow-x-auto rounded-xl bg-[#f8fafc] p-2 shadow-2xs border-0">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#f1f5f9] font-bold text-[#475569]">
                                  <th className="px-3 py-2.5 rounded-l-lg">Product Name</th>
                                  <th className="px-3 py-2.5 text-right">Purchased Qty</th>
                                  <th className="px-3 py-2.5 text-right">Unit Price</th>
                                  <th className="px-3 py-2.5 text-right">GST %</th>
                                  <th className="px-3 py-2.5 text-right rounded-r-lg">Item Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {receiptItems.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-white transition-colors">
                                    <td className="px-3 py-2 font-bold text-[#0f172a]">
                                      {item.product || item.product_name || `Item ${idx + 1}`}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-[#1e293b]">
                                      {item.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#475569]">
                                      ₹{Number(item.purchasePrice || item.unit_price || 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#475569]">
                                      {item.gst ?? item.tax_rate ?? 0}%
                                    </td>
                                    <td className="px-3 py-2 text-right font-black text-blue-700">
                                      ₹{Number(item.total || item.line_total || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-7 py-4 bg-[#f8fafc]">
              <span className="text-xs text-[#64748b]">
                Tip: Selecting a receipt lets you pick exactly which items and quantities to return.
              </span>
              <button
                type="button"
                onClick={() => setShowRecentModal(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#f1f5f9] px-5 py-2 text-xs font-bold text-[#1e293b] shadow-xs transition cursor-pointer"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PURCHASE RETURN RECORDS - SHADOW ELEVATED */}
      {showRecordsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border-0 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 bg-white">
              <div>
                <h3 className="text-xl font-black text-[#0f172a] flex items-center gap-2">
                  <ClipboardList size={20} className="text-blue-600 shrink-0" />
                  <span>Saved Purchase Return Records</span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                    {returnRecords.length} Saved
                  </span>
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-[#64748b]">
                  Review previously saved purchase return records for verification and future reference.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordsModal(false)}
                className="rounded-xl p-2 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="bg-[#f8fafc] px-7 py-3.5">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-[#94a3b8]" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  placeholder="Search returns by Return #, Invoice #, Supplier, or Reason..."
                  className="w-full rounded-xl bg-white py-2.5 pl-10 pr-12 text-sm font-semibold text-[#0f172a] placeholder-[#94a3b8] border-0 shadow-[0_2px_8px_rgba(0,0,0,0.05)] focus:shadow-[0_0_0_2px_#3b82f6] focus:outline-none"
                />
                {recordSearch && (
                  <button
                    type="button"
                    onClick={() => setRecordSearch("")}
                    className="absolute right-3.5 top-2.5 text-xs font-bold text-[#94a3b8] hover:text-[#0f172a] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Modal Records List */}
            <div className="flex-1 overflow-y-auto p-7 space-y-3.5 bg-[#f8fafc]">
              {filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <PackageOpen size={44} className="text-[#94a3b8] stroke-1" />
                  <p className="mt-3 text-base font-bold text-[#1e293b]">
                    No purchase return records found
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-[#64748b]">
                    Submitted returns will appear here for future reference.
                  </p>
                </div>
              ) : (
                filteredRecords.map((rec) => {
                  const isExpanded = expandedRecordId === rec.id;
                  const recItems = rec.items || [];
                  const dateStr = rec.date
                    ? new Date(rec.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A";

                  return (
                    <div
                      key={rec.id}
                      className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-all border-0"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base text-[#0f172a] inline-flex items-center gap-1.5">
                              <FileText size={15} className="text-blue-600 shrink-0" />
                              <span>{rec.returnNo || "PR-Record"}</span>
                            </span>
                            <span className="rounded-md bg-[#f1f5f9] px-2.5 py-0.5 text-xs font-bold text-[#1e293b] shadow-2xs inline-flex items-center gap-1">
                              <Calendar size={11} className="text-[#64748b]" />
                              <span>{dateStr}</span>
                            </span>
                            <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 shadow-2xs inline-flex items-center gap-1">
                              <ReceiptText size={11} className="text-blue-700" />
                              <span>Original Inv: {rec.invoiceNo || "N/A"}</span>
                            </span>
                            <span className="rounded-md bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 shadow-2xs">
                              Reason: {rec.reason}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-[#475569] flex items-center gap-1.5">
                            <Building2 size={13} className="text-[#64748b] shrink-0" />
                            <span>Supplier: <strong className="text-[#0f172a]">{rec.supplierName}</strong></span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="text-right mr-1">
                            <p className="text-[10px] uppercase font-bold text-[#94a3b8]">
                              Return Value
                            </p>
                            <p className="text-lg font-black text-emerald-600">
                              ₹{Number(rec.totalAmount || rec.total_amount || 0).toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedReturnReceipt(rec)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                            title="View Purchase Return Receipt"
                          >
                            <ReceiptText size={13} />
                            <span>Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => printPurchaseReturnReceipt(rec)}
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-[#1e293b] shadow-2xs transition cursor-pointer"
                            title="Print Return Receipt"
                          >
                            <Printer size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadPurchaseReturnReceipt(rec)}
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-[#1e293b] shadow-2xs transition cursor-pointer"
                            title="Download Return Receipt (HTML)"
                          >
                            <Download size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(rec)}
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-red-200 hover:bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 shadow-2xs transition cursor-pointer"
                            title="Delete Return Record"
                          >
                            <Trash2 size={13} />
                          </button>

                          {recItems.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRecordId(isExpanded ? null : rec.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] px-3 py-1.5 text-xs font-bold text-[#1e293b] shadow-2xs transition cursor-pointer"
                            >
                              {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{isExpanded ? "Hide" : `Items (${recItems.length})`}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Returned Items */}
                      {isExpanded && recItems.length > 0 && (
                        <div className="mt-4 pt-3 overflow-hidden">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                            Items Returned:
                          </p>
                          <div className="overflow-x-auto rounded-xl bg-[#f8fafc] p-2 shadow-2xs border-0">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-[#f1f5f9] font-bold text-[#475569]">
                                  <th className="px-3 py-2.5 rounded-l-lg">Product Name</th>
                                  <th className="px-3 py-2.5 text-right">Returned Qty</th>
                                  <th className="px-3 py-2.5 text-right">Unit Price</th>
                                  <th className="px-3 py-2.5 text-right">GST %</th>
                                  <th className="px-3 py-2.5 text-right rounded-r-lg">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {recItems.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-white transition-colors">
                                    <td className="px-3 py-2 font-bold text-[#0f172a]">
                                      {item.product || item.product_name || `Item ${idx + 1}`}
                                    </td>
                                    <td className="px-3 py-2 text-right font-black text-[#1e293b]">
                                      {item.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#475569]">
                                      ₹{Number(item.purchasePrice || item.unit_price || item.price || 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#475569]">
                                      {item.gst ?? item.tax_rate ?? 0}%
                                    </td>
                                    <td className="px-3 py-2 text-right font-black text-blue-700">
                                      ₹{Number(item.total || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-7 py-4 bg-[#f8fafc]">
              <span className="text-xs text-[#64748b]">
                Purchase return records are stored securely in Supabase.
              </span>
              <button
                type="button"
                onClick={() => setShowRecordsModal(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#f1f5f9] px-5 py-2 text-xs font-bold text-[#1e293b] shadow-xs transition cursor-pointer"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE RETURN RECEIPT MODAL - IDENTICAL DESIGN TO PURCHASE RECEIPT */}
      {selectedReturnReceipt && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReturnReceipt(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Return ID</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedReturnReceipt.returnNo || selectedReturnReceipt.return_number || selectedReturnReceipt.id}
                  </h2>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    PURCHASE RETURN
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedReturnReceipt(null)}
                className="rounded-lg p-2 text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-slate-500">Supplier</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {selectedReturnReceipt.supplierName || selectedReturnReceipt.supplier || "-"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-slate-500">Invoice</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {selectedReturnReceipt.invoiceNo || selectedReturnReceipt.purchase_invoice || "-"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-slate-500">Return Date</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {selectedReturnReceipt.date || selectedReturnReceipt.return_date || selectedReturnReceipt.created_at || "-"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs text-slate-500">Return Reason</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white truncate" title={selectedReturnReceipt.reason || "Supplier Return"}>
                  {selectedReturnReceipt.reason || "Supplier Return"}
                </p>
              </div>

              <div className="col-span-2 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="mb-3 text-xs text-slate-500">
                  Products
                </p>

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {Array.isArray(selectedReturnReceipt.items) && selectedReturnReceipt.items.length > 0 ? (
                    selectedReturnReceipt.items.map((item, index) => {
                      const qty = Number(item.quantity) || 0;
                      const price = Number(item.purchasePrice || item.unit_price || item.price || 0);
                      const gst = Number(item.gst ?? item.tax_rate ?? 0);
                      return (
                        <div
                          key={item.id || index}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
                        >
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-400">
                              {item.product || item.product_name || "Product"}
                            </p>

                            <p className="text-xs text-slate-500">
                              ₹{price.toFixed(2)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              Qty: {qty}
                            </p>

                            <p className="text-xs text-slate-500">
                              GST: {gst}%
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">
                      No returned product details available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Subtotal, GST, Total */}
            {(() => {
              const itms = Array.isArray(selectedReturnReceipt.items) ? selectedReturnReceipt.items : [];
              const sub = Number(selectedReturnReceipt.subtotal) ||
                itms.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.purchasePrice || it.unit_price || it.price || 0)), 0);
              const gst = Number(selectedReturnReceipt.tax_amount || selectedReturnReceipt.taxAmount || selectedReturnReceipt.gst) ||
                itms.reduce((sum, it) => {
                  const amt = Number(it.quantity || 0) * Number(it.purchasePrice || it.unit_price || it.price || 0);
                  const rate = Number(it.gst ?? it.tax_rate ?? 0);
                  return sum + ((amt * rate) / 100);
                }, 0);
              const grand = Number(selectedReturnReceipt.total_amount || selectedReturnReceipt.totalAmount || selectedReturnReceipt.total) || (sub + gst);

              return (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(sub)}</span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">GST</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(gst)}</span>
                  </div>

                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold dark:border-slate-700">
                    <span className="text-slate-900 dark:text-white">Total</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(grand)}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Refunded
                </span>
                <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Completed
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printPurchaseReturnReceipt(selectedReturnReceipt)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Print Purchase Return Receipt"
                >
                  <Printer size={16} />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadPurchaseReturnReceipt(selectedReturnReceipt)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition cursor-pointer"
                  title="Download Purchase Return Receipt (HTML)"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function FormField({ label, icon: Icon, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-blue-600 shrink-0" />}
        <span>{label}</span> {required && <span className="text-red-500 font-bold">*</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, currency = true }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="font-semibold text-[#64748b]">{label}</span>
      <span className="font-bold text-[#0f172a]">
        {currency ? `₹${value.toFixed(2)}` : value}
      </span>
    </div>
  );
}

