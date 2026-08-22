import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Usb,
  Printer,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  FileText,
} from "lucide-react";

const defaultSettings = {
  printerName: "",
  usbPort: "",
  paperSize: "80mm",
  printCopies: 1,
  autoPrint: true,
};

export default function USBPrinter() {
  const [settings, setSettings] = useState(defaultSettings);
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("usbPrinterSettings");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === "object") {
          setSettings({
            ...defaultSettings,
            ...parsed,
          });

          setConnected(Boolean(parsed.connected));
        }
      }
    } catch (error) {
      console.error("Failed to load USB printer settings:", error);
    }
  }, []);

  const updateSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    setMessage("");
  };

  const handleSave = () => {
    setSaving(true);

    const data = {
      ...settings,
      connected,
    };

    localStorage.setItem(
      "usbPrinterSettings",
      JSON.stringify(data)
    );

    setTimeout(() => {
      setSaving(false);
      setMessage("USB printer settings saved successfully.");
    }, 500);
  };

  const handleConnect = () => {
    if (!settings.printerName) {
      setMessage("Please enter printer name first.");
      return;
    }

    if (!settings.usbPort) {
      setMessage("Please enter USB port first.");
      return;
    }

    setConnected(true);

    const data = {
      ...settings,
      connected: true,
    };

    localStorage.setItem(
      "usbPrinterSettings",
      JSON.stringify(data)
    );

    setMessage("USB printer connected successfully.");
  };

  const handleDisconnect = () => {
    setConnected(false);

    const data = {
      ...settings,
      connected: false,
    };

    localStorage.setItem(
      "usbPrinterSettings",
      JSON.stringify(data)
    );

    setMessage("USB printer disconnected.");
  };

  const handleTestPrint = () => {
    if (!connected) {
      setMessage("Please connect the USB printer first.");
      return;
    }

    setMessage("Test print sent successfully.");

    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleRefresh = () => {
    setMessage("Checking USB printer connection...");

    setTimeout(() => {
      if (connected) {
        setMessage("USB printer is connected.");
      } else {
        setMessage("No USB printer connected.");
      }
    }, 500);
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <Link
            to="/hardware"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <ArrowLeft size={17} />
            Back to Hardware
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Usb size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
                  USB Printer
                </h1>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Configure and manage your USB receipt printer.
                </p>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div
              className={`inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-sm font-semibold sm:self-auto ${
                connected
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
              }`}
            >
              {connected ? (
                <CheckCircle2 size={18} />
              ) : (
                <XCircle size={18} />
              )}

              {connected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>

        {/* Banner Message */}
        {message && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
              message.toLowerCase().includes("successfully") ||
              message.includes("connected")
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Printer Configuration */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Printer Configuration
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Enter the details of your USB thermal printer.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* Printer Name */}
              <FormField label="Printer Name" required>
                <input
                  type="text"
                  value={settings.printerName}
                  onChange={(e) =>
                    updateSetting(
                      "printerName",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Epson TM-T82"
                  className="input-field"
                />
              </FormField>

              {/* USB Port */}
              <FormField label="USB Port" required>
                <input
                  type="text"
                  value={settings.usbPort}
                  onChange={(e) =>
                    updateSetting(
                      "usbPort",
                      e.target.value
                    )
                  }
                  placeholder="e.g. USB001"
                  className="input-field"
                />
              </FormField>

              {/* Paper Size */}
              <FormField label="Paper Size">
                <select
                  value={settings.paperSize}
                  onChange={(e) =>
                    updateSetting(
                      "paperSize",
                      e.target.value
                    )
                  }
                  className="input-field"
                >
                  <option value="58mm">
                    58mm
                  </option>

                  <option value="80mm">
                    80mm
                  </option>
                </select>
              </FormField>

              {/* Copies */}
              <FormField label="Print Copies">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.printCopies}
                  onChange={(e) =>
                    updateSetting(
                      "printCopies",
                      Math.max(
                        1,
                        Number(e.target.value) || 1
                      )
                    )
                  }
                  className="input-field"
                />
              </FormField>

            </div>

            {/* Auto Print Toggle */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/70">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    Auto Print Invoice
                  </p>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Automatically print invoice after successful billing.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.autoPrint}
                  onChange={(e) =>
                    updateSetting(
                      "autoPrint",
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 rounded accent-emerald-600 dark:accent-emerald-500"
                />
              </label>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                {saving ? (
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

                {saving
                  ? "Saving..."
                  : "Save Settings"}
              </button>

              {!connected ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  <Usb size={18} />
                  Connect Printer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                >
                  <XCircle size={18} />
                  Disconnect
                </button>
              )}

            </div>
          </section>

          {/* Printer Status Panel */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <Printer size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                  Printer Status
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Current printer information
                </p>
              </div>
            </div>

            <div className="space-y-4">

              <StatusRow
                label="Connection"
                value={
                  connected
                    ? "Connected"
                    : "Disconnected"
                }
                active={connected}
              />

              <StatusRow
                label="Printer"
                value={
                  settings.printerName ||
                  "Not configured"
                }
                active={Boolean(settings.printerName)}
              />

              <StatusRow
                label="USB Port"
                value={
                  settings.usbPort ||
                  "Not configured"
                }
                active={Boolean(settings.usbPort)}
              />

              <StatusRow
                label="Paper"
                value={settings.paperSize}
                active
              />

              <StatusRow
                label="Copies"
                value={settings.printCopies}
                active
              />

            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={17} />
              Check Connection
            </button>

            <button
              type="button"
              onClick={handleTestPrint}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <FileText size={17} />
              Test Print
            </button>

          </section>
        </div>

        {/* Information Notice */}
        <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">

          <div className="flex items-start gap-3">

            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Printer size={18} />
            </div>

            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                USB Printer Setup
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-400">
                Install the printer driver on your computer first,
                then enter the printer name and USB port above.
                Save the settings and use Test Print to verify
                the configuration.
              </p>
            </div>

          </div>

        </section>

      </div>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226, 232, 240);
          background-color: rgb(255, 255, 255);
          padding: 0.7rem 0.9rem;
          font-size: 0.875rem;
          color: rgb(15, 23, 42);
          outline: none;
          transition: all 0.2s;
        }

        .input-field:focus {
          border-color: rgb(16, 185, 129);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .dark .input-field {
          border-color: rgb(30, 41, 59);
          background-color: rgb(15, 23, 42);
          color: rgb(241, 245, 249);
        }

        .dark .input-field:focus {
          border-color: rgb(16, 185, 129);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        }

        .dark .input-field::placeholder {
          color: rgb(100, 116, 139);
        }
      `}</style>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
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

      {children}
    </div>
  );
}

function StatusRow({
  label,
  value,
  active,
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">

      <span className="text-sm text-slate-600 dark:text-slate-400">
        {label}
      </span>

      <span
        className={`text-right text-sm font-semibold ${
          active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {value}
      </span>

    </div>
  );
}