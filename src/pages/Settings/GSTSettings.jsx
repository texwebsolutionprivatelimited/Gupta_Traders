import { Link } from "react-router-dom";
import { ArrowLeft, ReceiptText, Save } from "lucide-react";
import { useBusinessSettings } from '../../hooks/useBusinessSettings'

const defaultGST = {
  enabled: true,
  gstin: "09ABCDE1234F1Z5",
  registrationType: "Regular",
  defaultRate: "18",
  cgst: true,
  sgst: true,
};

export default function GSTSettings() {
  const {form,setForm,save}=useBusinessSettings('gst',defaultGST)

  const update = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{await save();alert("GST settings saved successfully!")}catch(error){alert(error.message)}
  };

  return (
    <PageShell
      title="GST Settings"
      description="Configure GST and tax settings for your business."
      icon={<ReceiptText size={22} />}
    >
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                GST Registration
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enable GST calculation in invoices.
              </p>
            </div>

            <button
              type="button"
              onClick={() => update("enabled", !form.enabled)}
              className={`relative h-7 w-12 rounded-full transition ${
                form.enabled
                  ? "bg-emerald-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  form.enabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="GSTIN"
            value={form.gstin}
            onChange={(e) => update("gstin", e.target.value)}
            placeholder="09ABCDE1234F1Z5"
          />

          <SelectField
            label="Registration Type"
            value={form.registrationType}
            onChange={(e) => update("registrationType", e.target.value)}
            options={["Regular", "Composition", "Unregistered"]}
          />

          <SelectField
            label="Default GST Rate"
            value={form.defaultRate}
            onChange={(e) => update("defaultRate", e.target.value)}
            options={["0", "5", "12", "18", "28"]}
          />
        </div>

        <div className="mt-6 space-y-3">
          <CheckRow
            label="Enable CGST"
            checked={form.cgst}
            onChange={(value) => update("cgst", value)}
          />

          <CheckRow
            label="Enable SGST"
            checked={form.sgst}
            onChange={(value) => update("sgst", value)}
          />
        </div>

        <SaveButton />
      </form>
    </PageShell>
  );
}

function PageShell({ title, description, icon, children }) {
  return (
    <div className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/settings"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-500"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>

        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500">
            {icon}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
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

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
            {label === "Default GST Rate" ? "%" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <span className="font-medium text-slate-900 dark:text-slate-300">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-emerald-500"
      />
    </label>
  );
}

function SaveButton() {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
      >
        <Save size={18} />
        Save Changes
      </button>
    </div>
  );
}
