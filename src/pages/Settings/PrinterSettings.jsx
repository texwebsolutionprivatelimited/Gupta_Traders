
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer, Save } from "lucide-react";

const defaultPrinter = {
  printerType: "Thermal Printer",
  paperSize: "80mm",
  printerName: "",
  autoPrint: false,
  printCopies: 1,
  showPreview: true,
};

export default function PrinterSettings() {
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("printerSettings");

      return saved
        ? { ...defaultPrinter, ...JSON.parse(saved) }
        : defaultPrinter;
    } catch {
      return defaultPrinter;
    }
  });

  const update = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveSettings = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "printerSettings",
      JSON.stringify(form)
    );

    alert("Printer settings saved successfully!");
  };

  const testPrint = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow popups to test printing.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Printer Test</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
            }
          </style>
        </head>

        <body>
          <h2>Gupta Traders</h2>
          <p>Printer Test Successful</p>
          <p>Paper Size: ${form.paperSize}</p>
          <p>Printer: ${form.printerName || "Default Printer"}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-500">
            <Printer size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Printer Settings
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure invoice and receipt printing.
            </p>
          </div>
        </div>

        <form
          onSubmit={saveSettings}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-5 md:grid-cols-2">

            <SelectField
              label="Printer Type"
              value={form.printerType}
              onChange={(e) =>
                update("printerType", e.target.value)
              }
              options={[
                "Thermal Printer",
                "Laser Printer",
                "Inkjet Printer",
              ]}
            />

            <SelectField
              label="Paper Size"
              value={form.paperSize}
              onChange={(e) =>
                update("paperSize", e.target.value)
              }
              options={[
                "58mm",
                "80mm",
                "A4",
                "A5",
              ]}
            />

            <Field
              label="Printer Name"
              value={form.printerName}
              onChange={(e) =>
                update("printerName", e.target.value)
              }
              placeholder="Example: POS-80"
            />

            <Field
              label="Number of Copies"
              type="number"
              min="1"
              value={form.printCopies}
              onChange={(e) =>
                update(
                  "printCopies",
                  Number(e.target.value)
                )
              }
            />
          </div>

          <div className="mt-6 space-y-3">
            <Toggle
              label="Auto Print Invoice"
              checked={form.autoPrint}
              onChange={(value) =>
                update("autoPrint", value)
              }
            />

            <Toggle
              label="Show Print Preview"
              checked={form.showPreview}
              onChange={(value) =>
                update("showPreview", value)
              }
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={testPrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold dark:border-slate-700"
            >
              <Printer size={18} />
              Test Print
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
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
  min,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="settings-input"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        className="settings-input"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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

