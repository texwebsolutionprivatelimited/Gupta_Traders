import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useReport } from "../../context/ReportContext";

export default function StockReport() {
  const { stockItems: stockData = [], loading, error } = useReport();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const getStockStatus = (item) => {
    if (item.currentStock <= 0) {
      return "Out of Stock";
    }

    if (item.currentStock <= item.minStock) {
      return "Low Stock";
    }

    return "In Stock";
  };

  const categories = [
    "All",
    ...new Set(stockData.map((item) => item.category)),
  ];

  const filteredStock = useMemo(() => {
    return stockData.filter((item) => {
      const searchMatch =
        item.product
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.sku
          .toLowerCase()
          .includes(search.toLowerCase());

      const categoryMatch =
        category === "All" ||
        item.category === category;

      const statusMatch =
        status === "All" ||
        getStockStatus(item) === status;

      return (
        searchMatch &&
        categoryMatch &&
        statusMatch
      );
    });
  }, [stockData, search, category, status]);

  const totalProducts = stockData.length;

  const totalCurrentStock = stockData.reduce(
    (sum, item) => sum + Number(item.currentStock || 0),
    0
  );

  const totalStockIn = stockData.reduce(
    (sum, item) => sum + Number(item.stockIn || 0),
    0
  );

  const totalStockOut = stockData.reduce(
    (sum, item) => sum + Number(item.stockOut || 0),
    0
  );

  const lowStockCount = stockData.filter(
    (item) => getStockStatus(item) === "Low Stock"
  ).length;

  const outOfStockCount = stockData.filter(
    (item) => getStockStatus(item) === "Out of Stock"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/reports"
              className="mb-3 inline-flex text-sm font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              ← Back to Reports
            </Link>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 sm:text-4xl">
              Stock Report
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
              Monitor current inventory, stock movement and low-stock products.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald">
              Total Products
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-950 dark:text-slate-50">
              {totalProducts}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Current Stock"
            value={totalCurrentStock.toLocaleString("en-IN")}
            subtitle="Total available units"
            icon="📦"
            color="text-cyan-600 dark:text-cyan-400"
            border="border-slate-200 dark:border-cyan-500/20"
            background="bg-cyan-50 dark:bg-cyan-500/10"
          />

          <SummaryCard
            title="Stock In"
            value={totalStockIn.toLocaleString("en-IN")}
            subtitle="Units received"
            icon="📥"
            color="text-emerald-600 dark:text-emerald-400"
            border="border-slate-200 dark:border-emerald-500/20"
            background="bg-emerald-50 dark:bg-emerald-500/10"
          />

          <SummaryCard
            title="Stock Out"
            value={totalStockOut.toLocaleString("en-IN")}
            subtitle="Units sold / issued"
            icon="📤"
            color="text-amber-600 dark:text-amber-400"
            border="border-slate-200 dark:border-amber-500/20"
            background="bg-amber-50 dark:bg-amber-500/10"
          />

          <SummaryCard
            title="Low Stock"
            value={lowStockCount}
            subtitle={`${outOfStockCount} out of stock`}
            icon="⚠️"
            color="text-rose-600 dark:text-rose-400"
            border="border-slate-200 dark:border-rose-500/20"
            background="bg-rose-50 dark:bg-rose-500/10"
          />

        </div>

        {/* Filters */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Search Product
              </label>

              <input
                type="text"
                placeholder="Search by product or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {categories.map((item) => (
                  <option key={item} value={item} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Stock Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="All" className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">All Status</option>
                <option value="In Stock" className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">In Stock</option>
                <option value="Low Stock" className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">Low Stock</option>
                <option value="Out of Stock" className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white">
                  Out of Stock
                </option>
              </select>
            </div>

          </div>
        </div>

        {/* Stock Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-2 border-b border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Stock Details
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Current inventory and stock movement
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              Showing {filteredStock.length} of {totalProducts}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">

              <thead className="bg-slate-50 dark:bg-slate-800/70">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">

                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    Category
                  </th>

                  <th className="px-5 py-4 text-right">
                    Opening
                  </th>

                  <th className="px-5 py-4 text-right">
                    Stock In
                  </th>

                  <th className="px-5 py-4 text-right">
                    Stock Out
                  </th>

                  <th className="px-5 py-4 text-right">
                    Current
                  </th>

                  <th className="px-5 py-4">
                    Unit
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {filteredStock.map((item) => {
                  const stockStatus =
                    getStockStatus(item);

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {item.product}
                          </p>

                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            SKU: {item.sku}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {item.category}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-slate-700 dark:text-slate-300">
                        {item.openingStock.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        +{item.stockIn.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-rose-600 dark:text-rose-400">
                        -{item.stockOut.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.currentStock.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {item.unit}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={stockStatus}
                        />
                      </td>

                    </tr>
                  );
                })}

                {filteredStock.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-slate-400 dark:text-slate-500"
                    >
                      {loading ? "Loading stock from Supabase..." : error || "No stock records found."}
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="mt-6 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              In Stock Products
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {
                stockData.filter(
                  (item) =>
                    getStockStatus(item) === "In Stock"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Low Stock Products
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {lowStockCount}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Out of Stock Products
            </p>

            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {outOfStockCount}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
  border,
  background,
}) {
  return (
    <div
      className={`rounded-2xl border ${border} bg-white dark:bg-slate-900 p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h2
            className={`mt-2 text-3xl font-bold ${color}`}
          >
            {value}
          </h2>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-xl ${background} p-3 text-xl`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "Out of Stock") {
    return (
      <span className="inline-flex rounded-full bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 px-3 py-1 text-xs font-semibold">
        Out of Stock
      </span>
    );
  }

  if (status === "Low Stock") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 text-xs font-semibold">
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 text-xs font-semibold">
      In Stock
    </span>
  );
}
