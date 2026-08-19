
import { useMemo, useState } from "react";
import {
  ArrowUpFromLine,
  Save,
  Package,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  CalendarDays,
} from "lucide-react";

/* =========================================================
   DEMO PRODUCT DATA
   Later you can replace this with API/database data.
   ========================================================= */
const products = [
  {
    id: 1,
    name: "Basmati Rice",
    sku: "RICE-001",
    stock: 85,
    unit: "kg",
  },
  {
    id: 2,
    name: "Toor Dal",
    sku: "DAL-001",
    stock: 12,
    unit: "kg",
  },
  {
    id: 3,
    name: "Wheat Flour",
    sku: "FLOUR-001",
    stock: 0,
    unit: "kg",
  },
  {
    id: 4,
    name: "Cooking Oil",
    sku: "OIL-001",
    stock: 42,
    unit: "ltr",
  },
  {
    id: 5,
    name: "Sugar",
    sku: "SUGAR-001",
    stock: 8,
    unit: "kg",
  },
  {
    id: 6,
    name: "Salt",
    sku: "SALT-001",
    stock: 32,
    unit: "kg",
  },
  {
    id: 7,
    name: "Tea",
    sku: "TEA-001",
    stock: 6,
    unit: "packs",
  },
];

/* =========================================================
   INITIAL FORM
   ========================================================= */
const getInitialForm = () => ({
  productId: "",
  quantity: "",
  reason: "",
  date: new Date().toISOString().split("T")[0],
  reference: "",
  notes: "",
});

/* =========================================================
   COMPONENT
   ========================================================= */
export default function StockOut() {
  const [formData, setFormData] = useState(getInitialForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* =======================================================
     SELECTED PRODUCT
     ======================================================= */
  const selectedProduct = useMemo(() => {
    return products.find(
      (product) => String(product.id) === String(formData.productId)
    );
  }, [formData.productId]);

  /* =======================================================
     HANDLE INPUT CHANGE
     ======================================================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setMessage("");
    setMessageType("");

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =======================================================
     RESET FORM
     ======================================================= */
  const handleReset = () => {
    setFormData(getInitialForm());
    setMessage("");
    setMessageType("");
  };

  /* =======================================================
     SUBMIT
     ======================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    /* Product validation */
    if (!formData.productId) {
      setMessage("Please select a product.");
      setMessageType("error");
      return;
    }

    /* Quantity validation */
    const quantity = Number(formData.quantity);

    if (!formData.quantity || Number.isNaN(quantity) || quantity <= 0) {
      setMessage("Please enter a valid quantity greater than 0.");
      setMessageType("error");
      return;
    }

    /* Product stock validation */
    if (selectedProduct && quantity > selectedProduct.stock) {
      setMessage(
        `Insufficient stock. Available stock is ${selectedProduct.stock} ${selectedProduct.unit}.`
      );
      setMessageType("error");
      return;
    }

    /* Reason validation */
    if (!formData.reason) {
      setMessage("Please select a reason for stock out.");
      setMessageType("error");
      return;
    }

    try {
      setIsSubmitting(true);

      /*
       * API integration can be added here.
       *
       * Example:
       *
       * await fetch("/api/inventory/stock-out", {
       *   method: "POST",
       *   headers: {
       *     "Content-Type": "application/json",
       *   },
       *   body: JSON.stringify({
       *     ...formData,
       *     quantity,
       *   }),
       * });
       */

      const stockOutData = {
        productId: formData.productId,
        productName: selectedProduct?.name,
        sku: selectedProduct?.sku,
        quantity,
        unit: selectedProduct?.unit,
        reason: formData.reason,
        date: formData.date,
        reference: formData.reference.trim(),
        notes: formData.notes.trim(),
      };

      console.log("Stock Out:", stockOutData);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setMessage("Stock Out recorded successfully.");
      setMessageType("success");

      setFormData(getInitialForm());
    } catch (error) {
      console.error("Stock Out Error:", error);

      setMessage(
        "Something went wrong while recording stock out. Please try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
     MESSAGE STYLES
     ======================================================= */
  const messageStyles =
    messageType === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
      : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";

  /* =======================================================
     UI
     ======================================================= */
  return (
    <section className="space-y-6">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 sm:h-12 sm:w-12">
          <ArrowUpFromLine
            size={18}
            className="text-red-500 sm:size-24"
          />
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-bold sm:text-2xl text-slate-100">
            Stock Out
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Record outgoing stock from your inventory
          </p>
        </div>
      </div>

      {/* =====================================================
          STOCK WARNING
          ===================================================== */}
      {selectedProduct && (
        <div
          className={`rounded-2xl border p-4 ${
            selectedProduct.stock === 0
              ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
              : "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className={
                selectedProduct.stock === 0
                  ? "mt-0.5 shrink-0 text-red-500"
                  : "mt-0.5 shrink-0 text-amber-500"
              }
            />

            <div className="min-w-0">
              <p
                className={`font-semibold ${
                  selectedProduct.stock === 0
                    ? "text-red-700 dark:text-red-400"
                    : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {selectedProduct.name}
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Current available stock:{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          FORM
          ===================================================== */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7"
      >
        <div className="grid gap-5 md:grid-cols-2">
          {/* =================================================
              PRODUCT
              ================================================= */}
          <div>
            <label
              htmlFor="productId"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Product <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Package
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="">Select product</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.sku}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =================================================
              QUANTITY
              ================================================= */}
          <div>
            <label
              htmlFor="quantity"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Quantity <span className="text-red-500">*</span>
            </label>

            <input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
              disabled={!selectedProduct || selectedProduct.stock === 0}
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />

            {selectedProduct && (
              <p className="mt-1.5 text-xs text-slate-500">
                Maximum available: {selectedProduct.stock}{" "}
                {selectedProduct.unit}
              </p>
            )}
          </div>

          {/* =================================================
              REASON
              ================================================= */}
          <div>
            <label
              htmlFor="reason"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Reason <span className="text-red-500">*</span>
            </label>

            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="">Select reason</option>
              <option value="sale">Sale</option>
              <option value="damaged">Damaged Stock</option>
              <option value="expired">Expired Stock</option>
              <option value="customer-return">
                Customer Return
              </option>
              <option value="internal-use">Internal Use</option>
              <option value="transfer">Stock Transfer</option>
              <option value="loss">Stock Loss</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* =================================================
              DATE
              ================================================= */}
          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Date <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>
          </div>

          {/* =================================================
              REFERENCE
              ================================================= */}
          <div className="md:col-span-2">
            <label
              htmlFor="reference"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Reference / Invoice No.
            </label>

            <div className="relative">
              <FileText
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="reference"
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Enter invoice, order or reference number"
                maxLength={100}
                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>
          </div>

          {/* =================================================
              NOTES
              ================================================= */}
          <div className="md:col-span-2">
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              maxLength={500}
              placeholder="Add any additional information..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {formData.notes.length}/500
            </p>
          </div>
        </div>

        {/* ===================================================
            MESSAGE
            =================================================== */}
        {message && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${messageStyles}`}
          >
            {messageType === "success" ? (
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <XCircle
                size={19}
                className="mt-0.5 shrink-0"
              />
            )}

            <p>{message}</p>
          </div>
        )}

        {/* ===================================================
            ACTIONS
            =================================================== */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedProduct ||
              selectedProduct.stock === 0
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Save size={18} />

            {isSubmitting ? "Saving..." : "Save Stock Out"}
          </button>
        </div>
      </form>
    </section>
  );
}

