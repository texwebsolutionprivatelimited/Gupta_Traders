
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const initialSuppliers = [
  {
    id: 1,
    name: "Hindustan Distributors",
    contactPerson: "Rajesh Kumar",
    phone: "9876543210",
    email: "hindustan@example.com",
    gstin: "09ABCDE1234F1Z5",
    address: "Transport Nagar, Lucknow, Uttar Pradesh",
    city: "Lucknow",
    state: "Uttar Pradesh",
    openingBalance: 25000,
    status: "Active",
  },
  {
    id: 2,
    name: "Gupta FMCG Suppliers",
    contactPerson: "Amit Gupta",
    phone: "9123456780",
    email: "guptafmcg@example.com",
    gstin: "09FGHIJ5678K1Z2",
    address: "Aminabad, Lucknow, Uttar Pradesh",
    city: "Lucknow",
    state: "Uttar Pradesh",
    openingBalance: 18500,
    status: "Active",
  },
  {
    id: 3,
    name: "Shree Grocery Traders",
    contactPerson: "Suresh Verma",
    phone: "9988776655",
    email: "shreegrocery@example.com",
    gstin: "09LMNOP9012Q1Z8",
    address: "Faizabad Road, Lucknow, Uttar Pradesh",
    city: "Lucknow",
    state: "Uttar Pradesh",
    openingBalance: 12000,
    status: "Active",
  },
  {
    id: 4,
    name: "Daily Needs Wholesale",
    contactPerson: "Vikas Singh",
    phone: "9012345678",
    email: "dailyneeds@example.com",
    gstin: "09RSTUV3456W1Z4",
    address: "Aliganj, Lucknow, Uttar Pradesh",
    city: "Lucknow",
    state: "Uttar Pradesh",
    openingBalance: 8500,
    status: "Active",
  },
  {
    id: 5,
    name: "Fresh Foods Supply",
    contactPerson: "Ankit Mishra",
    phone: "9090909090",
    email: "freshfoods@example.com",
    gstin: "09WXYZA7890B1Z6",
    address: "Gomti Nagar, Lucknow, Uttar Pradesh",
    city: "Lucknow",
    state: "Uttar Pradesh",
    openingBalance: 15000,
    status: "Active",
  },
];

export default function SupplierManagement() {
  const navigate = useNavigate();

  const suppliers = useMemo(() => {
    try {
      const saved = localStorage.getItem("suppliers");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    }

    return initialSuppliers;
  }, []);

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status === "Active"
  ).length;

  const inactiveSuppliers = suppliers.filter(
    (supplier) => supplier.status === "Inactive"
  ).length;

  const totalOutstanding = suppliers.reduce(
    (total, supplier) =>
      total + Number(supplier.openingBalance || 0),
    0
  );

  const recentSuppliers = suppliers.slice(0, 5);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 sm:p-6 lg:p-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">

        {/* ================= HEADER ================= */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                Suppliers
              </span>

              <span className="text-slate-400">/</span>

              <span className="font-medium text-emerald-500">
                Supplier Management
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Supplier Management
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage suppliers, balances and payment information.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/suppliers/purchase-history")}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:bg-slate-800 hover:text-white"
            >
              Purchase History
            </button>

            <button
              type="button"
              onClick={() => navigate("/suppliers/pending-payment")}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:bg-slate-800 hover:text-white"
            >
              Pending Payment
            </button>

            <button
              type="button"
              onClick={() => navigate("/suppliers/add")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
            >
              <PlusIcon />
              Add Supplier
            </button>
          </div>




        </div>

        {/* ================= SUMMARY ================= */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            title="Total Suppliers"
            value={suppliers.length}
            subtitle="All registered suppliers"
            icon={<UsersIcon />}
            iconClass="bg-blue-500/10 text-blue-500"
          />

          <SummaryCard
            title="Active Suppliers"
            value={activeSuppliers}
            subtitle="Currently active"
            icon={<CheckCircleIcon />}
            iconClass="bg-emerald-500/10 text-emerald-500"
          />

          <SummaryCard
            title="Inactive Suppliers"
            value={inactiveSuppliers}
            subtitle="Currently inactive"
            icon={<PauseIcon />}
            iconClass="bg-amber-500/10 text-amber-500"
          />

          <SummaryCard
            title="Outstanding"
            value={formatCurrency(totalOutstanding)}
            subtitle="Total supplier balance"
            icon={<WalletIcon />}
            iconClass="bg-rose-500/10 text-rose-500"
          />
        </div>

        {/* ================= RECENT SUPPLIERS ================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Table Header */}

          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">

            <div>
              <h2 className="text-lg font-semibold">
                Recent Suppliers
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Recently registered suppliers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/suppliers/list")}
              className="text-sm font-semibold text-emerald-500 transition hover:text-emerald-400"
            >
              View All →
            </button>
          </div>

          {/* Desktop Table */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">

                  <th className="px-5 py-4">
                    Supplier
                  </th>

                  <th className="px-5 py-4">
                    Contact
                  </th>

                  <th className="px-5 py-4">
                    Location
                  </th>

                  <th className="px-5 py-4 text-right">
                    Balance
                  </th>

                  <th className="px-5 py-4 text-center">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {recentSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >

                    {/* Supplier */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">

                        <SupplierAvatar
                          name={supplier.name}
                        />

                        <div>
                          <p className="text-sm font-semibold">
                            {supplier.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {supplier.contactPerson || "No contact person"}
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* Contact */}

                    <td className="px-5 py-4">
                      <p className="text-sm">
                        {supplier.phone || "-"}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {supplier.email || "No email"}
                      </p>
                    </td>

                    {/* Location */}

                    <td className="px-5 py-4">
                      <p className="text-sm">
                        {supplier.city || "-"}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {supplier.state || "-"}
                      </p>
                    </td>

                    {/* Balance */}

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold">
                        {formatCurrency(supplier.openingBalance)}
                      </span>
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4 text-center">
                      <StatusBadge
                        status={supplier.status}
                      />
                    </td>

                    {/* Action */}

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/suppliers/list?view=${supplier.id}`)
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 dark:border-slate-700 dark:text-slate-300"
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Mobile */}

          <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">

            {recentSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-4"
              >

                <div className="flex items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-3">

                    <SupplierAvatar
                      name={supplier.name}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {supplier.name}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {supplier.contactPerson || "No contact person"}
                      </p>
                    </div>

                  </div>

                  <StatusBadge
                    status={supplier.status}
                  />

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">

                  <InfoItem
                    label="Phone"
                    value={supplier.phone || "-"}
                  />

                  <InfoItem
                    label="Balance"
                    value={formatCurrency(supplier.openingBalance)}
                  />

                  <InfoItem
                    label="City"
                    value={supplier.city || "-"}
                  />

                  <InfoItem
                    label="GSTIN"
                    value={supplier.gstin || "-"}
                  />

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/suppliers/list?view=${supplier.id}`)
                  }
                  className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  View Supplier
                </button>

              </div>
            ))}

          </div>

          {/* Footer */}

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">

            <button
              type="button"
              onClick={() => navigate("/suppliers/list")}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-500 dark:border-slate-700 dark:text-slate-300"
            >
              Manage All Suppliers
            </button>

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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-start justify-between">

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
   SUPPLIER AVATAR
========================================================= */

function SupplierAvatar({ name }) {
  const initials = String(name || "Supplier")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
      {initials || "S"}
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active
        ? "bg-emerald-500/10 text-emerald-500"
        : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"
          }`}
      />

      {status}
    </span>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function PlusIcon() {
  return (
    <svg
      className="h-5 w-5"
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
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25v13.5m-7.5-13.5v13.5"
      />

      <rect
        width="18"
        height="18"
        x="3"
        y="3"
        rx="9"
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
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9.75h19.5m-18-6h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6a2.25 2.25 0 0 1 2.25-2.25Zm14.25 10.5h.008v.008h-.008v-.008Z"
      />
    </svg>
  );
}

