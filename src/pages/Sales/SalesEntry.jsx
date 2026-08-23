import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchableSelect from "../../components/SearchableSelect";

const initialItems = [
  {
    id: 1,
    product: "",
    quantity: 1,
    salesPrice: 0,
    gst: 18,
  },
];

const productPrices = {
  "Aashirvaad Atta": 350,
  "Fortune Rice": 1200,
  "Tata Salt": 25,
  "Amul Milk": 60,
  "Parle-G Biscuit": 10,
  "Maggi Noodles": 15,
  "Fortune Oil": 180,
  Sugar: 45,
  "Tea Powder": 250,
  "Surf Excel": 120,
};

export default function SalesEntry() {
  const navigate = useNavigate();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customer, setCustomer] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState(initialItems);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        salesPrice: 0,
        gst: 18,
      },
    ]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "product") {
          return {
            ...item,
            product: value,
            salesPrice: productPrices[value] || 0,
          };
        }

        return {
          ...item,
          [field]:
            field === "quantity" || field === "salesPrice" || field === "gst"
              ? Number(value)
              : value,
        };
      })
    );
  };

  const calculateItem = (item) => {
    const amount = item.quantity * item.salesPrice;
    const gstAmount = (amount * item.gst) / 100;

    return {
      amount,
      gstAmount,
      total: amount + gstAmount,
    };
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!customer) {
      alert("Please select customer.");
      return;
    }

    const hasInvalidProduct = items.some(
      (item) => !item.product || item.quantity <= 0
    );

    if (hasInvalidProduct) {
      alert("Please enter valid product details.");
      return;
    }

    const saleData = {
      id: `SAL-${Date.now()}`,
      date: invoiceDate,
      customer,
      invoice: invoiceNo || `INV-${Date.now()}`,
      items: [...items],
      itemCount: items.length,
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      status: "Completed",
      payment: paymentMode === "Credit" ? "Pending" : "Paid",
      paymentMode,
      notes,
    };

    const existingSales =
      JSON.parse(localStorage.getItem("salesHistory")) || [];

    localStorage.setItem(
      "salesHistory",
      JSON.stringify([saleData, ...existingSales])
    );

    const transactions =
      JSON.parse(localStorage.getItem("transactions")) || [];

    transactions.unshift({
      id: `TXN-${Date.now()}`,
      type: "Sale",
      invoice: saleData.invoice,
      customer,
      amount: totals.total,
      paymentMode,
      status: paymentMode === "Credit" ? "Pending" : "Success",
      date: invoiceDate,
    });

    localStorage.setItem("transactions", JSON.stringify(transactions));

    alert("Sale saved successfully!");
    navigate("/sales/history");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl text-slate-900 dark:text-slate-100">
              Sales Entry
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Create a new sales invoice and update inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/sales/history"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Sales History
            </Link>

            <Link
              to="/sales/return"
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Sales Return
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Sales Information */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Sales Information
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter customer and invoice details.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Customer" required>
                <select
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Customer</option>
                  <option value="Rahul Sharma">Rahul Sharma</option>
                  <option value="Amit Kumar">Amit Kumar</option>
                  <option value="Priya Singh">Priya Singh</option>
                  <option value="Rohan Verma">Rohan Verma</option>
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

          {/* Products Table */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Sales Items
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add products included in this sale.
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

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Sales Price</th>
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
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min="0"
                            value={item.salesPrice}
                            onChange={(e) =>
                              updateItem(item.id, "salesPrice", e.target.value)
                            }
                            className="input-field w-32"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={item.gst}
                            onChange={(e) =>
                              updateItem(item.id, "gst", e.target.value)
                            }
                            className="input-field w-23"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                          ₹{calculated.amount.toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-slate-900 dark:text-slate-100">
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
                            className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-30"
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

          {/* Bottom Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Notes */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Notes
              </h2>

              <textarea
                rows="6"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add sales notes..."
                className="input-field resize-none"
              />
            </section>

            {/* Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Sales Summary
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
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Grand Total
                    </span>

                    <span className="rounded-xl bg-emerald-50 px-4 py-2 text-2xl font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                      ₹{totals.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/sales"
                  className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Save Sale
                </button>
              </div>
            </section>
          </div>
        </form>
      </div>

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

function SummaryRow({ label, value, currency = true }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>

      <span className="font-medium text-slate-900 dark:text-slate-100">
        {currency ? `₹${Number(value).toFixed(2)}` : value}
      </span>
    </div>
  );
}