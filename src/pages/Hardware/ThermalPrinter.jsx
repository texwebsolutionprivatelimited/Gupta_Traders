import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Printer,
  Settings2,
  TestTube2,
  XCircle,
} from "lucide-react";

export default function ThermalPrinter() {
  const [connected, setConnected] = useState(true);

  const [printerName, setPrinterName] = useState(
    "Thermal Receipt Printer"
  );

  const [connectionType, setConnectionType] = useState("USB");
  const [paperSize, setPaperSize] = useState("80mm");
  const [printDensity, setPrintDensity] = useState("Medium");
  const [copies, setCopies] = useState(1);

  const [autoPrint, setAutoPrint] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastPrint, setLastPrint] = useState("");

  const handleSave = () => {
    const settings = {
      printerName,
      connectionType,
      paperSize,
      printDensity,
      copies,
      autoPrint,
    };

    localStorage.setItem(
      "thermalPrinterSettings",
      JSON.stringify(settings)
    );

    alert("Thermal printer settings saved successfully.");
  };

  const handleReset = () => {
    setPrinterName("Thermal Receipt Printer");
    setConnectionType("USB");
    setPaperSize("80mm");
    setPrintDensity("Medium");
    setCopies(1);
    setAutoPrint(false);
    setShowPreview(false);
    setLastPrint("");

    localStorage.removeItem("thermalPrinterSettings");

    alert("Thermal printer settings reset.");
  };

  const handleTestPrint = () => {
    if (!connected) {
      alert("Please connect the thermal printer first.");
      return;
    }

    const now = new Date();

    setLastPrint(
      now.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );

    alert("Test print sent successfully.");
  };

  const handlePrintSample = () => {
    if (!connected) {
      alert("Please connect the printer first.");
      return;
    }

    setShowPreview(true);
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
            <ArrowLeft size={16} />
            Back to Hardware
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Printer size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
                Thermal Printer
              </h1>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Configure your thermal receipt printer.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  connected
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {connected ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <XCircle size={24} />
                )}
              </div>

              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                  Printer Status
                </h2>

                <p
                  className={`text-sm font-medium ${
                    connected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {connected
                    ? "Printer Connected"
                    : "Printer Disconnected"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setConnected((current) => !current)
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                connected
                  ? "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                  : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              }`}
            >
              {connected
                ? "Disconnect"
                : "Connect Printer"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Printer Settings */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600 dark:text-violet-400">
                <Settings2 size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                  Printer Settings
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Configure receipt printing.
                </p>
              </div>
            </div>

            <div className="space-y-5">

              <FormField label="Printer Name">
                <input
                  type="text"
                  value={printerName}
                  onChange={(e) =>
                    setPrinterName(e.target.value)
                  }
                  className="input-field"
                  placeholder="Enter printer name"
                />
              </FormField>

              <FormField label="Connection Type">
                <select
                  value={connectionType}
                  onChange={(e) =>
                    setConnectionType(e.target.value)
                  }
                  className="input-field"
                >
                  <option value="USB">USB</option>
                  <option value="Bluetooth">
                    Bluetooth
                  </option>
                  <option value="Network">
                    Network
                  </option>
                  <option value="Serial">
                    Serial Port
                  </option>
                </select>
              </FormField>

              <FormField label="Paper Size">
                <select
                  value={paperSize}
                  onChange={(e) =>
                    setPaperSize(e.target.value)
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

              <FormField label="Print Density">
                <select
                  value={printDensity}
                  onChange={(e) =>
                    setPrintDensity(e.target.value)
                  }
                  className="input-field"
                >
                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>
                </select>
              </FormField>

              <FormField label="Number of Copies">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={copies}
                  onChange={(e) =>
                    setCopies(
                      Math.max(
                        1,
                        Math.min(
                          10,
                          Number(e.target.value) || 1
                        )
                      )
                    )
                  }
                  className="input-field"
                />
              </FormField>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    Auto Print Invoice
                  </p>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Automatically print after completing a sale.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) =>
                    setAutoPrint(e.target.checked)
                  }
                  className="h-5 w-5 rounded accent-emerald-600 dark:accent-emerald-500"
                />
              </label>

            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                Save Settings
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset
              </button>

            </div>
          </section>

          {/* Test Printer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                <TestTube2 size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                  Printer Test
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Test your thermal printer before billing.
                </p>
              </div>
            </div>

            <div className="space-y-4">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Selected Printer
                </p>

                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-50">
                  {printerName}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Connection
                    </p>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {connectionType}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Paper
                    </p>
                    <p className="font-medium text-slate-900 dark:text-slate-200">
                      {paperSize}
                    </p>
                  </div>

                </div>
              </div>

              <button
                type="button"
                onClick={handleTestPrint}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Printer size={18} />
                Print Test Receipt
              </button>

              <button
                type="button"
                onClick={handlePrintSample}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Preview Sample Receipt
              </button>

              {lastPrint && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">

                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={17} />

                    <span className="text-sm font-semibold">
                      Test print sent
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                    {lastPrint}
                  </p>

                </div>
              )}

              {showPreview && (
                <div className="rounded-xl border border-slate-300 bg-white p-5 font-mono text-slate-900 shadow-inner dark:border-slate-700 dark:bg-slate-100 dark:text-slate-950">

                  <div className="mx-auto max-w-[300px] text-center text-xs">

                    <h3 className="text-lg font-bold">
                      GUPTA TRADERS
                    </h3>

                    <p>Lucknow, Uttar Pradesh</p>

                    <p>GSTIN: 09ABCDE1234F1Z5</p>

                    <div className="my-3 border-t border-dashed border-slate-400" />

                    <div className="flex justify-between">
                      <span>Test Item</span>
                      <span>₹100.00</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Quantity</span>
                      <span>1</span>
                    </div>

                    <div className="my-3 border-t border-dashed border-slate-400" />

                    <div className="flex justify-between font-bold">
                      <span>TOTAL</span>
                      <span>₹100.00</span>
                    </div>

                    <p className="mt-4">
                      *** TEST RECEIPT ***
                    </p>

                  </div>

                </div>
              )}

            </div>
          </section>
        </div>

        {/* Information */}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">

          <h3 className="font-semibold text-blue-800 dark:text-blue-300">
            Thermal Printer Information
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li>
              • 58mm and 80mm thermal paper sizes are supported.
            </li>

            <li>
              • USB, Bluetooth, Network and Serial connections are available.
            </li>

            <li>
              • Use the test receipt to verify printer configuration.
            </li>

            <li>
              • Enable Auto Print if invoices should print automatically after billing.
            </li>
          </ul>

        </div>

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

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {children}
    </div>
  );
}