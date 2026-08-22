import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Barcode,
    CheckCircle2,
    ScanLine,
    Settings2,
    XCircle,
} from "lucide-react";

export default function BarcodeScanner() {
    const [connected, setConnected] = useState(true);
    const [scannerName, setScannerName] = useState("USB Barcode Scanner");
    const [connectionType, setConnectionType] = useState("USB");
    const [prefix, setPrefix] = useState("");
    const [suffix, setSuffix] = useState("Enter");
    const [barcode, setBarcode] = useState("");
    const [lastScanned, setLastScanned] = useState("");

    const handleTestScan = (e) => {
        e.preventDefault();

        if (!barcode.trim()) {
            alert("Please enter a barcode to test.");
            return;
        }

        setLastScanned(barcode.trim());
        setBarcode("");
    };

    const handleSave = () => {
        const settings = {
            scannerName,
            connectionType,
            prefix,
            suffix,
            connected,
        };

        localStorage.setItem(
            "barcodeScannerSettings",
            JSON.stringify(settings)
        );

        alert("Barcode scanner settings saved successfully.");
    };

    const handleReset = () => {
        setScannerName("USB Barcode Scanner");
        setConnectionType("USB");
        setPrefix("");
        setSuffix("Enter");
        setConnected(true);
        setLastScanned("");
        setBarcode("");

        localStorage.removeItem("barcodeScannerSettings");

        alert("Barcode scanner settings reset.");
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
                            <Barcode size={25} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                                Barcode Scanner
                            </h1>

                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Configure and test your barcode scanner.
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
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Scanner Status
                                </h2>

                                <p
                                    className={`text-sm font-medium ${
                                        connected
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400"
                                    }`}
                                >
                                    {connected
                                        ? "Scanner Connected"
                                        : "Scanner Disconnected"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setConnected((value) => !value)}
                            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                                connected
                                    ? "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                                    : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            }`}
                        >
                            {connected ? "Disconnect" : "Connect Scanner"}
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Scanner Settings */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600 dark:text-violet-400">
                                <Settings2 size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Scanner Settings
                                </h2>

                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Configure scanner input behavior.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">

                            <FormField label="Scanner Name">
                                <input
                                    type="text"
                                    value={scannerName}
                                    onChange={(e) =>
                                        setScannerName(e.target.value)
                                    }
                                    className="input-field"
                                    placeholder="Enter scanner name"
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
                                    <option value="Serial">
                                        Serial Port
                                    </option>
                                </select>
                            </FormField>

                            <FormField label="Barcode Prefix">
                                <input
                                    type="text"
                                    value={prefix}
                                    onChange={(e) =>
                                        setPrefix(e.target.value)
                                    }
                                    className="input-field"
                                    placeholder="Optional prefix"
                                />
                            </FormField>

                            <FormField label="Barcode Suffix">
                                <select
                                    value={suffix}
                                    onChange={(e) =>
                                        setSuffix(e.target.value)
                                    }
                                    className="input-field"
                                >
                                    <option value="Enter">Enter</option>
                                    <option value="Tab">Tab</option>
                                    <option value="None">None</option>
                                </select>
                            </FormField>

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

                    {/* Test Scanner */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                                <ScanLine size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Test Barcode Scanner
                                </h2>

                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Scan or manually enter a barcode.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleTestScan}>

                            <FormField label="Barcode">
                                <input
                                    autoFocus
                                    type="text"
                                    value={barcode}
                                    onChange={(e) =>
                                        setBarcode(e.target.value)
                                    }
                                    placeholder="Scan barcode here..."
                                    className="input-field text-lg tracking-wider"
                                />
                            </FormField>

                            <button
                                type="submit"
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                <ScanLine size={18} />
                                Test Scan
                            </button>

                        </form>

                        {lastScanned && (
                            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">

                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                    Last Scanned Barcode
                                </p>

                                <p className="mt-2 break-all font-mono text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                                    {lastScanned}
                                </p>

                                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 size={16} />
                                    Barcode received successfully
                                </div>

                            </div>
                        )}

                        {!lastScanned && (
                            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">

                                <Barcode
                                    size={40}
                                    className="mx-auto mb-3 text-slate-400 dark:text-slate-600"
                                />

                                <p className="font-medium text-slate-600 dark:text-slate-400">
                                    No barcode scanned yet
                                </p>

                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    Connect your scanner and scan a barcode.
                                </p>

                            </div>
                        )}

                    </section>
                </div>

                {/* Information */}
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">

                    <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                        How to use
                    </h3>

                    <ul className="mt-3 space-y-2 text-sm text-blue-700 dark:text-blue-400">
                        <li>• Connect the barcode scanner through USB or Bluetooth.</li>
                        <li>• Keep the scanner focused on the barcode input field.</li>
                        <li>• Scan a product barcode to test the device.</li>
                        <li>• Configure prefix and suffix according to your scanner.</li>
                        <li>• Save the settings after configuration.</li>
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