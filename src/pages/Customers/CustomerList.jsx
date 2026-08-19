
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Users,
  Wallet,
  ShoppingCart,
  AlertCircle,
  Plus,
  X,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Save,
} from "lucide-react";

const initialCustomers = [
  {
    id: 1,
    name: "Ramesh Kumar",
    mobile: "9876543210",
    email: "ramesh@example.com",
    address: "Aliganj, Lucknow",
    totalPurchase: 45000,
    dueAmount: 5000,
    status: "Active",
  },
  {
    id: 2,
    name: "Amit Sharma",
    mobile: "9123456780",
    email: "amit@example.com",
    address: "Gomti Nagar, Lucknow",
    totalPurchase: 32500,
    dueAmount: 2500,
    status: "Active",
  },
  {
    id: 3,
    name: "Suresh Verma",
    mobile: "9988776655",
    email: "suresh@example.com",
    address: "Indira Nagar, Lucknow",
    totalPurchase: 58000,
    dueAmount: 8500,
    status: "Active",
  },
  {
    id: 4,
    name: "Neha Singh",
    mobile: "9871234567",
    email: "neha@example.com",
    address: "Hazratganj, Lucknow",
    totalPurchase: 21000,
    dueAmount: 0,
    status: "Active",
  },
  {
    id: 5,
    name: "Vikas Gupta",
    mobile: "9012345678",
    email: "vikas@example.com",
    address: "Rajajipuram, Lucknow",
    totalPurchase: 18000,
    dueAmount: 3000,
    status: "Active",
  },
];

const emptyCustomer = {
  name: "",
  mobile: "",
  email: "",
  address: "",
  status: "Active",
};

export default function CustomerList() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem("customers");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }

    return initialCustomers;
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState(
    emptyCustomer
  );

  const [formError, setFormError] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchValue = search.toLowerCase().trim();

      const customerName = String(
        customer.name || ""
      ).toLowerCase();

      const customerMobile = String(
        customer.mobile || ""
      );

      const matchesSearch =
        customerName.includes(searchValue) ||
        customerMobile.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const totalPurchase = customers.reduce(
    (sum, customer) =>
      sum + Number(customer.totalPurchase || 0),
    0
  );

  const totalDue = customers.reduce(
    (sum, customer) =>
      sum + Number(customer.dueAmount || 0),
    0
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  /* =========================================================
     OPEN ADD CUSTOMER
  ========================================================= */

  const openAddCustomer = () => {
    setNewCustomer(emptyCustomer);
    setFormError("");
    setShowAddModal(true);
  };

  /* =========================================================
     CLOSE ADD CUSTOMER
  ========================================================= */

  const closeAddCustomer = () => {
    setShowAddModal(false);
    setNewCustomer(emptyCustomer);
    setFormError("");
  };

  /* =========================================================
     HANDLE ADD FORM CHANGE
  ========================================================= */

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;

    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  /* =========================================================
     ADD CUSTOMER
  ========================================================= */

  const handleAddCustomer = (e) => {
    e.preventDefault();

    const name = newCustomer.name.trim();
    const mobile = newCustomer.mobile.trim();
    const email = newCustomer.email.trim();
    const address = newCustomer.address.trim();

    if (!name) {
      setFormError("Please enter customer name.");
      return;
    }

    if (!mobile) {
      setFormError("Please enter mobile number.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      setFormError(
        "Mobile number must contain exactly 10 digits."
      );
      return;
    }

    const duplicateMobile = customers.some(
      (customer) =>
        String(customer.mobile || "") === mobile
    );

    if (duplicateMobile) {
      setFormError(
        "A customer with this mobile number already exists."
      );
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const customer = {
      id: Date.now(),
      name,
      mobile,
      email,
      address,
      totalPurchase: 0,
      dueAmount: 0,
      status: newCustomer.status || "Active",
    };

    const updatedCustomers = [
      customer,
      ...customers,
    ];

    setCustomers(updatedCustomers);

    localStorage.setItem(
      "customers",
      JSON.stringify(updatedCustomers)
    );

    closeAddCustomer();

    alert("Customer added successfully!");
  };

  /* =========================================================
     DELETE CUSTOMER
  ========================================================= */

  const handleDelete = (id) => {
    const customer = customers.find(
      (item) => item.id === id
    );

    if (!customer) return;

    const confirmed = window.confirm(
      `Delete ${customer.name}?`
    );

    if (!confirmed) return;

    const updatedCustomers = customers.filter(
      (item) => item.id !== id
    );

    setCustomers(updatedCustomers);

    localStorage.setItem(
      "customers",
      JSON.stringify(updatedCustomers)
    );
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 sm:p-6 lg:p-8 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Customers</span>
              <span>/</span>

              <span className="text-emerald-500">
                Customer List
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Customer List
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage customers, purchases and outstanding dues.
            </p>
          </div>

          {/* ADD CUSTOMER */}

          <button
            type="button"
            onClick={openAddCustomer}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="All registered customers"
            icon={<Users size={21} />}
            iconClass="bg-blue-500/10 text-blue-500"
          />

          <StatCard
            title="Active Customers"
            value={activeCustomers}
            subtitle="Currently active"
            icon={<Users size={21} />}
            iconClass="bg-emerald-500/10 text-emerald-500"
          />

          <StatCard
            title="Total Purchase"
            value={formatCurrency(totalPurchase)}
            subtitle="Customer purchase value"
            icon={<ShoppingCart size={21} />}
            iconClass="bg-violet-500/10 text-violet-500"
          />

          <StatCard
            title="Total Due"
            value={formatCurrency(totalDue)}
            subtitle="Outstanding customer dues"
            icon={<Wallet size={21} />}
            iconClass="bg-rose-500/10 text-rose-500"
          />

        </div>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search customer by name or mobile..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

          </div>
        </div>

        {/* =====================================================
            CUSTOMER TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead className="bg-slate-50 dark:bg-slate-800/60">

                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Mobile Number
                  </th>

                  <th className="px-5 py-4">
                    Address
                  </th>

                  <th className="px-5 py-4 text-right">
                    Purchase
                  </th>

                  <th className="px-5 py-4 text-right">
                    Due
                  </th>

                  <th className="px-5 py-4 text-center">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

                {filteredCustomers.length > 0 ? (

                  filteredCustomers.map((customer) => (

                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >

                      {/* Customer */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <CustomerAvatar
                            name={customer.name}
                          />

                          <div>
                            <p className="font-semibold">
                              {customer.name}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {customer.email || "No email"}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* Mobile */}

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {customer.mobile}
                        </p>
                      </td>

                      {/* Address */}

                      <td className="px-5 py-4">

                        <p className="max-w-[220px] truncate text-sm">
                          {customer.address || "-"}
                        </p>

                      </td>

                      {/* Purchase */}

                      <td className="px-5 py-4 text-right font-semibold">
                        {formatCurrency(
                          customer.totalPurchase
                        )}
                      </td>

                      {/* Due */}

                      <td className="px-5 py-4 text-right">

                        <span
                          className={`font-semibold ${
                            Number(customer.dueAmount) > 0
                              ? "text-rose-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {formatCurrency(
                            customer.dueAmount
                          )}
                        </span>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-4 text-center">

                        <StatusBadge
                          status={customer.status}
                        />

                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">

                        <div className="flex justify-center gap-2">

                          <button
                            type="button"
                            title="View Customer"
                            onClick={() =>
                              navigate(
                                `/customers/${customer.id}`
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-500"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            title="Edit Customer"
                            onClick={() =>
                              navigate(
                                `/customers/edit/${customer.id}`
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-500"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            title="Delete Customer"
                            onClick={() =>
                              handleDelete(customer.id)
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            <Trash2 size={18} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center"
                    >
                      <AlertCircle
                        size={30}
                        className="mx-auto mb-2 text-slate-400"
                      />

                      <p className="font-medium">
                        No customers found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filter.
                      </p>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* =======================================================
          ADD CUSTOMER MODAL
      ======================================================= */}

      {showAddModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeAddCustomer();
            }
          }}
        >

          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <UserPlus size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Add Customer
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create a new customer profile
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeAddCustomer}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            {/* Modal Body */}

            <form onSubmit={handleAddCustomer}>

              <div className="max-h-[70vh] overflow-y-auto p-5">

                {formError && (

                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">

                    <AlertCircle
                      size={18}
                      className="mt-0.5 flex-shrink-0"
                    />

                    <span>{formError}</span>

                  </div>

                )}

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Name */}

                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Customer Name
                      <span className="ml-1 text-rose-500">
                        *
                      </span>
                    </label>

                    <div className="relative">

                      <UserPlus
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="name"
                        value={newCustomer.name}
                        onChange={handleCustomerChange}
                        placeholder="Enter customer name"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />

                    </div>

                  </div>

                  {/* Mobile */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Mobile Number
                      <span className="ml-1 text-rose-500">
                        *
                      </span>
                    </label>

                    <div className="relative">

                      <Phone
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="tel"
                        name="mobile"
                        value={newCustomer.mobile}
                        onChange={(e) => {
                          const value =
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10);

                          setNewCustomer((prev) => ({
                            ...prev,
                            mobile: value,
                          }));

                          setFormError("");
                        }}
                        placeholder="10 digit mobile number"
                        maxLength={10}
                        inputMode="numeric"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                    </div>

                  </div>

                  {/* Email */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>

                    <div className="relative">

                      <Mail
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="email"
                        name="email"
                        value={newCustomer.email}
                        onChange={handleCustomerChange}
                        placeholder="customer@example.com"
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                    </div>

                  </div>

                  {/* Address */}

                  <div className="sm:col-span-2">

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Address
                    </label>

                    <div className="relative">

                      <MapPin
                        size={17}
                        className="absolute left-3 top-3 text-slate-400"
                      />

                      <textarea
                        name="address"
                        rows="3"
                        value={newCustomer.address}
                        onChange={handleCustomerChange}
                        placeholder="Enter customer address"
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                    </div>

                  </div>

                  {/* Status */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </label>

                    <select
                      name="status"
                      value={newCustomer.status}
                      onChange={handleCustomerChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>

                  </div>

                </div>

                {/* Default Values */}

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">

                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total Purchase
                      </p>

                      <p className="mt-1 font-semibold">
                        ₹0
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Due Amount
                      </p>

                      <p className="mt-1 font-semibold text-emerald-500">
                        ₹0
                      </p>
                    </div>

                  </div>

                </div>

              </div>

              {/* Modal Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-800">

                <button
                  type="button"
                  onClick={closeAddCustomer}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <Save size={18} />
                  Save Customer
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
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

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>

        </div>

        <div
          className={`rounded-xl p-3 ${iconClass}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   CUSTOMER AVATAR
========================================================= */

function CustomerAvatar({ name }) {
  const initials = String(name || "Customer")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
      {initials || "C"}
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-slate-500/10 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}

