
import { useState } from "react";
import { Link } from "react-router-dom";
import { Store, Save, ArrowLeft } from "lucide-react";

const defaultData = {
  shopName: "Gupta Traders",
  ownerName: "Sanjana Yadav",
  phone: "9876543210",
  email: "guptatraders@example.com",
  address: "Lucknow",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pincode: "226001",
};

export default function ShopInformation() {
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("shopInformation");
      return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    } catch {
      return defaultData;
    }
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    localStorage.setItem("shopInformation", JSON.stringify(form));

    alert("Shop information saved successfully!");
  };

  return (
    <SettingsPage
      title="Shop Information"
      description="Manage your shop and business information."
      icon={<Store size={22} />}
    >
      <form onSubmit={handleSubmit}>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Shop Name"
            name="shopName"
            value={form.shopName}
            onChange={handleChange}
            required
          />

          <Field
            label="Owner Name"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
          />

          <Field
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />

          <Field
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />

          <Field
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
          />

          <Field
            label="State"
            name="state"
            value={form.state}
            onChange={handleChange}
          />

          <Field
            label="PIN Code"
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">
            Address
          </label>

          <textarea
            name="address"
            rows="4"
            value={form.address}
            onChange={handleChange}
            className="input-field resize-none"
          />
        </div>

        <SaveButton />
      </form>
    </SettingsPage>
  );
}

function SettingsPage({ title, description, icon, children }) {
  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">

        <Link
          to="/settings"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-400"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            {icon}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {children}
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.7rem 0.85rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input-field:focus {
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 2px rgb(16 185 129 / 0.15);
        }

        .dark .input-field {
          border-color: rgb(51 65 85);
          background: rgb(30 41 59);
          color: white;
        }
      `}</style>
    </div>
  );
}

function Field({
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
        className="input-field"
      />
    </div>
  );
}

function SaveButton() {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
      >
        <Save size={18} />
        Save Changes
      </button>
    </div>
  );
}

