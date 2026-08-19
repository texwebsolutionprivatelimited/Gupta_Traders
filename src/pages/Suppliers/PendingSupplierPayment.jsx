
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const initialPayments = [
  {
    id: 1,
    supplier: "Gupta FMCG Suppliers",
    invoice: "INV-1001",
    dueDate: "2026-08-25",
    amount: 18500,
    status: "Pending",
  },
  {
    id: 2,
    supplier: "Fresh Foods Supply",
    invoice: "INV-1002",
    dueDate: "2026-08-28",
    amount: 22000,
    status: "Pending",
  },
  {
    id: 3,
    supplier: "Shree Grocery Traders",
    invoice: "INV-1003",
    dueDate: "2026-08-30",
    amount: 12000,
    status: "Pending",
  },
  {
    id: 4,
    supplier: "Hindustan Distributors",
    invoice: "INV-1004",
    dueDate: "2026-09-02",
    amount: 26500,
    status: "Pending",
  },
];

export default function PendingSupplierPayment() {
  const [payments, setPayments] =
    useState(initialPayments);

  const [search, setSearch] = useState("");

  const filteredPayments = useMemo(() => {
    return payments.filter(
      (item) =>
        item.supplier
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.invoice
          .toLowerCase()
          .includes(search.toLowerCase())
    );
  }, [payments, search]);

  const totalPending = filteredPayments.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const markAsPaid = (id) => {
    setPayments((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl p-6">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              Suppliers / Pending Payment
            </p>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Pending Supplier Payments
            </h1>

            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Manage unpaid supplier invoices and dues.
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
              Pending Invoices
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {filteredPayments.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Pending Amount
            </p>

            <h2 className="mt-2 text-3xl font-bold text-rose-500">
              ₹{totalPending.toLocaleString()}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Suppliers
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {
                new Set(
                  filteredPayments.map(
                    (item) => item.supplier
                  )
                ).size
              }
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <input
            type="text"
            placeholder="Search supplier or invoice..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
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
                    Supplier
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Invoice
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Due Date
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                        className="border-t border-slate-200 dark:border-slate-800"
                      >
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                          {payment.supplier}
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {payment.invoice}
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {payment.dueDate}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-rose-500">
                          ₹
                          {payment.amount.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            Pending
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() =>
                              markAsPaid(
                                payment.id
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                          >
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      No pending payments found.
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

