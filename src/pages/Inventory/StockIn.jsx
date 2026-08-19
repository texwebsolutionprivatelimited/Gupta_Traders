
import { useState } from "react";
import {
    ArrowDownToLine,
    Save,
    Package,
    Truck,
    CalendarDays,
    FileText,
    IndianRupee,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

const PRODUCTS = [
    { id: 1, name: "Basmati Rice", sku: "RICE-001", unit: "kg" },
    { id: 2, name: "Toor Dal", sku: "DAL-001", unit: "kg" },
    { id: 3, name: "Wheat Flour", sku: "FLOUR-001", unit: "kg" },
    { id: 4, name: "Cooking Oil", sku: "OIL-001", unit: "ltr" },
    { id: 5, name: "Sugar", sku: "SUGAR-001", unit: "kg" },
    { id: 6, name: "Salt", sku: "SALT-001", unit: "kg" },
    { id: 7, name: "Tea", sku: "TEA-001", unit: "pack" },
];

const SUPPLIERS = [
    "Sharma Traders",
    "Gupta Suppliers",
    "ABC Wholesale",
    "Raj Enterprises",
];

const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
};

const initialForm = {
    product: "",
    quantity: "",
    unit: "",
    supplier: "",
    purchasePrice: "",
    date: getToday(),
    reference: "",
    notes: "",
};

export default function StockIn() {
    const [formData, setFormData] = useState(initialForm);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const selectedProduct = PRODUCTS.find(
        (product) => String(product.id) === formData.product
    );

    const totalValue =
        Number(formData.quantity || 0) *
        Number(formData.purchasePrice || 0);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (message) {
            setMessage("");
            setMessageType("");
        }

        // Automatically set unit according to selected product
        if (name === "product") {
            const product = PRODUCTS.find(
                (item) => String(item.id) === value
            );

            setFormData((prev) => ({
                ...prev,
                product: value,
                unit: product?.unit || "",
            }));
        }
    };

    const validateForm = () => {
        if (!formData.product) {
            return "Please select a product.";
        }

        if (
            !formData.quantity ||
            Number(formData.quantity) <= 0
        ) {
            return "Please enter a valid quantity.";
        }

        if (!formData.unit) {
            return "Please select a unit.";
        }

        if (!formData.supplier.trim()) {
            return "Please enter or select a supplier.";
        }

        if (
            formData.purchasePrice !== "" &&
            Number(formData.purchasePrice) < 0
        ) {
            return "Purchase price cannot be negative.";
        }

        if (!formData.date) {
            return "Please select a date.";
        }

        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateForm();

        if (error) {
            setMessage(error);
            setMessageType("error");
            return;
        }

        setIsSaving(true);

        // Simulating save operation
        await new Promise((resolve) =>
            setTimeout(resolve, 500)
        );

        const stockInData = {
            ...formData,
            productName: selectedProduct?.name || "",
            sku: selectedProduct?.sku || "",
            quantity: Number(formData.quantity),
            purchasePrice: Number(formData.purchasePrice || 0),
            totalValue,
        };

        console.log("Stock In:", stockInData);

        setIsSaving(false);
        setMessage("Stock In recorded successfully.");
        setMessageType("success");

        setFormData({
            ...initialForm,
            date: getToday(),
        });
    };

    const handleReset = () => {
        setFormData({
            ...initialForm,
            date: getToday(),
        });

        setMessage("");
        setMessageType("");
    };

    return (
        <section className="w-full space-y-6">
            {/* =====================================================
          HEADER
      ===================================================== */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 sm:h-12 sm:w-12">
                        <ArrowDownToLine
                            size={23}
                            className="text-emerald-500"
                        />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-xl font-bold sm:text-2xl text-slate-900 dark:text-slate-100">
                            Stock In
                        </h2>

                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            Record incoming stock and purchase details
                        </p>
                    </div>
                </div>

                <div className="hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 sm:block">
                    Incoming Inventory
                </div>
            </div>

            {/* =====================================================
          FORM
      ===================================================== */}
            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* PRODUCT */}
                    <div>
                        <label
                            htmlFor="product"
                            className="mb-2 block text-sm font-medium text-slate-50"
                        >
                            Product <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <Package
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                                id="product"
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                <option value="">
                                    Select product
                                </option>

                                {PRODUCTS.map((product) => (
                                    <option
                                        key={product.id}
                                        value={product.id}
                                    >
                                        {product.name} ({product.sku})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedProduct && (
                            <p className="mt-2 text-xs text-slate-500">
                                SKU: {selectedProduct.sku}
                            </p>
                        )}
                    </div>

                    {/* QUANTITY */}
                    <div>
                        <label
                            htmlFor="quantity"
                            className="mb-2 block text-sm font-medium text-slate-50"
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
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        />
                    </div>

                    {/* UNIT */}
                    <div>
                        <label
                            htmlFor="unit"
                            className="mb-2 block text-sm font-medium text-slate-50"
                        >
                            Unit <span className="text-red-500">*</span>
                        </label>

                        <select
                            id="unit"
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <option value="">
                                Select unit
                            </option>
                            <option value="pcs">Pieces</option>
                            <option value="kg">Kilogram</option>
                            <option value="g">Gram</option>
                            <option value="ltr">Liter</option>
                            <option value="ml">Milliliter</option>
                            <option value="box">Box</option>
                            <option value="pack">Pack</option>
                        </select>
                    </div>

                    {/* SUPPLIER */}
                    <div>
                        <label
                            htmlFor="supplier"
                            className="mb-2 block text-sm font-medium text-slate-50"
                        >
                            Supplier <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <Truck
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="supplier"
                                type="text"
                                name="supplier"
                                list="supplier-list"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="Enter supplier name"
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />

                            <datalist id="supplier-list">
                                {SUPPLIERS.map((supplier) => (
                                    <option
                                        key={supplier}
                                        value={supplier}
                                    />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {/* PURCHASE PRICE */}
                    <div>
                        <label
                            htmlFor="purchasePrice"
                            className="mb-2 block text-sm font-medium text-slate-50"
                        >
                            Purchase Price
                        </label>

                        <div className="relative">
                            <IndianRupee
                                size={17}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                id="purchasePrice"
                                type="number"
                                min="0"
                                step="0.01"
                                name="purchasePrice"
                                value={formData.purchasePrice}
                                onChange={handleChange}
                                placeholder="Price per unit"
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* DATE */}
                    <div>
                        <label
                            htmlFor="date"
                            className="mb-2 block text-sm font-medium text-slate-50"
                        >
                            Stock In Date <span className="text-red-500">*</span>
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
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* REFERENCE */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="reference"
                            className="mb-2 block text-sm font-medium text-slate-50"
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
                                placeholder="Enter invoice or reference number"
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* NOTES */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="notes"
                            className="mb-2 block text-sm font-medium text-slate-50"
                        >
                            Notes
                        </label>

                        <textarea
                            id="notes"
                            name="notes"
                            rows={4}
                            maxLength={500}
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Add additional notes..."
                            className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        />

                        <p className="mt-1 text-right text-xs text-slate-400">
                            {formData.notes.length}/500
                        </p>
                    </div>
                </div>

                {/* TOTAL */}
                {formData.quantity &&
                    formData.purchasePrice && (
                        <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    Estimated Stock Value
                                </p>

                                <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                                    Quantity × Purchase Price
                                </p>
                            </div>

                            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                ₹{totalValue.toLocaleString("en-IN")}
                            </p>
                        </div>
                    )}

                {/* MESSAGE */}
                {message && (
                    <div
                        className={`mt-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${messageType === "success"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                    >
                        {messageType === "success" ? (
                            <CheckCircle2
                                size={18}
                                className="mt-0.5 shrink-0"
                            />
                        ) : (
                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />
                        )}

                        <span>{message}</span>
                    </div>
                )}

                {/* ACTIONS */}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800 sm:w-auto"
                    >
                        <RotateCcw size={17} />
                        Reset
                    </button>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                        <Save
                            size={18}
                            className={isSaving ? "animate-pulse" : ""}
                        />

                        {isSaving ? "Saving..." : "Save Stock In"}
                    </button>
                </div>
            </form>
        </section>
    );
}

