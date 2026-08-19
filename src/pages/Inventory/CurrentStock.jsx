
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Eye,
  X,
  Warehouse,
  RotateCcw,
} from "lucide-react";

import {
  getInventory,
} from "../../utils/inventoryStorage";

// Agar CurrentStock.jsx ka location alag hai,
// to inventoryStorage ka relative path accordingly change karna.

// ============================================================
// COMPONENT
// ============================================================

export default function CurrentStock() {
  const [products, setProducts] = useState(() =>
    getInventory()
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] =
    useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState(null);

  // ==========================================================
  // LOAD INVENTORY
  // ==========================================================

  useEffect(() => {
    const loadInventory = () => {
      setProducts(getInventory());
    };

    // Initial load
    loadInventory();

    // Same app ke andar inventory update hone par
    // Current Stock automatically refresh hoga.
    window.addEventListener(
      "inventoryUpdated",
      loadInventory
    );

    // Agar localStorage kisi aur tab me update hua
    window.addEventListener(
      "storage",
      loadInventory
    );

    return () => {
      window.removeEventListener(
        "inventoryUpdated",
        loadInventory
      );

      window.removeEventListener(
        "storage",
        loadInventory
      );
    };
  }, []);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products.map(
          (product) => product.category
        )
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [products]);

  // ==========================================================
  // STATUS
  // ==========================================================

  const getStatus = (product) => {
    if (Number(product.stock) <= 0) {
      return {
        key: "out",
        label: "Out of Stock",
        icon: XCircle,
        badge:
          "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
        bar: "bg-red-500",
      };
    }

    if (
      Number(product.stock) <=
      Number(product.minStock ?? product.minimum ?? 0)
    ) {
      return {
        key: "low",
        label: "Low Stock",
        icon: AlertTriangle,
        badge:
          "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
        bar: "bg-amber-500",
      };
    }

    return {
      key: "in",
      label: "In Stock",
      icon: CheckCircle2,
      badge:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
      bar: "bg-emerald-500",
    };
  };

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    return {
      total: products.length,

      inStock: products.filter(
        (product) =>
          getStatus(product).key === "in"
      ).length,

      lowStock: products.filter(
        (product) =>
          getStatus(product).key === "low"
      ).length,

      outOfStock: products.filter(
        (product) =>
          getStatus(product).key === "out"
      ).length,
    };
  }, [products]);

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    let result = products.filter((product) => {
      const matchesSearch =
        !value ||
        String(product.name || "")
          .toLowerCase()
          .includes(value) ||
        String(product.sku || "")
          .toLowerCase()
          .includes(value) ||
        String(product.category || "")
          .toLowerCase()
          .includes(value);

      const matchesCategory =
        categoryFilter === "All" ||
        product.category === categoryFilter;

      const productStatus =
        getStatus(product).key;

      const matchesStatus =
        statusFilter === "All" ||
        productStatus === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return String(a.name).localeCompare(
            String(b.name)
          );

        case "stock-low":
          return (
            Number(a.stock || 0) -
            Number(b.stock || 0)
          );

        case "stock-high":
          return (
            Number(b.stock || 0) -
            Number(a.stock || 0)
          );

        case "category":
          return String(a.category).localeCompare(
            String(b.category)
          );

        default:
          return 0;
      }
    });

    return result;
  }, [
    products,
    search,
    categoryFilter,
    statusFilter,
    sortBy,
  ]);

  // ==========================================================
  // STOCK PERCENTAGE
  // ==========================================================

  const getStockPercentage = (product) => {
    const maximum = Number(
      product.maximum || 100
    );

    if (maximum <= 0) return 0;

    return Math.min(
      100,
      Math.round(
        (Number(product.stock || 0) /
          maximum) *
          100
      )
    );
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setSortBy("name");
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = () => {
    setProducts(getInventory());
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <section className="w-full">

      {/* HEADER */}

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Package
              size={23}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              Current Stock
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              View and monitor current inventory levels
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* SEARCH */}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search product, SKU or category..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-100 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setShowFilters(!showFilters)
            }
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm font-medium text-slate-700 xl:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Filter size={17} />
            Filters
          </button>

          <div className="hidden gap-3 xl:flex">
            <FilterSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories}
              allLabel="All Categories"
            />

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                "All",
                "in",
                "low",
                "out",
              ]}
              labels={{
                All: "All Status",
                in: "In Stock",
                low: "Low Stock",
                out: "Out of Stock",
              }}
            />

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="h-12 min-w-[170px] rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="name">
                Sort: Name
              </option>
              <option value="stock-low">
                Stock: Low → High
              </option>
              <option value="stock-high">
                Stock: High → Low
              </option>
              <option value="category">
                Sort: Category
              </option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 dark:border-slate-800 sm:grid-cols-3 xl:hidden">
            <FilterSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories}
              allLabel="All Categories"
            />

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                "All",
                "in",
                "low",
                "out",
              ]}
              labels={{
                All: "All Status",
                in: "In Stock",
                low: "Low Stock",
                out: "Out of Stock",
              }}
            />

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-100 px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="name">
                Sort: Name
              </option>
              <option value="stock-low">
                Stock: Low → High
              </option>
              <option value="stock-high">
                Stock: High → Low
              </option>
              <option value="category">
                Sort: Category
              </option>
            </select>
          </div>
        )}

        {(search ||
          categoryFilter !== "All" ||
          statusFilter !== "All" ||
          sortBy !== "name") && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filteredProducts.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {products.length}
              </span>{" "}
              products
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/70">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Product
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  SKU
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Category
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Stock
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Level
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const status = getStatus(product);
                const StatusIcon = status.icon;
                const percentage =
                  getStockPercentage(product);

                return (
                  <tr
                    key={product.id}
                    className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-200">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Minimum:{" "}
                        {product.minStock ??
                          product.minimum ??
                          0}{" "}
                        {product.unit}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {product.sku}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-200">
                        {product.stock}{" "}
                        <span className="text-xs font-medium text-slate-500">
                          {product.unit}
                        </span>
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="w-32">
                        <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                          <span>
                            {percentage}%
                          </span>

                          <span>
                            Max{" "}
                            {product.maximum ||
                              100}{" "}
                            {product.unit}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full rounded-full transition-all ${status.bar}`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.badge}`}
                      >
                        <StatusIcon size={14} />
                        {status.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProduct(product)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE */}

      <div className="grid gap-3 md:hidden">
        {filteredProducts.map((product) => {
          const status = getStatus(product);
          const StatusIcon = status.icon;
          const percentage =
            getStockPercentage(product);

          return (
            <div
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Package
                      size={18}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {product.sku}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.badge}`}
                >
                  <StatusIcon size={11} />
                  {status.label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoBox
                  label="Category"
                  value={product.category}
                />

                <InfoBox
                  label="Current Stock"
                  value={`${product.stock} ${product.unit}`}
                />

                <InfoBox
                  label="Minimum Stock"
                  value={`${product.minStock ?? product.minimum ?? 0} ${product.unit}`}
                />

                <InfoBox
                  label="Stock Level"
                  value={`${percentage}%`}
                />
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                  <span>Stock Level</span>

                  <span>
                    Max {product.maximum || 100}{" "}
                    {product.unit}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${status.bar}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProduct(product)
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Eye size={16} />
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {/* EMPTY */}

      {filteredProducts.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Package
            size={42}
            className="mx-auto text-slate-400"
          />

          <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
            No products found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or filters.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <RotateCcw size={15} />
            Reset Filters
          </button>
        </div>
      )}

      {/* MODAL */}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Warehouse
                    size={23}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedProduct.name}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {selectedProduct.sku}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProduct(null)
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6">
              {(() => {
                const status =
                  getStatus(selectedProduct);

                const StatusIcon = status.icon;

                return (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${status.badge}`}
                  >
                    <StatusIcon size={16} />
                    {status.label}
                  </span>
                );
              })()}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoBox
                label="Category"
                value={
                  selectedProduct.category
                }
              />

              <InfoBox
                label="Current Stock"
                value={`${selectedProduct.stock} ${selectedProduct.unit}`}
              />

              <InfoBox
                label="Minimum Stock"
                value={`${selectedProduct.minStock ?? selectedProduct.minimum ?? 0} ${selectedProduct.unit}`}
              />

              <InfoBox
                label="Maximum Stock"
                value={`${selectedProduct.maximum || 100} ${selectedProduct.unit}`}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Stock Level
                </p>

                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {getStockPercentage(
                    selectedProduct
                  )}
                  %
                </p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${
                    getStatus(selectedProduct).bar
                  }`}
                  style={{
                    width: `${getStockPercentage(
                      selectedProduct
                    )}%`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedProduct(null)
              }
              className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// HELPERS
// ============================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
  iconBg,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconBg}`}
        >
          <Icon
            size={22}
            className={iconClass}
          />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  labels,
  allLabel,
}) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="h-12 min-w-[160px] rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labels?.[option] ||
            (option === "All"
              ? allLabel || "All"
              : option)}
        </option>
      ))}
    </select>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

