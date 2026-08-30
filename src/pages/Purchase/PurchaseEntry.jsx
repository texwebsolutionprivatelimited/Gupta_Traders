import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Edit3, Trash2 } from "lucide-react";
import SearchableSelect from "../../components/SearchableSelect";
import { completePurchase, listUISuppliers, listUIProducts } from '../../services/erpService'

const initialItems = [
  {
    id: 1,
    product: "",
    quantity: 1,
    purchasePrice: 0,
    gst: 18,
  },
];

const productPrices = {
  "Aashirvaad Atta": 310,
  "Fortune Rice": 1050,
  "Tata Salt": 20,
  "Amul Milk": 52,
  "Parle-G Biscuit": 8,
  "Maggi Noodles": 12,
  "Fortune Oil": 160,
  Sugar: 38,
  "Tea Powder": 210,
  "Surf Excel": 100,
};

export default function PurchaseEntry() {
  const navigate = useNavigate();
  const [billNo, setBillNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [supplier, setSupplier] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [utrNo, setUtrNo] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState(initialItems);
  const [remoteProducts,setRemoteProducts]=useState([]),[remoteSuppliers,setRemoteSuppliers]=useState([])
  useEffect(()=>{Promise.all([listUIProducts(),listUISuppliers()]).then(([p,s])=>{setRemoteProducts(p);setRemoteSuppliers(s)}).catch(e=>alert(e.message))},[])

  // Selected item state for view/edit modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        product: "",
        quantity: 1,
        purchasePrice: 0,
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
            purchasePrice: productPrices[value] || 0,
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
    const amount = item.quantity * item.purchasePrice;
    const gstAmount = (amount * item.gst) / 100;

    return {
      amount,
      gstAmount,
      total: amount + gstAmount,
    };
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveModalEdit = () => {
    updateItem(selectedItem.id, "product", selectedItem.product);
    updateItem(selectedItem.id, "quantity", selectedItem.quantity);
    updateItem(selectedItem.id, "purchasePrice", selectedItem.purchasePrice);
    updateItem(selectedItem.id, "gst", selectedItem.gst);
    setIsEditModalOpen(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplier) {
      alert("Please select supplier.");
      return;
    }

    const hasInvalidProduct = items.some(
      (item) => !item.product || item.quantity <= 0
    );

    if (hasInvalidProduct) {
      alert("Please enter valid product details.");
      return;
    }

    try{const supplierRow=remoteSuppliers.find(s=>s.companyName===supplier||s.id===supplier);if(!supplierRow)throw new Error('Select a valid supplier');const rpcItems=items.map(item=>{const p=remoteProducts.find(x=>x.name===item.product||x.id===item.product);if(!p)throw new Error(`Product not found: ${item.product}`);return{product_id:p.id,quantity:Number(item.quantity),unit_price:Number(item.purchasePrice),tax_rate:Number(item.gst)}});await completePurchase({supplier_id:supplierRow.id,supplier_invoice_number:billNo||null,purchase_date:purchaseDate,amount_paid:paymentMode==='Credit'?0:totals.total,payment_method:paymentMode,payment_reference:utrNo,notes},rpcItems);alert('Purchase saved successfully!');navigate('/purchase/history')}catch(error){alert(error.message)}
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Purchase Entry
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Create a new purchase bill and update stock inventory.
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

        <form onSubmit={handleSubmit}>
          {/* Purchase Information */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Purchase Information
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter supplier and bill details.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Supplier" required>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Supplier</option>
                  <option value="Mahavir Traders">Mahavir Traders</option>
                  <option value="National Wholesalers">National Wholesalers</option>
                  <option value="Apex Distributors">Apex Distributors</option>
                  <option value="Shree Kirana Suppliers">Shree Kirana Suppliers</option>
                </select>
              </FormField>

              <FormField label="Invoice Number">
                <input
                  type="text"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  placeholder="INV-001"
                  className="input-field"
                />
              </FormField>

              <FormField label="Purchase Date" required>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
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

              {/* Dynamic UTR / Ref Field */}
              {["UPI", "Bank Transfer", "Cheque"].includes(paymentMode) && (
                <FormField label={paymentMode === "Cheque" ? "Cheque / Ref No." : "UTR / Transaction ID"}>
                  <input
                    type="text"
                    value={utrNo}
                    onChange={(e) => setUtrNo(e.target.value)}
                    placeholder={paymentMode === "Cheque" ? "e.g. 000123" : "e.g. 123456789012"}
                    className="input-field"
                  />
                </FormField>
              )}
            </div>
          </section>

          {/* Products Table */}
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Purchase Items
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add products included in this purchase bill.
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
                    <th className="px-5 py-4">Purchase Price</th>
                    <th className="px-5 py-4">GST %</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">GST Amount</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4 text-center">Action</th>
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
                            value={item.purchasePrice}
                            onChange={(e) =>
                              updateItem(item.id, "purchasePrice", e.target.value)
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

                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleView(item)}
                              title="View Details"
                              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              title="Edit Item"
                              className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/40"
                            >
                              <Edit3 size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              disabled={items.length === 1}
                              title="Delete Item"
                              className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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
                placeholder="Add purchase notes..."
                className="input-field resize-none"
              />
            </section>

            {/* Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
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
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedItem && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
              Item Details
            </h3>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>Product:</strong> {selectedItem.product || "N/A"}
              </p>
              <p>
                <strong>Quantity:</strong> {selectedItem.quantity}
              </p>
              <p>
                <strong>Purchase Price:</strong> ₹{selectedItem.purchasePrice}
              </p>
              <p>
                <strong>GST Rate:</strong> {selectedItem.gst}%
              </p>
              <p>
                <strong>Amount:</strong> ₹
                {calculateItem(selectedItem).amount.toFixed(2)}
              </p>
              <p>
                <strong>GST Amount:</strong> ₹
                {calculateItem(selectedItem).gstAmount.toFixed(2)}
              </p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                <strong>Total:</strong> ₹
                {calculateItem(selectedItem).total.toFixed(2)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="mt-6 w-full rounded-xl bg-slate-800 py-2.5 font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
              Edit Item Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Product</label>
                <SearchableSelect
                  value={selectedItem.product}
                  onChange={(val) =>
                    setSelectedItem((prev) => ({
                      ...prev,
                      product: val,
                      purchasePrice: productPrices[val] || prev.purchasePrice,
                    }))
                  }
                  options={Object.keys(productPrices)}
                  placeholder="Select Product"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={selectedItem.quantity}
                  onChange={(e) =>
                    setSelectedItem((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value),
                    }))
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Purchase Price</label>
                <input
                  type="number"
                  min="0"
                  value={selectedItem.purchasePrice}
                  onChange={(e) =>
                    setSelectedItem((prev) => ({
                      ...prev,
                      purchasePrice: Number(e.target.value),
                    }))
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">GST %</label>
                <select
                  value={selectedItem.gst}
                  onChange={(e) =>
                    setSelectedItem((prev) => ({
                      ...prev,
                      gst: Number(e.target.value),
                    }))
                  }
                  className="input-field"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalEdit}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
