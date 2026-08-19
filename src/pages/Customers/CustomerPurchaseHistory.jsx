
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Search,
  ShoppingBag,
  Wallet,
  IndianRupee,
  CircleDollarSign,
} from "lucide-react";

const purchaseHistoryData = [
  {
    id: 1,
    invoice: "INV-C001",
    customer: "Rahul Sharma",
    mobile: "9876543210",
    date: "2026-08-18",
    purchaseAmount: 12500,
    paid: 10000,
    due: 2500,
  },
  {
    id: 2,
    invoice: "INV-C002",
    customer: "Priya Singh",
    mobile: "9123456780",
    date: "2026-08-17",
    purchaseAmount: 8200,
    paid: 8200,
    due: 0,
  },
  {
    id: 3,
    invoice: "INV-C003",
    customer: "Amit Gupta",
    mobile: "9988776655",
    date: "2026-08-16",
    purchaseAmount: 15600,
    paid: 10000,
    due: 5600,
  },
  {
    id: 4,
    invoice: "INV-C004",
    customer: "Neha Verma",
    mobile: "9871234567",
    date: "2026-08-15",
    purchaseAmount: 4500,
    paid: 4500,
    due: 0,
  },
  {
    id: 5,
    invoice: "INV-C005",
    customer: "Vikas Yadav",
    mobile: "9012345678",
    date: "2026-08-14",
    purchaseAmount: 9800,
    paid: 7000,
    due: 2800,
  },
  {
    id: 6,
    invoice: "INV-C006",
    customer: "Rahul Sharma",
    mobile: "9876543210",
    date: "2026-08-12",
    purchaseAmount: 6300,
    paid: 6300,
    due: 0,
  },
  {
    id: 7,
    invoice: "INV-C007",
    customer: "Anjali Mishra",
    mobile: "9090909090",
    date: "2026-08-10",
    purchaseAmount: 11200,
    paid: 8000,
    due: 3200,
  },
  {
    id: 8,
    invoice: "INV-C008",
    customer: "Amit Gupta",
    mobile: "9988776655",
    date: "2026-08-08",
    purchaseAmount: 7400,
    paid: 7400,
    due: 0,
  },
];

export default function CustomerPurchaseHistory() {
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const customers = useMemo(() => {
    return [...new Set(purchaseHistoryData.map((item) => item.customer))];
  }, []);

  const filteredPurchases = useMemo(() => {
    return purchaseHistoryData.filter((purchase) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        purchase.customer.toLowerCase().includes(searchText) ||
        purchase.mobile.includes(searchText) ||
        purchase.invoice.toLowerCase().includes(searchText);

      const matchesCustomer =
        customerFilter === "All" ||
        purchase.customer === customerFilter;

      const matchesDate =
        !dateFilter || purchase.date === dateFilter;

      return (
        matchesSearch &&
        matchesCustomer &&
        matchesDate
      );
    });
  }, [search, customerFilter, dateFilter]);

  const totals = useMemo(() => {
    return filteredPurchases.reduce(
      (acc, purchase) => {
        acc.purchase += Number(purchase.purchaseAmount || 0);
        acc.paid += Number(purchase.paid || 0);
        acc.due += Number(purchase.due || 0);

        return acc;
      },
      {
        purchase: 0,
        paid: 0,
        due: 0,
      }
    );
  }, [filteredPurchases]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  };

  const clearFilters = () => {
    setSearch("");
    setCustomerFilter("All");
    setDateFilter("");
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 sm:p-6 lg:p-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/customers"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
            >
              <ArrowLeft size={16} />
              Back to Customers
            </Link>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Customers / Purchase History
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Customer Purchase History
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View customer purchases, payments and outstanding dues.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Total Transactions
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {filteredPurchases.length}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          <SummaryCard
            title="Purchase Amount"
            value={formatCurrency(totals.purchase)}
            subtitle="Total purchase value"
            icon={<ShoppingBag size={21} />}
            iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />

          <SummaryCard
            title="Paid Amount"
            value={formatCurrency(totals.paid)}
            subtitle="Amount received"
            icon={<Wallet size={21} />}
            iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />

          <SummaryCard
            title="Due Amount"
            value={formatCurrency(totals.due)}
            subtitle="Outstanding customer balance"
            icon={<CircleDollarSign size={21} />}
            iconClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="mb-4">
            <h2 className="text-base font-semibold">
              Search & Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search by customer name, mobile number or invoice.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px_200px_auto]">

            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, mobile or invoice..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Customer Filter */}
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Customers</option>

              {customers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-3 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Clear */}
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Purchase History Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold">
                Purchase History
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredPurchases.length} transaction
                {filteredPurchases.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              Due:{" "}
              <span className="font-bold text-rose-500">
                {formatCurrency(totals.due)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">

              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">
                    Invoice
                  </th>

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Mobile Number
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right">
                    Purchase Amount
                  </th>

                  <th className="px-5 py-4 text-right">
                    Paid
                  </th>

                  <th className="px-5 py-4 text-right">
                    Due
                  </th>

                  <th className="px-5 py-4 text-center">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {purchase.invoice}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {purchase.customer}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {purchase.mobile}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {formatDate(purchase.date)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold">
                      {formatCurrency(purchase.purchaseAmount)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(purchase.paid)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(purchase.due)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <PaymentStatus
                        paid={purchase.paid}
                        due={purchase.due}
                      />
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPurchases.length === 0 && (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Search size={22} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No purchase records found
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try changing the search or filter.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500 dark:text-slate-400">
                Showing {filteredPurchases.length} of{" "}
                {purchaseHistoryData.length} transactions
              </span>

              <div className="flex gap-5">
                <span>
                  Paid:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.paid)}
                  </strong>
                </span>

                <span>
                  Due:{" "}
                  <strong className="text-rose-600 dark:text-rose-400">
                    {formatCurrency(totals.due)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAYMENT STATUS
========================================================= */

function PaymentStatus({ paid, due }) {
  const isPaid = Number(due) <= 0;

  if (isPaid) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        Paid
      </span>
    );
  }

  if (Number(paid) > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
        Partial
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
      Unpaid
    </span>
  );
}

