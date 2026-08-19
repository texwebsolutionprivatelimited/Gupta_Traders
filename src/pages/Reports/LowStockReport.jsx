
import { useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { useReport } from "../../context/ReportContext";

export default function LowStockReport() {
  const [search, setSearch] = useState("");

  const { stockItems = [] } = useReport();

  const lowStockItems =
    stockItems.length > 0
      ? stockItems.filter(
          (item) =>
            Number(item.stock) <=
            Number(item.minStock)
        )
      : [
          {
            id: 1,
            product: "UltraTech Cement",
            category: "Cement",
            stock: 12,
            minStock: 20,
            unit: "Bags",
          },
          {
            id: 2,
            product: "TMT Steel 12mm",
            category: "Steel",
            stock: 8,
            minStock: 15,
            unit: "Pieces",
          },
          {
            id: 3,
            product: "Asian Paints",
            category: "Paint",
            stock: 5,
            minStock: 10,
            unit: "Buckets",
          },
          {
            id: 4,
            product: "PVC Pipe",
            category: "Hardware",
            stock: 3,
            minStock: 8,
            unit: "Pieces",
          },
        ];

  const filteredItems = lowStockItems.filter(
    (item) =>
      item.product
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const criticalItems =
    lowStockItems.filter(
      (item) =>
        Number(item.stock) <
        Number(item.minStock) / 2
    ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Low Stock Report
          </h1>

          <p className="mt-2 text-slate-400">
            Monitor products that need
            immediate restocking.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6">
            <p className="text-sm text-slate-400">
              Low Stock Products
            </p>

            <h2 className="mt-2 text-3xl font-bold text-rose-400">
              {lowStockItems.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
            <p className="text-sm text-slate-400">
              Critical Items
            </p>

            <h2 className="mt-2 text-3xl font-bold text-amber-400">
              {criticalItems}
            </h2>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
            <p className="text-sm text-slate-400">
              Reorder Required
            </p>

            <h2 className="mt-2 text-3xl font-bold text-cyan-400">
              Yes
            </h2>
          </div>

        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full bg-transparent outline-none"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 p-5">
            <h2 className="text-xl font-semibold">
              Low Stock Products
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left">
                    Product
                  </th>

                  <th className="px-6 py-4 text-left">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left">
                    Current Stock
                  </th>

                  <th className="px-6 py-4 text-left">
                    Minimum Stock
                  </th>

                  <th className="px-6 py-4 text-left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
       {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-800"
                  >
                    <td className="px-6 py-4 font-medium">
                      {item.product}
                    </td>

                    <td className="px-6 py-4">
                      {item.category}
                    </td>

                    <td className="px-6 py-4">
                      {item.stock} {item.unit}
                    </td>

                    <td className="px-6 py-4">
                      {item.minStock} {item.unit}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-400">
                        <AlertTriangle size={14} />
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-slate-500"
                    >
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
