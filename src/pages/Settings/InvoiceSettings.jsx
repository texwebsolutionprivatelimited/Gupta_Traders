
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Save } from "lucide-react";

const defaultInvoice = {
  prefix: "INV-",
  startingNumber: 1001,
  showGST: true,
  showCustomerMobile: true,
  showShopAddress: true,
  showPaymentMode: true,
  footerText: "Thank you for shopping with us!",
};

export default function InvoiceSettings() {
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("invoiceSettings");

      return saved
        ? { ...defaultInvoice, ...JSON.parse(saved) }
        : defaultInvoice;
    } catch {
      return defaultInvoice;
    }
  });

  const update = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "invoiceSettings",
      JSON.stringify(form)
    );

    alert("Invoice settings saved successfully!");
  };

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
          <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-500">
            <FileText size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Invoice Settings
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure invoice numbering and display options.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-5 md:grid-cols-2">

            <Field
              label="Invoice Prefix"
              value={form.prefix}
              onChange={(e) =>
                update("prefix", e.target.value)
              }
            />

            <Field
              label="Starting Invoice Number"
              type="number"
              value={form.startingNumber}
              onChange={(e) =>
                update(
                  "startingNumber",
                  Number(e.target.value)
                )
              }
            />

          </div>

          <div className="mt-6 space-y-3">
            <Toggle
              label="Show GST Details"
              checked={form.showGST}
              onChange={(value) =>
                update("showGST", value)
              }
            />

            <Toggle
              label="Show Customer Mobile"
              checked={form.showCustomerMobile}
              onChange={(value) =>
                update("showCustomerMobile", value)
              }
            />

            <Toggle
              label="Show Shop Address"
              checked={form.showShopAddress}
              onChange={(value) =>
                update("showShopAddress", value)
              }
            />

            <Toggle
              label="Show Payment Mode"
              checked={form.showPaymentMode}
              onChange={(value) =>
                update("showPaymentMode", value)
              }
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium">
              Invoice Footer
            </label>

            <textarea
              rows="3"
              value={form.footerText}
              onChange={(e) =>
                update("footerText", e.target.value)
              }
              className="settings-input resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .settings-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.7rem 0.85rem;
          outline: none;
        }

        .settings-input:focus {
          border-color: rgb(16 185 129);
        }

        .dark .settings-input {
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
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        className="settings-input"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <span className="font-medium">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
        className="h-5 w-5 accent-emerald-500"
      />
    </label>
  );
}

