import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { addStock, findInventoryProduct } from "../../hooks/inventoryStorage";
import { getSuppliers } from "../../hooks/supplierData";
import SearchableSelect from "../../components/SearchableSelect";
import { queueSync } from "../../supabase/syncManager";

const initialItems = [
  {
    id: 1,
    product: "",
    quantity: 1,
    purchasePrice: 0,
    gst: 5,
  },
];

const productPrices = {
  "Basmati Rice": 85,
  "Toor Dal": 110,
  "Wheat Flour": 45,
  Sugar: 42,
  Salt: 20,
  "Cooking Oil": 135,
  "Mustard Oil": 145,
  Tea: 210,
  Coffee: 280,
  Poha: 45,
  Besan: 75,
  "Moong Dal": 105,
  "Chana Dal": 75,
  "Maggi Noodles": 12,
  "Parle-G Biscuits": 8,
  "Britannia Good Day": 25,
  "Tomato Ketchup": 90,
  "Mango Pickle": 100,
  Milk: 27,
  Paneer: 340,
};

const productGST = {
  "Basmati Rice": 5,
  "Toor Dal": 5,
  "Wheat Flour": 0,
  Sugar: 0,
  Salt: 0,
  "Cooking Oil": 5,
  "Mustard Oil": 5,
  Tea: 5,
  Coffee: 5,
  Poha: 5,
  Besan: 5,
  "Moong Dal": 5,
  "Chana Dal": 5,
  "Maggi Noodles": 12,
  "Parle-G Biscuits": 5,
  "Britannia Good Day": 18,
  "Tomato Ketchup": 12,
  "Mango Pickle": 12,
  Milk: 0,
  Paneer: 5,
};

// ============================================================
// FORM FIELD HELPER
// ============================================================
function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ============================================================
// SUMMARY ROW HELPER
// ============================================================
function SummaryRow({ label, value, currency = true }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-200">
        {currency ? `₹${Number(value).toFixed(2)}` : value}
      </span>
    </div>
  );
}

export default function PurchaseEntry() {
  const navigate = useNavigate();
  const suppliersList = getSuppliers();

  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState(initialItems);

  // ADD ITEM
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        purchasePrice: 0,
        gst: 5,
      },
    ]);
  };

  // REMOVE ITEM
  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // UPDATE ITEM
  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "product") {
          return {
            ...item,
            product: value,
            purchasePrice: productPrices[value] || 0,
            gst: productGST[value] ?? 0,
          };
        }

        return {
          ...item,
          [field]:
            field === "quantity" ||
              field === "purchasePrice" ||
              field === "gst"
              ? Number(value)
              : value,
        };
      })
    );
  };

  // CALCULATE ITEM
  const calculateItem = (item) => {
    const amount = Number(item.quantity || 0) * Number(item.purchasePrice || 0);
    const gstAmount = (amount * Number(item.gst || 0)) / 100;

    return {
      amount,
      gstAmount,
      total: amount + gstAmount,
    };
  };

  // TOTALS
  const totals = items.reduce(
    (acc, item) => {
      const calculated = calculateItem(item);
      acc.subtotal += calculated.amount;
      acc.gst += calculated.gstAmount;
      acc.total += calculated.total;
      return acc;
    },
    { subtotal: 0, gst: 0, total: 0 }
  );

  // SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!supplier) {
      alert("Please select a supplier.");
      return;
    }

    const hasInvalidProduct = items.some(
      (item) =>
        !item.product ||
        Number(item.quantity) <= 0 ||
        Number(item.purchasePrice) < 0
    );

    if (hasInvalidProduct) {
      alert("Please enter valid product details.");
      return;
    }

    for (const item of items) {
      const existingProduct = findInventoryProduct(item.product);
      if (!existingProduct) {
        alert(
          `${item.product} inventory me nahi mila.\n\nPlease add this product from Product Management first.`
        );
        return;
      }
    }

    const transactionId = `TXN-${Date.now()}`;

    const purchaseData = {
      id: `PUR-${Date.now()}`,
      date: invoiceDate,
      supplier,
      invoice: invoiceNo || `INV-${Date.now()}`,
      items: [...items],
      itemCount: items.length,
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      transactionId,
      paymentMode,
      status: paymentMode === "Credit" ? "Pending" : "Completed",
      payment: paymentMode === "Credit" ? "Pending" : "Paid",
      notes,
    };

    const existingPurchases =
      JSON.parse(localStorage.getItem("purchaseHistory")) || [];
    localStorage.setItem(
      "purchaseHistory",
      JSON.stringify([purchaseData, ...existingPurchases])
    );

    // Sync to Supabase
    queueSync("purchases", "insert", purchaseData);

    const supplierTransactions =
      JSON.parse(localStorage.getItem("supplierTransactions")) || {};
    const transaction = {
      id: transactionId,
      date: invoiceDate,
      invoice: purchaseData.invoice,
      supplier,
      type: "Purchase",
      amount: totals.total,
      paymentMethod: paymentMode,
      paymentStatus: paymentMode === "Credit" ? "Pending" : "Paid",
      transactionStatus: paymentMode === "Credit" ? "Pending" : "Completed",
    };

    if (!supplierTransactions[supplier]) {
      supplierTransactions[supplier] = [];
    }
    supplierTransactions[supplier].push(transaction);
    localStorage.setItem(
      "supplierTransactions",
      JSON.stringify(supplierTransactions)
    );

    if (paymentMode === "Credit") {
      const supplierBalances =
        JSON.parse(localStorage.getItem("supplierBalances")) || {};
      supplierBalances[supplier] =
        (supplierBalances[supplier] || 0) + totals.total;
      localStorage.setItem(
        "supplierBalances",
        JSON.stringify(supplierBalances)
      );
    }

    const financeTransactions =
      JSON.parse(localStorage.getItem("financeTransactions")) || [];
    financeTransactions.unshift({
      id: transactionId,
      date: invoiceDate,
      type: "Expense",
      category: "Purchase",
      supplier,
      amount: totals.total,
      paymentMethod: paymentMode,
      status: paymentMode === "Credit" ? "Pending" : "Paid",
    });
    localStorage.setItem(
      "financeTransactions",
      JSON.stringify(financeTransactions)
    );

    for (const purchaseItem of items) {
      const result = addStock(purchaseItem.product, purchaseItem.quantity);
      if (!result.success) {
        alert(result.message);
        return;
      }
    }

    alert(
      "Purchase entry saved successfully!\n\nInventory stock bhi update ho gaya."
    );

    setSupplier("");
    setInvoiceNo("");
    setNotes("");
    setPaymentMode("Cash");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setItems([
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        purchasePrice: 0,
        gst: 5,
      },
    ]);

    navigate("/purchase/history");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

            Purchase Entry
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create a new purchase invoice and update inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/purchase/history"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Purchase History
          </Link>
          <Link
            to="/purchase/return"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Purchase Return
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PURCHASE INFORMATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Purchase Information
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter supplier and invoice details.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Supplier" required>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Supplier</option>
                {suppliersList.map((sup) => (
                  <option key={sup.id} value={sup.companyName}>
                    {sup.companyName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Invoice Number">
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-001"
                className="input-field"
              />
            </FormField>

            <FormField label="Invoice Date" required>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="input-field"
                required
              />
            </FormField>

            <FormField label="Payment Mode">
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="input-field"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit">Credit</option>
                <option value="Cheque">Cheque</option>
              </select>
            </FormField>
          </div>
        </section>

        {/* PURCHASE ITEMS */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Purchase Items
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add products included in this purchase.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              + Add Product
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Purchase Price</th>
                  <th className="px-5 py-4">GST %</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">GST Amount</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((item) => {
                  const calculated = calculateItem(item);
                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <SearchableSelect
                          value={item.product}
                          onChange={(val) =>
                            updateItem(item.id, "product", val)
                          }
                          options={Object.keys(productPrices)}
                          placeholder="Select Product"
                          className="input-field min-w-[190px]"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          className="input-field w-24"
                          required
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="0"
                          value={item.purchasePrice}
                          onChange={(e) =>
                            updateItem(item.id, "purchasePrice", e.target.value)
                          }
                          className="input-field w-32"
                          required
                        />
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={item.gst}
                          onChange={(e) =>
                            updateItem(item.id, "gst", e.target.value)
                          }
                          className="input-field w-24"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-200">
                        ₹{calculated.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-200">
                        ₹{calculated.gstAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{calculated.total.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* NOTES + SUMMARY */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Notes
            </h2>
            <textarea
              rows="6"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add purchase notes..."
              className="input-field resize-none"
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Purchase Summary
            </h2>
            <div className="space-y-4">
              <SummaryRow label="Subtotal" value={totals.subtotal} />
              <SummaryRow label="GST" value={totals.gst} />
              <SummaryRow
                label="Total Items"
                value={items.length}
                currency={false}
              />
              <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Grand Total
                  </span>
                  <span className="rounded-xl bg-emerald-50 px-4 py-2 text-2xl font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    ₹{totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/purchase"
                className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Save Purchase
              </button>
            </div>
          </section>
        </div>
      </form>

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
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 2px rgb(16 185 129 / 0.15);
        }

        .input-field option {
          background-color: var(--slate-900);
          color: var(--slate-200);
        }
      `}</style>
    </div>
  );
}