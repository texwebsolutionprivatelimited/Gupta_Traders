import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AddSupplier() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    openingBalance: "",
    status: "Active",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Supplier name is required");
      return;
    }

    if (!formData.phone) {
      alert("Phone number is required");
      return;
    }

    const existingSuppliers =
      JSON.parse(localStorage.getItem("suppliers")) || [];

    const newSupplier = {
      id: Date.now(),
      ...formData,
      openingBalance: Number(formData.openingBalance || 0),
    };

    localStorage.setItem(
      "suppliers",
      JSON.stringify([newSupplier, ...existingSuppliers])
    );

    alert("Supplier added successfully!");
    navigate("/suppliers/list");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/suppliers/list"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Back to Supplier List
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Add Supplier
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create a new supplier record.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Supplier Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <InputField
                label="Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
              />

              <InputField
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <InputField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />

              <InputField
                label="GSTIN"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
              />

              <InputField
                label="Opening Balance"
                name="openingBalance"
                type="number"
                value={formData.openingBalance}
                onChange={handleChange}
              />

              <InputField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />

              <InputField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Address
              </label>

              <textarea
                rows="4"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter supplier address"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
              >
                <option
                  value="Active"
                  className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                >
                  Active
                </option>
                <option
                  value="Inactive"
                  className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                >
                  Inactive
                </option>
              </select>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                Save Supplier
              </button>

              <Link
                to="/suppliers/list"
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
      />
    </div>
  );
}