
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Package,
  Search,
  XCircle,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  X,
  Plus,
  Minus,
} from "lucide-react";

const initialProducts = [
  {
    id: 1,
    name: "Toor Dal",
    sku: "DAL-001",
    category: "Pulses",
    stock: 12,
    minStock: 20,
    unit: "kg",
  },
  {
    id: 2,
    name: "Wheat Flour",
    sku: "FLOUR-001",
    category: "Flour",
    stock: 5,
    minStock: 15,
    unit: "kg",
  },
  {
    id: 3,
    name: "Sugar",
    sku: "SUGAR-001",
    category: "Sugar",
    stock: 8,
    minStock: 15,
    unit: "kg",
  },
  {
    id: 4,
    name: "Tea",
    sku: "TEA-001",
    category: "Beverages",
    stock: 4,
    minStock: 10,
    unit: "packs",
  },
  {
    id: 5,
    name: "Cooking Oil",
    sku: "OIL-001",
    category: "Oil",
    stock: 0,
    minStock: 15,
    unit: "ltr",
  },
];

export default function LowStockAlert() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(1);

  const getSeverity = (product) => {
    if (product.stock <= 0) {
      return "out";
    }

    if (product.stock <= product.minStock * 0.5) {
      return "critical";
    }

    return "low";
  };

  const getSeverityData = (product) => {
    const severity = getSeverity(product);

    if (severity === "out") {
      return {
        label: "Out of Stock",
        shortLabel: "Out",
        icon: XCircle,
        badge:
          "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
        progress: "bg-red-500",
      };
    }

    if (severity === "critical") {
      return {
        label: "Critical",
        shortLabel: "Critical",
        icon: AlertTriangle,
        badge:
          "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
        progress: "bg-orange-500",
      };
    }

    return {
      label: "Low Stock",
      shortLabel: "Low",
      icon: AlertTriangle,
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      progress: "bg-amber-500",
    };
  };

  const filteredProducts = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.sku.toLowerCase().includes(searchValue) ||
        product.category.toLowerCase().includes(searchValue);

      const severity = getSeverity(product);

      const matchesFilter =
        filter === "all" ||
        (filter === "out" && severity === "out") ||
        (filter === "critical" && severity === "critical") ||
        (filter === "low" && severity === "low");

      return matchesSearch && matchesFilter;
    });
  }, [products, search, filter]);

  const totalAlerts = products.length;

  const criticalCount = products.filter(
    (product) => getSeverity(product) === "critical"
  ).length;

  const outOfStockCount = products.filter(
    (product) => getSeverity(product) === "out"
  ).length;

  const lowStockCount = products.filter(
    (product) => getSeverity(product) === "low"
  ).length;

  const openRestockModal = (product) => {
    setSelectedProduct(product);

    const suggestedQuantity = Math.max(
      product.minStock * 2 - product.stock,
      1
    );

    setRestockQuantity(suggestedQuantity);
    setShowRestockModal(true);
  };

  const closeRestockModal = () => {
    setShowRestockModal(false);
    setSelectedProduct(null);
    setRestockQuantity(1);
  };

  const handleRestock = () => {
    if (!selectedProduct) return;

    const quantity = Number(restockQuantity);

    if (!quantity || quantity <= 0) return;

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === selectedProduct.id
          ? {
              ...product,
              stock: product.stock + quantity,
            }
          : product
      )
    );

    closeRestockModal();
  };

  return (
    <section className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 sm:h-12 sm:w-12">
            <AlertTriangle
              size={23}
              className="text-amber-500 sm:size-6"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
              Low Stock Alert
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Monitor products that need immediate restocking
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setFilter("all");
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
        >
          <RefreshCw size={16} />
          Reset Filters
        </button>
      </div>

      {/* SUMMARY CARDS */}
      

      {/* SEARCH + FILTER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU or category..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
            {[
              { key: "all", label: "All" },
              { key: "critical", label: "Critical" },
              { key: "low", label: "Low Stock" },
              { key: "out", label: "Out of Stock" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  filter === item.key
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const severity = getSeverityData(product);
            const SeverityIcon = severity.icon;

            const percentage =
              product.minStock > 0
                ? Math.min(
                    (product.stock / product.minStock) * 100,
                    100
                  )
                : 0;

            return (
              <div
                key={product.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5"
              >
                {/* CARD HEADER */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${severity.iconBg}`}
                    >
                      <Package
                        size={21}
                        className={severity.iconColor}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900 dark:text-slate-300">
                        {product.name}
                      </h3>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {product.sku} • {product.category}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${severity.badge}`}
                  >
                    <SeverityIcon size={12} />
                    {severity.shortLabel}
                  </span>
                </div>

                {/* STOCK INFO */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-xs text-slate-500">
                      Current Stock
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        product.stock <= 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {product.stock}{" "}
                      <span className="text-xs font-medium">
                        {product.unit}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-xs text-slate-500">
                      Minimum Stock
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {product.minStock}{" "}
                      <span className="text-xs font-medium">
                        {product.unit}
                      </span>
                    </p>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Stock Level
                    </span>

                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {Math.round(percentage)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${severity.progress}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* RESTOCK */}
                <button
                  type="button"
                  onClick={() => openRestockModal(product)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
                >
                  <ShoppingCart size={17} />
                  Restock Product
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-10 text-center dark:border-emerald-500/30 dark:bg-emerald-500/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2
              size={28}
              className="text-emerald-500"
            />
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            No products found
          </h3>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            No products match your current search or filter.
          </p>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {showRestockModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeRestockModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                    <ShoppingCart
                      size={21}
                      className="text-emerald-500"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Restock Product
                    </h3>

                    <p className="text-xs text-slate-500">
                      {selectedProduct.sku}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRestockModal}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={19} />
              </button>
            </div>

            {/* PRODUCT */}
            <div className="mt-5 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedProduct.name}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    Current
                  </p>

                  <p className="mt-1 font-bold text-red-600 dark:text-red-400">
                    {selectedProduct.stock} {selectedProduct.unit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Minimum
                  </p>

                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {selectedProduct.minStock}{" "}
                    {selectedProduct.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* QUANTITY */}
            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-900 dark:text-white">
                Restock Quantity
              </label>

              <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setRestockQuantity((value) =>
                      Math.max(1, Number(value) - 1)
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Minus size={17} />
                </button>

                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) =>
                    setRestockQuantity(
                      Math.max(1, Number(e.target.value))
                    )
                  }
                  className="h-10 min-w-0 flex-1 bg-transparent text-center font-bold text-slate-900 outline-none dark:text-white"
                />

                <button
                  type="button"
                  onClick={() =>
                    setRestockQuantity(
                      (value) => Number(value) + 1
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Plus size={17} />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Suggested quantity:{" "}
                <span className="font-semibold">
                  {Math.max(
                    selectedProduct.minStock * 2 -
                      selectedProduct.stock,
                    1
                  )}{" "}
                  {selectedProduct.unit}
                </span>
              </p>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRestockModal}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRestock}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

