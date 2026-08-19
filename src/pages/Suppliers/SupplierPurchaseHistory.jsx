
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const purchaseHistoryData = [
  {
    id: "PO-1001",
    supplier: "Hindustan Distributors",
    date: "2026-08-10",
    amount: 25000,
    status: "Paid",
  },
  {
    id: "PO-1002",
    supplier: "Gupta FMCG Suppliers",
    date: "2026-08-12",
    amount: 18500,
    status: "Pending",
  },
  {
    id: "PO-1003",
    supplier: "Fresh Foods Supply",
    date: "2026-08-14",
    amount: 32000,
    status: "Paid",
  },
  {
    id: "PO-1004",
    supplier: "Shree Grocery Traders",
    date: "2026-08-15",
    amount: 12000,
    status: "Pending",
  },
  {
    id: "PO-1005",
    supplier: "Raj Wholesale Market",
    date: "2026-08-16",
    amount: 28000,
    status: "Paid",
  },
];

export default function SupplierPurchaseHistory() {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return purchaseHistoryData.filter(
      (item) =>
        item.supplier
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.id
          .toLowerCase()
          .includes(search.toLowerCase())
    );
  }, [search]);

  const totalPurchases = filteredData.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const paidPurchases = filteredData.filter(
    (item) => item.status === "Paid"
  ).length;

  const pendingPurchases = filteredData.filter(
    (item) => item.status === "Pending"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl p-6">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              Suppliers / Purchase History
            </p>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Supplier Purchase History
            </h1>

            <p className="mt-1 text-slate-500 dark:text-slate-400">
              View and track all supplier purchase records.
            </p>
          </div>

          <Link
            to="/suppliers"
            className="rounded-xl bg-emerald-600 px-5 py-3 text-center font-medium text-white transition hover:bg-emerald-700"
          >
            Back
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Purchases
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {filteredData.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Amount
            </p>

            <h2 className="mt-2 text-3xl font-bold text-emerald-600">
              ₹{totalPurchases.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Paid
                </p>

                <h2 className="mt-2 text-2xl font-bold text-emerald-500">
                  {paidPurchases}
                </h2>
              </div>

              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pending
                </p>

                <h2 className="mt-2 text-2xl font-bold text-amber-500">
                  {pendingPurchases}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <input
            type="text"
            placeholder="Search supplier or purchase number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Purchase No
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Supplier
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                        {item.id}
                      </td>

                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        {item.supplier}
                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {item.date}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white">
                        ₹{item.amount.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.status === "Paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      No purchase history found.
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

