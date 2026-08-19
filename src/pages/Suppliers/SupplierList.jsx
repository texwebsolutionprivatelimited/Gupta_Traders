
import { useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
} from "lucide-react";

const initialSupplierData = [
  {
    id: 1,
    name: "Hindustan Distributors",
    contactPerson: "Rajesh Kumar",
    phone: "9876543210",
    email: "hindustan@example.com",
    gstin: "09ABCDE1234F1Z5",
    city: "Lucknow",
    state: "Uttar Pradesh",
    balance: 25000,
    status: "Active",
  },
  {
    id: 2,
    name: "Gupta FMCG Suppliers",
    contactPerson: "Amit Gupta",
    phone: "9123456780",
    email: "guptafmcg@example.com",
    gstin: "09FGHIJ5678K1Z2",
    city: "Lucknow",
    state: "Uttar Pradesh",
    balance: 18500,
    status: "Active",
  },
  {
    id: 3,
    name: "Shree Grocery Traders",
    contactPerson: "Suresh Verma",
    phone: "9988776655",
    email: "shreegrocery@example.com",
    gstin: "09LMNOP9012Q1Z8",
    city: "Lucknow",
    state: "Uttar Pradesh",
    balance: 12000,
    status: "Active",
  },
  {
    id: 4,
    name: "Fresh Foods Supply",
    contactPerson: "Rahul Singh",
    phone: "9871234567",
    email: "freshfoods@example.com",
    gstin: "09XYZAB1234C1Z9",
    city: "Kanpur",
    state: "Uttar Pradesh",
    balance: 23500,
    status: "Active",
  },
  {
    id: 5,
    name: "Raj Wholesale Market",
    contactPerson: "Vikas Raj",
    phone: "9874563210",
    email: "rajwholesale@example.com",
    gstin: "09PQRST7890A1Z7",
    city: "Varanasi",
    state: "Uttar Pradesh",
    balance: 0,
    status: "Inactive",
  },
];

const emptyForm = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  city: "",
  state: "",
  balance: "",
  status: "Active",
};

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState(initialSupplierData);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [viewSupplier, setViewSupplier] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteSupplier, setDeleteSupplier] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  /* =========================================================
     FILTER SUPPLIERS
  ========================================================= */

  const filteredSuppliers = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        !searchValue ||
        supplier.name.toLowerCase().includes(searchValue) ||
        supplier.contactPerson
          .toLowerCase()
          .includes(searchValue) ||
        supplier.phone.includes(searchValue) ||
        supplier.email.toLowerCase().includes(searchValue) ||
        supplier.gstin.toLowerCase().includes(searchValue) ||
        supplier.city.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        supplier.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  /* =========================================================
     STATS
  ========================================================= */

  const totalBalance = filteredSuppliers.reduce(
    (sum, supplier) => sum + Number(supplier.balance || 0),
    0
  );

  const activeSuppliers = filteredSuppliers.filter(
    (supplier) => supplier.status === "Active"
  ).length;

  const inactiveSuppliers = filteredSuppliers.filter(
    (supplier) => supplier.status === "Inactive"
  ).length;

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================================
     VIEW
  ========================================================= */

  const handleView = (supplier) => {
    setViewSupplier(supplier);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);

    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      gstin: supplier.gstin,
      city: supplier.city,
      state: supplier.state,
      balance: supplier.balance,
      status: supplier.status,
    });
  };

  const closeEditModal = () => {
    setEditingSupplier(null);
    setFormData(emptyForm);
  };

  const handleUpdate = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter supplier name.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Please enter phone number.");
      return;
    }

    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === editingSupplier.id
          ? {
              ...supplier,
              name: formData.name.trim(),
              contactPerson: formData.contactPerson.trim(),
              phone: formData.phone.trim(),
              email: formData.email.trim(),
              gstin: formData.gstin.trim().toUpperCase(),
              city: formData.city.trim(),
              state: formData.state.trim(),
              balance: Number(formData.balance || 0),
              status: formData.status,
            }
          : supplier
      )
    );

    closeEditModal();

    alert("Supplier updated successfully.");
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = (supplier) => {
    setDeleteSupplier(supplier);
  };

  const confirmDelete = () => {
    if (!deleteSupplier) return;

    setSuppliers((prev) =>
      prev.filter(
        (supplier) => supplier.id !== deleteSupplier.id
      )
    );

    setDeleteSupplier(null);

    alert("Supplier deleted successfully.");
  };

  /* =========================================================
     CURRENCY
  ========================================================= */

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Suppliers / Supplier List
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Supplier List
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View and manage all registered suppliers.
          </p>
        </div>

        {/* =====================================================
            STATS
        ===================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Suppliers"
            value={filteredSuppliers.length}
            icon={<Building2 size={20} />}
            iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />

          <StatCard
            title="Active Suppliers"
            value={activeSuppliers}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />

          <StatCard
            title="Inactive Suppliers"
            value={inactiveSuppliers}
            icon={<AlertCircle size={20} />}
            iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />

          <StatCard
            title="Outstanding"
            value={formatCurrency(totalBalance)}
            icon={<Wallet size={20} />}
            iconClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
                placeholder="Search supplier, phone, GSTIN, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

          </div>
        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">

                  <th className="px-5 py-4 text-left">
                    Supplier
                  </th>

                  <th className="px-5 py-4 text-left">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left">
                    GSTIN
                  </th>

                  <th className="px-5 py-4 text-left">
                    Location
                  </th>

                  <th className="px-5 py-4 text-right">
                    Balance
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

                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (

                    <tr
                      key={supplier.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >

                      {/* Supplier */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                            {supplier.name
                              .split(" ")
                              .slice(0, 2)
                              .map((word) => word[0])
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {supplier.name}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {supplier.contactPerson}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* Contact */}

                      <td className="px-5 py-4">

                        <p className="text-sm">
                          {supplier.phone}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {supplier.email}
                        </p>

                      </td>

                      {/* GSTIN */}

                      <td className="px-5 py-4">

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {supplier.gstin}
                        </span>

                      </td>

                      {/* Location */}

                      <td className="px-5 py-4">

                        <p className="text-sm">
                          {supplier.city}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {supplier.state}
                        </p>

                      </td>

                      {/* Balance */}

                      <td className="px-5 py-4 text-right">

                        <span className="font-semibold">
                          {formatCurrency(supplier.balance)}
                        </span>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-4 text-center">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            supplier.status === "Active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}
                        >
                          {supplier.status}
                        </span>

                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">

                        <div className="flex justify-center gap-2">

                          <ActionButton
                            title="View Supplier"
                            icon={<Eye size={17} />}
                            onClick={() => handleView(supplier)}
                          />

                          <ActionButton
                            title="Edit Supplier"
                            icon={<Pencil size={17} />}
                            onClick={() => handleEdit(supplier)}
                            edit
                          />

                          <ActionButton
                            title="Delete Supplier"
                            icon={<Trash2 size={17} />}
                            onClick={() => handleDelete(supplier)}
                            danger
                          />

                        </div>

                      </td>

                    </tr>

                  ))
                ) : (

                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-14 text-center"
                    >
                      <div className="flex flex-col items-center">

                        <Search
                          size={32}
                          className="text-slate-300 dark:text-slate-600"
                        />

                        <p className="mt-3 font-semibold">
                          No suppliers found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or filter.
                        </p>

                      </div>
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>
        </div>

      </div>

      {/* =======================================================
          VIEW MODAL
      ======================================================= */}

      {viewSupplier && (
        <ModalOverlay onClose={() => setViewSupplier(null)}>

          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400">
                  {viewSupplier.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    {viewSupplier.name}
                  </h2>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Supplier Details
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => setViewSupplier(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>

            </div>

            <div className="grid max-h-[65vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">

              <DetailItem
                label="Contact Person"
                value={viewSupplier.contactPerson}
              />

              <DetailItem
                label="Phone Number"
                value={viewSupplier.phone}
              />

              <DetailItem
                label="Email Address"
                value={viewSupplier.email}
              />

              <DetailItem
                label="GSTIN"
                value={viewSupplier.gstin}
              />

              <DetailItem
                label="City"
                value={viewSupplier.city}
              />

              <DetailItem
                label="State"
                value={viewSupplier.state}
              />

              <DetailItem
                label="Balance"
                value={formatCurrency(viewSupplier.balance)}
              />

              <DetailItem
                label="Status"
                value={viewSupplier.status}
              />

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">

              <button
                type="button"
                onClick={() => setViewSupplier(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const supplier = viewSupplier;

                  setViewSupplier(null);
                  handleEdit(supplier);
                }}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Edit Supplier
              </button>

            </div>

          </div>

        </ModalOverlay>
      )}

      {/* =======================================================
          EDIT MODAL
      ======================================================= */}

      {editingSupplier && (
        <ModalOverlay onClose={closeEditModal}>

          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">

              <div>
                <h2 className="text-xl font-bold">
                  Edit Supplier
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update supplier information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleUpdate}>

              <div className="grid max-h-[65vh] gap-5 overflow-y-auto p-5 sm:grid-cols-2">

                <FormField
                  label="Supplier Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

                <FormField
                  label="Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                  required
                />

                <FormField
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                />

                <FormField
                  label="GSTIN"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  maxLength={15}
                />

                <FormField
                  label="Balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  type="number"
                  min="0"
                />

                <FormField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />

                <FormField
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-white dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Save size={17} />
                  Update Supplier
                </button>

              </div>

            </form>

          </div>

        </ModalOverlay>
      )}

      {/* =======================================================
          DELETE MODAL
      ======================================================= */}

      {deleteSupplier && (
        <ModalOverlay onClose={() => setDeleteSupplier(null)}>

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-xl font-bold">
              Delete Supplier?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800 dark:text-white">
                {deleteSupplier.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setDeleteSupplier(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Delete Supplier
              </button>

            </div>

          </div>

        </ModalOverlay>
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
  icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-start justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
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
   ACTION BUTTON
========================================================= */

function ActionButton({
  title,
  icon,
  onClick,
  edit = false,
  danger = false,
}) {
  let className =
    "rounded-lg p-2 transition ";

  if (danger) {
    className +=
      "text-slate-400 hover:bg-rose-500/10 hover:text-rose-500";
  } else if (edit) {
    className +=
      "text-slate-400 hover:bg-blue-500/10 hover:text-blue-500";
  } else {
    className +=
      "text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500";
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={className}
    >
      {icon}
    </button>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength,
  min,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        min={min}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">

      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value || "-"}
      </p>

    </div>
  );
}

/* =========================================================
   MODAL OVERLAY
========================================================= */

function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
}

