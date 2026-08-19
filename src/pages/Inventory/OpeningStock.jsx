import { useMemo, useState } from "react";
import {
  Box,
  Save,
  Package,
  CalendarDays,
  FileText,
  RotateCcw,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";

/* =========================================================
   DEMO PRODUCTS
   Later these can come from your API/database
========================================================= */

const products = [
  {
    id: 1,
    name: "Basmati Rice",
    sku: "RICE-001",
    category: "Rice",
    stock: 85,
    unit: "kg",
  },
  {
    id: 2,
    name: "Toor Dal",
    sku: "DAL-001",
    category: "Pulses",
    stock: 12,
    unit: "kg",
  },
  {
    id: 3,
    name: "Wheat Flour",
    sku: "FLOUR-001",
    category: "Flour",
    stock: 5,
    unit: "kg",
  },
  {
    id: 4,
    name: "Cooking Oil",
    sku: "OIL-001",
    category: "Oil",
    stock: 42,
    unit: "ltr",
  },
  {
    id: 5,
    name: "Sugar",
    sku: "SUGAR-001",
    category: "Sugar",
    stock: 8,
    unit: "kg",
  },
  {
    id: 6,
    name: "Salt",
    sku: "SALT-001",
    category: "Grocery",
    stock: 32,
    unit: "kg",
  },
  {
    id: 7,
    name: "Tea",
    sku: "TEA-001",
    category: "Beverages",
    stock: 6,
    unit: "packs",
  },
];

/* =========================================================
   INITIAL ENTRIES
========================================================= */

const initialEntries = [
  {
    id: 101,
    productId: 1,
    productName: "Basmati Rice",
    sku: "RICE-001",
    quantity: 50,
    unit: "kg",
    date: "2026-08-14",
    notes: "Initial warehouse stock",
  },
  {
    id: 102,
    productId: 2,
    productName: "Toor Dal",
    sku: "DAL-001",
    quantity: 25,
    unit: "kg",
    date: "2026-08-13",
    notes: "Opening stock entry",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function OpeningStock() {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    date: getToday(),
    notes: "",
  });

  const [entries, setEntries] = useState(initialEntries);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  /* =========================================================
     SELECTED PRODUCT
  ========================================================= */

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        String(product.id) === String(formData.productId)
    );
  }, [formData.productId]);

  /* =========================================================
     FILTER ENTRIES
  ========================================================= */

  const filteredEntries = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return entries;

    return entries.filter(
      (entry) =>
        entry.productName.toLowerCase().includes(value) ||
        entry.sku.toLowerCase().includes(value) ||
        entry.notes.toLowerCase().includes(value)
    );
  }, [entries, search]);

  /* =========================================================
     HANDLE CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (message.text) {
      setMessage({
        type: "",
        text: "",
      });
    }
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setFormData({
      productId: "",
      quantity: "",
      date: getToday(),
      notes: "",
    });

    setEditingId(null);

    setMessage({
      type: "",
      text: "",
    });
  };

  /* =========================================================
     SAVE / UPDATE
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    if (!formData.productId) {
      setMessage({
        type: "error",
        text: "Please select a product.",
      });
      return;
    }

    if (
      formData.quantity === "" ||
      Number(formData.quantity) <= 0
    ) {
      setMessage({
        type: "error",
        text: "Please enter a quantity greater than 0.",
      });
      return;
    }

    if (!formData.date) {
      setMessage({
        type: "error",
        text: "Please select an opening date.",
      });
      return;
    }

    if (!selectedProduct) {
      setMessage({
        type: "error",
        text: "Selected product could not be found.",
      });
      return;
    }

    setIsSaving(true);

    /* Simulate save operation */
    await new Promise((resolve) =>
      setTimeout(resolve, 400)
    );

    if (editingId) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                sku: selectedProduct.sku,
                quantity: Number(formData.quantity),
                unit: selectedProduct.unit,
                date: formData.date,
                notes: formData.notes.trim(),
              }
            : entry
        )
      );

      setMessage({
        type: "success",
        text: "Opening stock updated successfully.",
      });
    } else {
      const newEntry = {
        id: Date.now(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: Number(formData.quantity),
        unit: selectedProduct.unit,
        date: formData.date,
        notes: formData.notes.trim(),
      };

      setEntries((prev) => [newEntry, ...prev]);

      setMessage({
        type: "success",
        text: "Opening stock saved successfully.",
      });
    }

    setIsSaving(false);

    setFormData({
      productId: "",
      quantity: "",
      date: getToday(),
      notes: "",
    });

    setEditingId(null);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (entry) => {
    setFormData({
      productId: String(entry.productId),
      quantity: String(entry.quantity),
      date: entry.date,
      notes: entry.notes,
    });

    setEditingId(entry.id);

    setMessage({
      type: "",
      text: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this opening stock entry?"
    );

    if (!confirmed) return;

    setEntries((prev) =>
      prev.filter((entry) => entry.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }

    setMessage({
      type: "success",
      text: "Opening stock entry deleted.",
    });
  };

  /* =========================================================
     NEW ENTRY
  ========================================================= */

  const handleNewEntry = () => {
    resetForm();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 sm:h-12 sm:w-12">
            <Box
              size={23}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
              Opening Stock
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Set initial stock quantity for your products
            </p>
          </div>
        </div>

        {editingId && (
          <button
            type="button"
            onClick={handleNewEntry}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
          >
            <X size={17} />
            Cancel Edit
          </button>
        )}
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        {/* Form title */}

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10">
            <Package
              size={18}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {editingId
                ? "Edit Opening Stock"
                : "Add Opening Stock"}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the initial quantity of a product
            </p>
          </div>
        </div>

        {/* Fields */}

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Product */}

          <div>
            <label
              htmlFor="productId"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Product
              <span className="ml-1 text-red-500">*</span>
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
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="">
                  Select product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — {product.sku}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity */}

          <div>
            <label
              htmlFor="quantity"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Opening Quantity
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Date */}

          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Opening Date
              <span className="ml-1 text-red-500">*</span>
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
                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Notes */}

          <div>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Notes
            </label>

            <div className="relative">
              <FileText
                size={18}
                className="pointer-events-none absolute left-3 top-3.5 text-slate-400"
              />

              <textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={250}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add notes..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Selected Product Preview */}

        {selectedProduct && (
          <div className="mt-5 rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-500/20 dark:bg-purple-500/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  Selected Product
                </p>

                <h4 className="mt-1 font-semibold text-slate-900 dark:text-slate-300">
                  {selectedProduct.name}
                </h4>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {selectedProduct.sku} •{" "}
                  {selectedProduct.category}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                  <p className="text-[11px] text-slate-500">
                    Current Stock
                  </p>

                  <p className="mt-1 font-bold text-slate-900 dark:text-slate-300">
                    {selectedProduct.stock}{" "}
                    {selectedProduct.unit}
                  </p>
                </div>

                <div className="rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
                  <p className="text-[11px] text-slate-500">
                    After Entry
                  </p>

                  <p className="mt-1 font-bold text-purple-600 dark:text-purple-400">
                    {(
                      selectedProduct.stock +
                      Number(formData.quantity || 0)
                    ).toFixed(
                      Number(formData.quantity) % 1 === 0
                        ? 0
                        : 2
                    )}{" "}
                    {selectedProduct.unit}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}

        {message.text && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {message.type === "success" ? (
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

            <span>{message.text}</span>
          </div>
        )}

        {/* Buttons */}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetForm}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Save size={17} />

            {isSaving
              ? "Saving..."
              : editingId
              ? "Update Opening Stock"
              : "Save Opening Stock"}
          </button>
        </div>
      </form>

      {/* =====================================================
          RECENT ENTRIES
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-300">
              Recent Opening Stock
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage recently added opening stock entries
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search entries..."
              className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>
        </div>

        {/* Desktop Table */}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-slate-200 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-300">
                        {entry.productName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {entry.sku}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {entry.quantity}{" "}
                      {entry.unit}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {formatDate(entry.date)}
                  </td>

                  <td className="max-w-[220px] px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <p className="truncate">
                      {entry.notes || "-"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(entry)
                        }
                        title="Edit"
                        className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(entry.id)
                        }
                        title="Delete"
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}

        <div className="grid gap-3 p-4 md:hidden">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate font-semibold text-slate-900 dark:text-slate-300">
                    {entry.productName}
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    {entry.sku}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {entry.quantity} {entry.unit}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
                  <p className="text-[11px] text-slate-500">
                    Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-300">
                    {formatDate(entry.date)}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 dark:bg-slate-900">
                  <p className="text-[11px] text-slate-500">
                    Notes
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-300">
                    {entry.notes || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleEdit(entry)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 py-2.5 text-sm font-medium text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(entry.id)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}

        {filteredEntries.length === 0 && (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Package
                size={25}
                className="text-slate-400"
              />
            </div>

            <h4 className="mt-4 font-semibold text-slate-900 dark:text-white">
              No opening stock entries found
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or add a new opening stock entry.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}