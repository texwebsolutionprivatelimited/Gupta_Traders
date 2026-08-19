
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const initialStockData = [
  {
    id: 1,
    product: "UltraTech Cement",
    sku: "UTC001",
    category: "Cement",
    openingStock: 200,
    stockIn: 100,
    stockOut: 120,
    currentStock: 180,
    minStock: 30,
    unit: "Bag",
  },
  {
    id: 2,
    product: "TMT Steel",
    sku: "TMT001",
    category: "Steel",
    openingStock: 150,
    stockIn: 80,
    stockOut: 110,
    currentStock: 120,
    minStock: 25,
    unit: "Piece",
  },
  {
    id: 3,
    product: "Asian Paints",
    sku: "AP001",
    category: "Paint",
    openingStock: 80,
    stockIn: 40,
    stockOut: 55,
    currentStock: 65,
    minStock: 20,
    unit: "Litre",
  },
  {
    id: 4,
    product: "Floor Tiles",
    sku: "FT001",
    category: "Tiles",
    openingStock: 300,
    stockIn: 150,
    stockOut: 270,
    currentStock: 180,
    minStock: 50,
    unit: "Box",
  },
  {
    id: 5,
    product: "PVC Pipe",
    sku: "PVC001",
    category: "Hardware",
    openingStock: 100,
    stockIn: 30,
    stockOut: 95,
    currentStock: 35,
    minStock: 40,
    unit: "Piece",
  },
  {
    id: 6,
    product: "Electrical Wire",
    sku: "EW001",
    category: "Electrical",
    openingStock: 120,
    stockIn: 50,
    stockOut: 85,
    currentStock: 85,
    minStock: 25,
    unit: "Roll",
  },
  {
    id: 7,
    product: "Wall Putty",
    sku: "WP001",
    category: "Paint",
    openingStock: 90,
    stockIn: 30,
    stockOut: 100,
    currentStock: 20,
    minStock: 25,
    unit: "Bag",
  },
  {
    id: 8,
    product: "CPVC Pipe",
    sku: "CPVC001",
    category: "Hardware",
    openingStock: 75,
    stockIn: 45,
    stockOut: 35,
    currentStock: 85,
    minStock: 20,
    unit: "Piece",
  },
];

export default function StockReport() {
  const [stockData] = useState(initialStockData);
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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/reports"
              className="mb-3 inline-flex text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              ← Back to Reports
            </Link>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Stock Report
            </h1>

            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Monitor current inventory, stock movement and
              low-stock products.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
              Total Products
            </p>

            <p className="mt-1 text-2xl font-bold">
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
            color="text-cyan-400"
            border="border-cyan-500/20"
            background="bg-cyan-500/10"
          />

          <SummaryCard
            title="Stock In"
            value={totalStockIn.toLocaleString("en-IN")}
            subtitle="Units received"
            icon="📥"
            color="text-emerald-400"
            border="border-emerald-500/20"
            background="bg-emerald-500/10"
          />

          <SummaryCard
            title="Stock Out"
            value={totalStockOut.toLocaleString("en-IN")}
            subtitle="Units sold / issued"
            icon="📤"
            color="text-amber-400"
            border="border-amber-500/20"
            background="bg-amber-500/10"
          />

          <SummaryCard
            title="Low Stock"
            value={lowStockCount}
            subtitle={`${outOfStockCount} out of stock`}
            icon="⚠️"
            color="text-rose-400"
            border="border-rose-500/20"
            background="bg-rose-500/10"
          />

        </div>

        {/* Filters */}
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Search Product
              </label>

              <input
                type="text"
                placeholder="Search by product or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Stock Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="All">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">
                  Out of Stock
                </option>
              </select>
            </div>

          </div>
        </div>

        {/* Stock Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

          <div className="flex flex-col gap-2 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Stock Details
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Current inventory and stock movement
              </p>
            </div>

            <div className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
              Showing {filteredStock.length} of {totalProducts}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">

              <thead className="bg-slate-800/70">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">

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

              <tbody className="divide-y divide-slate-800">

                {filteredStock.map((item) => {
                  const stockStatus =
                    getStockStatus(item);

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-800/40"
                    >

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium">
                            {item.product}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            SKU: {item.sku}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-300">
                        {item.category}
                      </td>

                      <td className="px-5 py-4 text-right text-sm">
                        {item.openingStock.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-emerald-400">
                        +{item.stockIn.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-medium text-rose-400">
                        -{item.stockOut.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold">
                          {item.currentStock.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
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
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No stock records found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="mt-6 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              In Stock Products
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {
                stockData.filter(
                  (item) =>
                    getStockStatus(item) === "In Stock"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-sm text-slate-400">
              Low Stock Products
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-400">
              {lowStockCount}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <p className="text-sm text-slate-400">
              Out of Stock Products
            </p>

            <p className="mt-2 text-2xl font-bold text-rose-400">
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
      className={`rounded-2xl border ${border} bg-slate-900 p-5`}
    >
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h2
            className={`mt-2 text-3xl font-bold ${color}`}
          >
            {value}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
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
      <span className="inline-flex rounded-full bg-rose-500/15 px-3 py-1 text-xs font-medium text-rose-400">
        Out of Stock
      </span>
    );
  }

  if (status === "Low Stock") {
    return (
      <span className="inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-400">
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
      In Stock
    </span>
  );
}
