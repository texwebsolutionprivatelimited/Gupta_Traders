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

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Active Selected Customer State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState(emptyCustomer);
  const [formError, setFormError] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchValue = search.toLowerCase().trim();
      const customerName = String(customer.name || "").toLowerCase();
      const customerMobile = String(customer.mobile || "");

      const matchesSearch =
        customerName.includes(searchValue) || customerMobile.includes(search);
      const matchesStatus =
        statusFilter === "All" || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;
  const totalPurchase = customers.reduce(
    (sum, customer) => sum + Number(customer.totalPurchase || 0),
    0
  );
  const totalDue = customers.reduce(
    (sum, customer) => sum + Number(customer.dueAmount || 0),
    0
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  // --- Handlers ---
  const openAddCustomer = () => {
    setNewCustomer(emptyCustomer);
    setFormError("");
    setShowAddModal(true);
  };

  const closeAddCustomer = () => {
    setShowAddModal(false);
    setNewCustomer(emptyCustomer);
    setFormError("");
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    const name = newCustomer.name.trim();
    const mobile = newCustomer.mobile.trim();
    const email = newCustomer.email.trim();
    const address = newCustomer.address.trim();

    if (!name) return setFormError("Please enter customer name.");
    if (!mobile) return setFormError("Please enter mobile number.");
    if (!/^[0-9]{10}$/.test(mobile))
      return setFormError("Mobile number must contain exactly 10 digits.");

    if (customers.some((c) => String(c.mobile || "") === mobile)) {
      return setFormError("A customer with this mobile number already exists.");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setFormError("Please enter a valid email address.");
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

    const updated = [customer, ...customers];
    setCustomers(updated);
    localStorage.setItem("customers", JSON.stringify(updated));
    closeAddCustomer();
  };

  // --- VIEW ACTION ---
  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  // --- EDIT ACTION ---
  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormError("");
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const name = selectedCustomer.name.trim();
    const mobile = selectedCustomer.mobile.trim();

    if (!name) return setFormError("Please enter customer name.");
    if (!mobile || !/^[0-9]{10}$/.test(mobile))
      return setFormError("Mobile number must contain exactly 10 digits.");

    const duplicate = customers.some(
      (c) => c.id !== selectedCustomer.id && String(c.mobile || "") === mobile
    );
    if (duplicate) {
      return setFormError("Another customer already has this mobile number.");
    }

    const updated = customers.map((item) =>
      item.id === selectedCustomer.id ? selectedCustomer : item
    );

    setCustomers(updated);
    localStorage.setItem("customers", JSON.stringify(updated));
    setShowEditModal(false);
  };

  // --- DELETE ACTION ---
  const handleDelete = (id) => {
    const customer = customers.find((item) => item.id === id);
    if (!customer) return;

    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      const updated = customers.filter((item) => item.id !== id);
      setCustomers(updated);
      localStorage.setItem("customers", JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 transition-colors duration-200 sm:p-6 lg:p-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Customers</span>
              <span>/</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Customer List
              </span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl dark:text-slate-100">
              Customer List
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage customers, purchases and outstanding dues.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddCustomer}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>

        {/* STATS */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            subtitle="All registered customers"
            icon={<Users size={21} />}
            iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Active Customers"
            value={activeCustomers}
            subtitle="Currently active"
            icon={<Users size={21} />}
            iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Total Purchase"
            value={formatCurrency(totalPurchase)}
            subtitle="Customer purchase value"
            icon={<ShoppingCart size={21} />}
            iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <StatCard
            title="Total Due"
            value={formatCurrency(totalDue)}
            subtitle="Outstanding customer dues"
            icon={<Wallet size={21} />}
            iconClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                placeholder="Search customer by name or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* CUSTOMER TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Mobile Number</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4 text-right">Purchase</th>
                  <th className="px-5 py-4 text-right">Due</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar name={customer.name} />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-50">
                              {customer.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {customer.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {customer.mobile}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[220px] truncate text-sm text-slate-600 dark:text-slate-400">
                          {customer.address || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-slate-50">
                        {formatCurrency(customer.totalPurchase)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span
                          className={`font-semibold ${
                            Number(customer.dueAmount) > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formatCurrency(customer.dueAmount)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={customer.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            title="View Customer"
                            onClick={() => handleView(customer)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            title="Edit Customer"
                            onClick={() => handleEdit(customer)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-500/10 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            title="Delete Customer"
                            onClick={() => handleDelete(customer.id)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <AlertCircle
                        size={30}
                        className="mx-auto mb-2 text-slate-400 dark:text-slate-600"
                      />
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        No customers found
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) =>
            e.target === e.currentTarget && closeAddCustomer()
          }
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <UserPlus size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
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
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer}>
              <div className="max-h-[70vh] overflow-y-auto p-5">
                {formError && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCustomer.name}
                      onChange={handleCustomerChange}
                      placeholder="Enter customer name"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={newCustomer.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setNewCustomer((prev) => ({ ...prev, mobile: val }));
                        setFormError("");
                      }}
                      placeholder="10 digit mobile number"
                      maxLength={10}
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newCustomer.email}
                      onChange={handleCustomerChange}
                      placeholder="customer@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Address
                    </label>
                    <textarea
                      name="address"
                      rows="3"
                      value={newCustomer.address}
                      onChange={handleCustomerChange}
                      placeholder="Enter customer address"
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      name="status"
                      value={newCustomer.status}
                      onChange={handleCustomerChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeAddCustomer}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <Save size={18} />
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER MODAL */}
      {showViewModal && selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setShowViewModal(false)
          }
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Customer Details
              </h2>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <CustomerAvatar name={selectedCustomer.name} />
                <div>
                  <h3 className="text-xl font-bold dark:text-white">
                    {selectedCustomer.name}
                  </h3>
                  <StatusBadge status={selectedCustomer.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Mobile</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.mobile}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.email || "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.address || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Purchase</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedCustomer.totalPurchase)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due Amount</p>
                  <p className="font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(selectedCustomer.dueAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setShowEditModal(false)
          }
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Edit Customer
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.name}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.mobile}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedCustomer.email}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        email: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    Address
                  </label>
                  <textarea
                    value={selectedCustomer.address}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={selectedCustomer.status}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        status: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 p-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white hover:bg-emerald-600"
                >
                  Update Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-purple-400">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}

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

function StatusBadge({ status }) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
}