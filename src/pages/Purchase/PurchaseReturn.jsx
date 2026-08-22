import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { findInventoryProduct } from "../../utils/inventoryStorage";

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

const productOptions = Object.keys(productPrices);

export default function PurchaseReturn() {
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState("");
  const [returnNo, setReturnNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState(initialItems);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        product: "",
        quantity: 1,
        purchasePrice: 0,
        gst: 5,
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
            purchasePrice: productPrices[value] || 0,
            gst: productGST[value] ?? 0,
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

  const reduceInventoryStock = (productName, quantity) => {
    const inventoryProducts =
      JSON.parse(localStorage.getItem("inventoryProducts")) || [];

    const productIndex = inventoryProducts.findIndex(
      (product) => product.name === productName
    );

    if (productIndex === -1) {
      return {
        success: false,
        message: `${productName} inventory me nahi mila.`,
      };
    }

    const existingProduct = inventoryProducts[productIndex];
    const currentStock = Number(existingProduct.stock || 0);
    const returnQuantity = Number(quantity || 0);

    if (returnQuantity > currentStock) {
      return {
        success: false,
        message:
          `${productName} ka available stock ${currentStock} hai, ` +
          `lekin aap ${returnQuantity} return kar rahe ho.`,
      };
    }

    inventoryProducts[productIndex] = {
      ...existingProduct,
      stock: currentStock - returnQuantity,
    };

    localStorage.setItem(
      "inventoryProducts",
      JSON.stringify(inventoryProducts)
    );

    return { success: true };
  };

  const handleSubmit = (e) => {
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

    const invalidItem = items.some(
      (item) =>
        !item.product ||
        Number(item.quantity) <= 0 ||
        Number(item.purchasePrice) < 0
    );

    if (invalidItem) {
      alert("Please enter valid product details.");
      return;
    }

    for (const item of items) {
      const inventoryProduct = findInventoryProduct(item.product);

      if (!inventoryProduct) {
        alert(
          `${item.product} inventory me nahi mila.\n\nPlease add this product from Product Management first.`
        );
        return;
      }

      const availableStock = Number(inventoryProduct.stock || 0);

      if (Number(item.quantity) > availableStock) {
        alert(
          `${item.product} ka available stock ${availableStock} hai.\n\nAap sirf ${availableStock} quantity tak return kar sakte ho.`
        );
        return;
      }
    }

    const timestamp = Date.now();
    const generatedReturnNo = returnNo.trim() || `PR-${timestamp}`;
    const transactionId = `PR-TXN-${timestamp}`;

    const returnData = {
      id: `PR-${timestamp}`,
      returnNo: generatedReturnNo,
      date: returnDate,
      supplier,
      invoice: invoiceNo.trim(),
      reason,
      notes,
      items: [...items],
      itemCount: items.length,
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      transactionId,
      status: "Completed",
      payment: "Refund Pending",
    };

    const existingReturns =
      JSON.parse(localStorage.getItem("purchaseReturns")) || [];
    localStorage.setItem(
      "purchaseReturns",
      JSON.stringify([returnData, ...existingReturns])
    );

    const purchases =
      JSON.parse(localStorage.getItem("purchaseHistory")) || [];
    const updatedPurchases = purchases.map((purchase) => {
      if (purchase.invoice !== invoiceNo.trim()) {
        return purchase;
      }

      return {
        ...purchase,
        status: "Returned",
        payment: purchase.payment === "Paid" ? "Refunded" : "Refund Pending",
        returnStatus: "Completed",
        returnId: `PR-${timestamp}`,
        returnedAmount: totals.total,
        returnDate,
      };
    });

    localStorage.setItem("purchaseHistory", JSON.stringify(updatedPurchases));

    for (const purchaseItem of items) {
      const result = reduceInventoryStock(
        purchaseItem.product,
        purchaseItem.quantity
      );

      if (!result.success) {
        alert(result.message);
        return;
      }
    }

    const supplierTransactions =
      JSON.parse(localStorage.getItem("supplierTransactions")) || {};
    if (!supplierTransactions[supplier]) {
      supplierTransactions[supplier] = [];
    }

    supplierTransactions[supplier].push({
      id: transactionId,
      date: returnDate,
      invoice: invoiceNo.trim(),
      supplier,
      type: "Purchase Return",
      amount: totals.total,
      paymentMethod: "Refund",
      paymentStatus: "Refund Pending",
      transactionStatus: "Completed",
      reason,
    });

    localStorage.setItem(
      "supplierTransactions",
      JSON.stringify(supplierTransactions)
    );

    const supplierBalances =
      JSON.parse(localStorage.getItem("supplierBalances")) || {};
    const currentBalance = Number(supplierBalances[supplier] || 0);
    supplierBalances[supplier] = Math.max(0, currentBalance - totals.total);

    localStorage.setItem("supplierBalances", JSON.stringify(supplierBalances));

    const financeTransactions =
      JSON.parse(localStorage.getItem("financeTransactions")) || [];
    financeTransactions.unshift({
      id: transactionId,
      date: returnDate,
      type: "Income",
      category: "Purchase Return",
      supplier,
      amount: totals.total,
      paymentMethod: "Refund",
      status: "Pending",
      reference: invoiceNo.trim(),
      reason,
    });

    localStorage.setItem(
      "financeTransactions",
      JSON.stringify(financeTransactions)
    );

    alert("Purchase return created successfully!\n\nInventory stock has been updated.");

    setSupplier("");
    setReturnNo("");
    setInvoiceNo("");
    setReason("");
    setNotes("");
    setReturnDate(new Date().toISOString().split("T")[0]);
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

  const inputStyle =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-800 sm:p-6 lg:p-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/purchase"
              className="mb-2 inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              ← Back to Purchase
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

              Purchase Return
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Return purchased products to the supplier.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Return Value
            </p>
            <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
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
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter supplier, invoice and return details.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Supplier" required>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Select Supplier</option>
                  <option value="Hindustan Distributors">Hindustan Distributors</option>
                  <option value="Gupta FMCG Suppliers">Gupta FMCG Suppliers</option>
                  <option value="Shree Grocery Traders">Shree Grocery Traders</option>
                  <option value="Daily Needs Wholesale">Daily Needs Wholesale</option>
                  <option value="Fresh Foods Supply">Fresh Foods Supply</option>
                </select>
              </FormField>

              <FormField label="Return Number">
                <input
                  type="text"
                  value={returnNo}
                  onChange={(e) => setReturnNo(e.target.value)}
                  placeholder="PR-001"
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Original Invoice Number" required>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="INV-001"
                  className={inputStyle}
                  required
                />
              </FormField>

              <FormField label="Return Date" required>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={inputStyle}
                  required
                />
              </FormField>

              <FormField label="Return Reason" required>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Select Reason</option>
                  <option value="Expired">Expired Product</option>
                  <option value="Damaged">Damaged Product</option>
                  <option value="Wrong Item">Wrong Item Received</option>
                  <option value="Leaking Package">Leaking Package</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Excess Stock">Excess Stock</option>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select the products you want to return.
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
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Purchase Price</th>
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
                          <select
                            value={item.product}
                            onChange={(e) =>
                              updateItem(item.id, "product", e.target.value)
                            }
                            className={`${inputStyle} min-w-[190px]`}
                            required
                          >
                            <option value="">Select Product</option>
                            {productOptions.map((product) => (
                              <option key={product} value={product}>
                                {product}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, "quantity", e.target.value)
                            }
                            className={`${inputStyle} w-24`}
                            required
                          />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min="0"
                            value={item.purchasePrice}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "purchasePrice",
                                e.target.value
                              )
                            }
                            className={`${inputStyle} w-32`}
                            required
                          />
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={item.gst}
                            onChange={(e) =>
                              updateItem(item.id, "gst", e.target.value)
                            }
                            className={`${inputStyle} w-24`}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                          ₹{calculated.amount.toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-slate-800 dark:text-slate-200">
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
                placeholder="Add additional information about this return..."
                className={`${inputStyle} resize-none`}
              />
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> Returned quantity should be verified
                  before completing the return.
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
                <SummaryRow
                  label="Total Items"
                  value={items.length}
                  currency={false}
                />

                <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      Total Return Value
                    </span>
                    <span className="rounded-xl bg-rose-50 px-4 py-2 text-2xl font-bold text-rose-500 dark:bg-rose-500/10">
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
                  className="flex-1 rounded-xl bg-rose-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  Submit Return
                </button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper Components
function FormField({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, currency = true }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">
        {currency ? `₹${value.toFixed(2)}` : value}
      </span>
    </div>
  );
}