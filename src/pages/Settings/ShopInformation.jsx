import { Link } from "react-router-dom";
import { Store, Save, ArrowLeft } from "lucide-react";
import { useBusinessSettings } from '../../hooks/useBusinessSettings'

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
  const {form,setForm,save}=useBusinessSettings('shop',defaultData)

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{await save();alert("Shop information saved successfully!")}catch(error){alert(error.message)}
  };

  return (
    <SettingsPage
      title="Shop Information"
      description="Manage your shop and business information."
      icon={<Store size={22} />}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2 dark:text-white">
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
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Address
          </label>

          <textarea
            name="address"
            rows="4"
            value={form.address}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:border-emerald-500 resize-none"
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
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
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:border-emerald-500"
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
