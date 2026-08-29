import { useState } from "react";
import { Link } from "react-router-dom";
import SearchableSelect from "../../components/SearchableSelect";
import { queueSync } from "../../supabase/syncManager";

const productPrices = {
  "Aashirvaad Atta": 420,
  "Fortune Rice": 620,
  "Tata Salt": 28,
  "Amul Milk": 68,
  "Parle-G Biscuit": 30,
  "Maggi Noodles": 72,
  "Fortune Oil": 145,
  Sugar: 48,
  "Tea Powder": 180,
  "Surf Excel": 210,
};

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

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-300">
        ₹{Number(value || 0).toFixed(2)}
      </span>
    </div>
  );
}

const createInitialItem = () => ({
  id: Date.now(),
  product: "",
  quantity: 1,
  sellingPrice: 0,
  gst: 18,
});

export default function SalesReturn() {
  const [customer, setCustomer] = useState("");
  const [returnNo, setReturnNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState([createInitialItem()]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        product: "",
        quantity: 1,
        sellingPrice: 0,
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
            sellingPrice: productPrices[value] || 0,
          };
        }

        if (
          field === "quantity" ||
          field === "sellingPrice" ||
          field === "gst"
        ) {
          return {
            ...item,
            [field]: Number(value),
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const calculateItem = (item) => {
    const amount =
      Number(item.quantity || 0) * Number(item.sellingPrice || 0);
    const gstAmount = (amount * Number(item.gst || 0)) / 100;

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
      alert("Please select a customer.");
      return;
    }

    if (!reason) {
      alert("Please select a return reason.");
      return;
    }

    const invalidItem = items.some(
      (item) =>
        !item.product ||
        Number(item.quantity) <= 0 ||
        Number(item.sellingPrice) < 0
    );

    if (invalidItem) {
      alert("Please enter valid product details.");
      return;
    }

    const returnData = {
      returnNo,
      invoiceNo,
      customer,
      returnDate,
      reason,
      notes,
      items,
      totals,
      status: "Pending",
      payment: "Refunded",
      createdAt: new Date().toISOString(),
    };

    // Update Sales History
    const sales = JSON.parse(localStorage.getItem("salesHistory")) || [];
    const updatedSales = sales.map((sale) => {
      if (invoiceNo && sale.invoice === invoiceNo) {
        return {
          ...sale,
          status: "Returned",
          payment: "Refunded",
        };
      }
      return sale;
    });

    localStorage.setItem("salesHistory", JSON.stringify(updatedSales));

    // Sync updated sale to Supabase
    const targetSale = updatedSales.find((s) => invoiceNo && s.invoice === invoiceNo);
    if (targetSale) {
      queueSync("sales", "update", targetSale);
    }

    // Save Sales Return History
    const salesReturns =
      JSON.parse(localStorage.getItem("salesReturns")) || [];
    const newReturn = {
      id: returnNo || `SR-${Date.now()}`,
      ...returnData,
    };

    salesReturns.unshift(newReturn);
    localStorage.setItem("salesReturns", JSON.stringify(salesReturns));

    alert("Sales return created successfully!");

    // Reset Form
    setCustomer("");
    setReturnNo("");
    setInvoiceNo("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setNotes("");
    setItems([createInitialItem()]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/sales"
              className="mb-2 inline-flex text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
            >
              ← Back to Sales
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

              Sales Return
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Return sold products from the customer.
            </p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/20 dark:bg-rose-500/10">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-600 dark:text-rose-400">
              Return Value
            </p>
            <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-300">
              ₹{totals.total.toFixed(2)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* RETURN INFORMATION */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Return Information
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter customer, invoice and return details.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Customer" required>
                <select
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select Customer</option>
                  <option value="Rahul Traders">Rahul Traders</option>
                  <option value="Sharma General Store">Sharma General Store</option>
                  <option value="Amit Enterprises">Amit Enterprises</option>
                  <option value="Gupta Retailers">Gupta Retailers</option>
                  <option value="Verma Supermarket">Verma Supermarket</option>
                </select>
              </FormField>

              <FormField label="Return Number">
                <input
                  type="text"
                  value={returnNo}
                  onChange={(e) => setReturnNo(e.target.value)}
                  placeholder="SR-001"
                  className="input-field"
                />
              </FormField>

              <FormField label="Original Invoice Number">
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="INV-001"
                  className="input-field"
                />
              </FormField>

              <FormField label="Return Date" required>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="input-field"
                  required
                />
              </FormField>

              <FormField label="Return Reason" required>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select Reason</option>
                  <option value="Damaged">Damaged Product</option>
                  <option value="Defective">Defective Product</option>
                  <option value="Wrong Item">Wrong Item Sold</option>
                  <option value="Expired">Expired Product</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Customer Changed Mind">
                    Customer Changed Mind
                  </option>
                  <option value="Excess Quantity">Excess Quantity</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>

              <FormField label="Return Status">
                <div className="flex h-[43px] items-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  Pending
                </div>
              </FormField>
            </div>
          </section>

          {/* RETURN ITEMS */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Return Items
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select the products returned by the customer.
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
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Selling Price</th>
                    <th className="px-5 py-4">GST %</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">GST</th>
                    <th className="px-5 py-4">Return Value</th>
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
                            value={item.sellingPrice}
                            onChange={(e) =>
                              updateItem(item.id, "sellingPrice", e.target.value)
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
                            className="input-field w-24"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-green-500">
                          ₹{calculated.amount.toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-slate-900 dark:text-slate-300">
                          ₹{calculated.gstAmount.toFixed(2)}
                        </td>

                        <td className="px-5 py-4 font-semibold text-rose-500">
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
                Return Notes
              </h2>

              <textarea
                rows="7"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add additional information about this sales return..."
                className="input-field resize-none"
              />

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> Returned quantity should be verified
                  before completing the sales return.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-50">
                Return Summary
              </h2>

              <div className="space-y-4">
                <SummaryRow label="Subtotal" value={totals.subtotal} />
                <SummaryRow label="GST" value={totals.gst} />

                <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      Total Return Value
                    </span>
                    <span className="text-2xl font-bold text-rose-500">
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
                  className="flex-1 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  Create Sales Return
                </button>
              </div>
            </section>
          </div>
        </form>
      </div>

      {/* INPUT STYLES WITH LIGHT & DARK FIX */}
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