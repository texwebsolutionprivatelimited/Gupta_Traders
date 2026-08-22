import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const initialCustomers = [
  {
    id: 1,
    name: "Rahul Sharma",
    mobile: "9876543210",
    email: "rahul@example.com",
    city: "Lucknow",
    lastPurchase: 4500,
    khataBalance: 1200,
    status: "Active",
  },
  {
    id: 2,
    name: "Amit Verma",
    mobile: "9123456780",
    email: "amit@example.com",
    city: "Lucknow",
    lastPurchase: 2800,
    khataBalance: 0,
    status: "Active",
  },
  {
    id: 3,
    name: "Neha Gupta",
    mobile: "9988776655",
    email: "neha@example.com",
    city: "Kanpur",
    lastPurchase: 6200,
    khataBalance: 2500,
    status: "Active",
  },
  {
    id: 4,
    name: "Suresh Kumar",
    mobile: "9871234567",
    email: "suresh@example.com",
    city: "Lucknow",
    lastPurchase: 1750,
    khataBalance: 750,
    status: "Active",
  },
  {
    id: 5,
    name: "Pooja Singh",
    mobile: "9012345678",
    email: "pooja@example.com",
    city: "Barabanki",
    lastPurchase: 3200,
    khataBalance: 0,
    status: "Inactive",
  },
];

export default function CustomerManagement() {
  const navigate = useNavigate();

  const customers = useMemo(() => {
    try {
      const savedCustomers = localStorage.getItem("customers");
      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
    return initialCustomers;
  }, []);

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const customersWithDue = customers.filter(
    (customer) => Number(customer.khataBalance || 0) > 0
  ).length;

  const totalDue = customers.reduce(
    (total, customer) => total + Number(customer.khataBalance || 0),
    0
  );

  const recentCustomers = customers.slice(0, 5);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  return (
    <div className="min-h-full bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>Customers</span>
              <span>/</span>
              <span className="font-medium text-emerald-400">
                Customer Management
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl dark:text-slate-100">
              Customer Management
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage customers, purchase history, khata and due payments.
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/customers/list")}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-500 hover:bg-slate-800 sm:px-3.5 sm:text-sm"
            >
              Customer List
            </button>

            <button
              type="button"
              onClick={() => navigate("/customers/purchase-history")}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-500 hover:bg-slate-800 sm:px-3.5 sm:text-sm"
            >
              Purchase History
            </button>

            <button
              type="button"
              onClick={() => navigate("/customers/khata")}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-500 hover:bg-slate-800 sm:px-3.5 sm:text-sm"
            >
              Customer Khata
            </button>

            <button
              type="button"
              onClick={() => navigate("/customers/due-payment")}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-500 hover:bg-slate-800 sm:px-3.5 sm:text-sm"
            >
              Due Payment
            </button>

            <button
              type="button"
              onClick={() => navigate("/customers/list?action=add")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-600 focus:outline-none sm:gap-2 sm:px-4 sm:text-sm"
            >
              <PlusIcon />
              Add Customer
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Customers"
            value={customers.length}
            subtitle="All registered customers"
            icon={<UsersIcon />}
            iconClass="bg-blue-500/10 text-blue-400"
          />

          <SummaryCard
            title="Active Customers"
            value={activeCustomers}
            subtitle="Currently active"
            icon={<CheckIcon />}
            iconClass="bg-emerald-500/10 text-emerald-400"
          />

          <SummaryCard
            title="Customers with Due"
            value={customersWithDue}
            subtitle="Customers having pending balance"
            icon={<AlertIcon />}
            iconClass="bg-amber-500/10 text-amber-400"
          />

          <SummaryCard
            title="Total Due"
            value={formatCurrency(totalDue)}
            subtitle="Total customer outstanding"
            icon={<WalletIcon />}
            iconClass="bg-rose-500/10 text-rose-400"
          />
        </div>

        {/* Recent Customers */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">
                Recent Customers
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Recently registered customers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/customers/list")}
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Mobile Number</th>
                  <th className="px-5 py-4">City</th>
                  <th className="px-5 py-4 text-right">Last Purchase</th>
                  <th className="px-5 py-4 text-right">Khata Balance</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {recentCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CustomerAvatar name={customer.name} />

                        <div>
                          <p className="text-sm font-semibold text-slate-50">
                            {customer.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {customer.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-300">
                      {customer.mobile || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-300">
                      {customer.city || "-"}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-50">
                      {formatCurrency(customer.lastPurchase)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span
                        className={
                          Number(customer.khataBalance || 0) > 0
                            ? "text-sm font-semibold text-rose-400"
                            : "text-sm font-semibold text-emerald-400"
                        }
                      >
                        {formatCurrency(customer.khataBalance)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={customer.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/customers/list/${customer.id}`)
                        }
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-800 p-4">
            <button
              type="button"
              onClick={() => navigate("/customers/list")}
              className="w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Manage All Customers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Summary Card */

function SummaryCard({ title, value, subtitle, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}

/* Status */

function StatusBadge({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-slate-500/10 text-slate-400"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-500"
          }`}
      />
      {status}
    </span>
  );
}

/* Avatar */

function CustomerAvatar({ name }) {
  const initials = String(name || "Customer")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm">
      {initials || "C"}
    </div>
  );
}

/* Icons */

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4 sm:h-5 sm:w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75"
      />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4m0 4h.01"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.3 3.6 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3L13.7 3.6a2 2 0 0 0-3.4 0Z"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 14h.01" />
    </svg>
  );
}