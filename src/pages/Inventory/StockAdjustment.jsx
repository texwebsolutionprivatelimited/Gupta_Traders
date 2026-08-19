
import { useMemo, useState } from "react";
import {
    SlidersHorizontal,
    Save,
    Package,
    RotateCcw,
    AlertCircle,
    CheckCircle2,
    ArrowUp,
    ArrowDown,
} from "lucide-react";

const PRODUCTS = [
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
        stock: 5,
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

const REASONS = [
    { value: "physical-count", label: "Physical Count" },
    { value: "damage", label: "Damaged Stock" },
    { value: "loss", label: "Stock Loss" },
    { value: "correction", label: "Data Correction" },
    { value: "expired", label: "Expired Stock" },
    { value: "other", label: "Other" },
];

const getToday = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000)
        .toISOString()
        .split("T")[0];
};

export default function StockAdjustment() {
    const [formData, setFormData] = useState({
        productId: "",
        adjustmentType: "increase",
        quantity: "",
        reason: "",
        date: getToday(),
        notes: "",
    });

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const selectedProduct = useMemo(() => {
        return PRODUCTS.find(
            (product) => String(product.id) === String(formData.productId)
        );
    }, [formData.productId]);

    const adjustmentQuantity = Number(formData.quantity) || 0;

    const signedAdjustment =
        formData.adjustmentType === "increase"
            ? adjustmentQuantity
            : -adjustmentQuantity;

    const newStock = selectedProduct
        ? selectedProduct.stock + signedAdjustment
        : 0;

    const isInvalidStock =
        selectedProduct && newStock < 0;

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setMessage("");
        setMessageType("");
    };

    const resetForm = () => {
        setFormData({
            productId: "",
            adjustmentType: "increase",
            quantity: "",
            reason: "",
            date: getToday(),
            notes: "",
        });

        setMessage("");
        setMessageType("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.productId) {
            setMessage("Please select a product.");
            setMessageType("error");
            return;
        }

        if (!formData.quantity || adjustmentQuantity <= 0) {
            setMessage("Please enter a valid adjustment quantity.");
            setMessageType("error");
            return;
        }

        if (!formData.reason) {
            setMessage("Please select a reason for this adjustment.");
            setMessageType("error");
            return;
        }

        if (!formData.date) {
            setMessage("Please select an adjustment date.");
            setMessageType("error");
            return;
        }

        if (isInvalidStock) {
            setMessage(
                `Adjustment cannot be completed. Stock cannot go below 0 ${selectedProduct.unit}.`
            );
            setMessageType("error");
            return;
        }

        setIsSaving(true);

        setTimeout(() => {
            const adjustmentData = {
                productId: selectedProduct.id,
                product: selectedProduct.name,
                sku: selectedProduct.sku,
                currentStock: selectedProduct.stock,
                adjustmentType: formData.adjustmentType,
                quantity: adjustmentQuantity,
                adjustment: signedAdjustment,
                newStock,
                reason: formData.reason,
                date: formData.date,
                notes: formData.notes,
            };

            console.log("Stock Adjustment:", adjustmentData);

            setMessage(
                `Stock adjusted successfully. ${selectedProduct.name} is now ${newStock} ${selectedProduct.unit}.`
            );
            setMessageType("success");
            setIsSaving(false);

            setFormData((prev) => ({
                ...prev,
                quantity: "",
                reason: "",
                notes: "",
            }));
        }, 500);
    };

    return (
        <section className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
                    <SlidersHorizontal
                        size={24}
                        className="text-blue-600 dark:text-blue-400"
                    />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-slate-100 sm:text-2xl ">
                        Stock Adjustment
                    </h2>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Correct inventory quantities manually
                    </p>
                </div>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="p-4 sm:p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        {/* Product */}
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
                                    className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-4 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 "
                                >
                                    <option value="">Select product</option>

                                    {PRODUCTS.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} ({product.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedProduct && (
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    SKU: {selectedProduct.sku} · Current stock:{" "}
                                    <span className="font-semibold">
                                        {selectedProduct.stock} {selectedProduct.unit}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Adjustment Type */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Adjustment Type <span className="text-red-500">*</span>
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            adjustmentType: "increase",
                                        }))
                                    }
                                    className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${formData.adjustmentType === "increase"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <ArrowUp size={17} />
                                    Increase
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            adjustmentType: "decrease",
                                        }))
                                    }
                                    className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${formData.adjustmentType === "decrease"
                                        ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                                        : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <ArrowDown size={17} />
                                    Decrease
                                </button>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label
                                htmlFor="quantity"
                                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Adjustment Quantity <span className="text-red-500">*</span>
                            </label>

                            <input
                                id="quantity"
                                type="number"
                                name="quantity"
                                min="0"
                                step="any"
                                value={formData.quantity}
                                onChange={handleChange}
                                placeholder="Enter quantity"
                                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />
                        </div>

                        {/* Reason */}
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
                                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                <option value="">Select reason</option>

                                {REASONS.map((reason) => (
                                    <option key={reason.value} value={reason.value}>
                                        {reason.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label
                                htmlFor="date"
                                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Adjustment Date <span className="text-red-500">*</span>
                            </label>

                            <input
                                id="date"
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />
                        </div>

                        {/* Notes */}
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
                                maxLength={500}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Add additional information about this adjustment..."
                                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            />

                            <p className="mt-1 text-right text-xs text-slate-400">
                                {formData.notes.length}/500
                            </p>
                        </div>
                    </div>
                </div>


                {/* Stock Summary */}
                {selectedProduct && (
                    <div className="border-y border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:p-6">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Stock Summary
                            </h3>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Review the stock change before saving.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {/* Current */}
                            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-xs font-medium text-slate-500">
                                    Current Stock
                                </p>

                                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                    {selectedProduct.stock}{" "}
                                    <span className="text-sm font-medium">
                                        {selectedProduct.unit}
                                    </span>
                                </p>
                            </div>

                            {/* Adjustment */}
                            <div
                                className={`rounded-xl border p-4 ${formData.adjustmentType === "increase"
                                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                                        : "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
                                    }`}
                            >
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Adjustment
                                </p>

                                <p
                                    className={`mt-1 text-xl font-bold ${formData.adjustmentType === "increase"
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-red-600 dark:text-red-400"
                                        }`}
                                >
                                    {formData.adjustmentType === "increase" ? "+" : "-"}
                                    {adjustmentQuantity}{" "}
                                    <span className="text-sm font-medium">
                                        {selectedProduct.unit}
                                    </span>
                                </p>
                            </div>

                            {/* New Stock */}
                            <div
                                className={`rounded-xl border p-4 ${isInvalidStock
                                        ? "border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
                                        : "border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
                                    }`}
                            >
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    New Stock
                                </p>

                                <p
                                    className={`mt-1 text-xl font-bold ${isInvalidStock
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-blue-600 dark:text-blue-400"
                                        }`}
                                >
                                    {newStock}{" "}
                                    <span className="text-sm font-medium">
                                        {selectedProduct.unit}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {isInvalidStock && (
                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />

                                <span>
                                    You cannot decrease stock below zero. Current stock is{" "}
                                    <strong>
                                        {selectedProduct.stock} {selectedProduct.unit}
                                    </strong>
                                    .
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Message */}
                {message && (
                    <div
                        className={`mx-4 mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm sm:mx-6 ${messageType === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                            }`}
                    >
                        {messageType === "success" ? (
                            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                        ) : (
                            <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        )}

                        <span>{message}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:justify-end sm:p-6">
                    <button
                        type="button"
                        onClick={resetForm}
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
                    >
                        <RotateCcw size={17} />
                        Reset
                    </button>

                    <button
                        type="submit"
                        disabled={isSaving || !selectedProduct || isInvalidStock}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        <Save size={18} />

                        {isSaving ? "Saving..." : "Save Adjustment"}
                    </button>
                </div>
            </form>
        </section>
    );
}


