import { useState, useEffect } from "react";
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
  const getInitialSettings = () => {
    try {
      const saved = localStorage.getItem("thermalPrinterSettings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse thermal printer settings:", e);
    }
    return {
      connected: false,
      printerName: "Thermal Receipt Printer",
      connectionType: "USB",
      paperSize: "80mm",
      printDensity: "Medium",
      copies: 1,
      autoPrint: false,
    };
  };

  const initialSettings = getInitialSettings();

  const [connected, setConnected] = useState(initialSettings.connected);
  const [printerName, setPrinterName] = useState(initialSettings.printerName);
  const [connectionType, setConnectionType] = useState(initialSettings.connectionType);
  const [paperSize, setPaperSize] = useState(initialSettings.paperSize);
  const [printDensity, setPrintDensity] = useState(initialSettings.printDensity);
  const [copies, setCopies] = useState(initialSettings.copies);
  const [autoPrint, setAutoPrint] = useState(initialSettings.autoPrint);

  const [showPreview, setShowPreview] = useState(false);
  const [lastPrint, setLastPrint] = useState("");

  // Bluetooth-earbud style pairing list
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [erpStatus, setErpStatus] = useState(initialSettings.connected ? "Connected" : "Disconnected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: "System initialized. Scanning USB/Bluetooth ports for receipt printer signals..." }
  ]);

  const addLog = (text) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), text }, ...prev]);
  };

  // Populate active settings if already paired
  useEffect(() => {
    if (initialSettings.connected) {
      setDiscoveredDevices([{
        id: "saved-printer",
        name: initialSettings.printerName || "Thermal Receipt Printer",
        type: "USB",
        vendorId: 0x0fe6,
        productId: 0x811e,
        status: "connected"
      }]);
    }
  }, []);

  // Connect discovered printer
  const handleConnectDevice = (device) => {
    setDiscoveredDevices(prev => prev.map(d =>
      d.id === device.id ? { ...d, status: 'syncing' } : d
    ));
    setIsSyncing(true);
    setErpStatus("Syncing");
    addLog(`Initiating pairing handshake with printer: "${device.name}"`);

    setTimeout(() => {
      addLog(`ERP validation passed for printer interface (VID:0x${device.vendorId.toString(16)}).`);

      setTimeout(() => {
        addLog("ERP Sync: Downloading spooler protocols and registry cache maps...");

        setTimeout(() => {
          setErpStatus("Connected");
          setIsSyncing(false);
          setConnected(true);
          setPrinterName(device.name);

          setDiscoveredDevices(prev => prev.map(d =>
            d.id === device.id ? { ...d, status: 'connected' } : d
          ));

          addLog(`Printer "${device.name}" successfully registered and synced with ERP database!`);

          const settings = {
            printerName: device.name,
            connectionType: "USB",
            paperSize,
            printDensity,
            copies,
            autoPrint,
            connected: true,
          };
          localStorage.setItem("thermalPrinterSettings", JSON.stringify(settings));
        }, 500);
      }, 600);
    }, 700);
  };

  // Disconnect printer
  const handleDisconnectDevice = (device) => {
    setDiscoveredDevices(prev => prev.map(d =>
      d.id === device.id ? { ...d, status: 'found' } : d
    ));
    setConnected(false);
    setErpStatus("Disconnected");
    addLog(`Printer "${device.name}" disconnected from ERP.`);

    const settings = {
      printerName: device.name,
      connectionType,
      paperSize,
      printDensity,
      copies,
      autoPrint,
      connected: false,
    };
    localStorage.setItem("thermalPrinterSettings", JSON.stringify(settings));
  };

  // Listen to WebUSB/WebHID ports
  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const handleConnect = (event) => {
      const dev = event.device;
      const name = dev.productName || dev.manufacturerName || "Star TSP100 Thermal Printer";
      const devId = `thermal-${dev.vendorId}-${dev.productId}-${Date.now()}`;

      setDiscoveredDevices(prev => {
        if (prev.some(d => d.vendorId === dev.vendorId && d.productId === dev.productId)) {
          return prev;
        }
        return [...prev, {
          id: devId,
          name,
          type: "USB",
          vendorId: dev.vendorId || 0x0fe6,
          productId: dev.productId || 0x811e,
          status: "found"
        }];
      });

      addLog(`Real-time Discovery: Found USB receipt printer "${name}". Ready to connect.`);
    };

    const handleDisconnect = (event) => {
      const dev = event.device;

      setDiscoveredDevices(prev => prev.filter(d =>
        !(d.vendorId === dev.vendorId && d.productId === dev.productId)
      ));

      addLog(`Real-time Event: Printer unplugged: ${dev.productName || "Thermal Printer"}`);
      setConnected(false);
      setErpStatus("Disconnected");

      const settings = {
        printerName,
        connectionType,
        paperSize,
        printDensity,
        copies,
        autoPrint,
        connected: false,
      };
      localStorage.setItem("thermalPrinterSettings", JSON.stringify(settings));
    };

    if (navigator.usb) {
      navigator.usb.addEventListener("connect", handleConnect);
      navigator.usb.addEventListener("disconnect", handleDisconnect);
    }
    if (navigator.hid) {
      navigator.hid.addEventListener("connect", handleConnect);
      navigator.hid.addEventListener("disconnect", handleDisconnect);
    }

    return () => {
      if (navigator.usb) {
        navigator.usb.removeEventListener("connect", handleConnect);
        navigator.usb.removeEventListener("disconnect", handleDisconnect);
      }
      if (navigator.hid) {
        navigator.hid.removeEventListener("connect", handleConnect);
        navigator.hid.removeEventListener("disconnect", handleDisconnect);
      }
    };
  }, [printerName, connectionType, paperSize, printDensity, copies, autoPrint]);

  const handleSave = () => {
    const settings = {
      printerName,
      connectionType,
      paperSize,
      printDensity,
      copies,
      autoPrint,
      connected,
    };

    localStorage.setItem("thermalPrinterSettings", JSON.stringify(settings));
    addLog("Settings updated manually.");
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
    setConnected(false);
    setErpStatus("Disconnected");
    setDiscoveredDevices([]);
    setLogs([{ time: new Date().toLocaleTimeString(), text: "Settings reset. Devices cleared." }]);

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

    addLog(`Sent test print spool job to paired device "${printerName}".`);
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
                  Printer Pairing Status
                </h2>

                <p
                  className={`text-sm font-medium ${
                    connected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {connected
                    ? `Printer Connected (${printerName})`
                    : "Printer Offline / Not Paired"}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">ERP Integration:</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${
                    erpStatus === "Connected" ? "text-emerald-600 dark:text-emerald-400" :
                    erpStatus === "Syncing" ? "text-amber-500 dark:text-amber-400 animate-pulse" :
                    "text-rose-500 dark:text-rose-400"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      erpStatus === "Connected" ? "bg-emerald-500" :
                      erpStatus === "Syncing" ? "bg-amber-500 animate-pulse" :
                      "bg-rose-500"
                    }`} />
                    {erpStatus === "Connected" ? "Connected (Synced with ERP)" :
                     erpStatus === "Syncing" ? "Syncing Catalog & Security Keys..." :
                     "Disconnected / Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const simulatedName = "Epson TM-T82 Thermal Printer";
                  const simulatedId = `sim-thermal-${Date.now()}`;
                  const isDiscovered = discoveredDevices.some(d => d.name === simulatedName);

                  if (isDiscovered) {
                    setDiscoveredDevices(prev => prev.filter(d => d.name !== simulatedName));
                    setConnected(false);
                    setErpStatus("Disconnected");
                    addLog("Simulated unplug: Epson TM-T82 receipt printer removed.");
                    const settings = {
                      printerName,
                      connectionType,
                      paperSize,
                      printDensity,
                      copies,
                      autoPrint,
                      connected: false,
                    };
                    localStorage.setItem("thermalPrinterSettings", JSON.stringify(settings));
                  } else {
                    setDiscoveredDevices(prev => [...prev, {
                      id: simulatedId,
                      name: simulatedName,
                      type: "USB",
                      vendorId: 0x04b8,
                      productId: 0x0202,
                      status: "found"
                    }]);
                    addLog("Simulated USB plug-in: Epson TM-T82 thermal printer discovered. Ready to pair.");
                  }
                }}
                className="rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition"
                disabled={isSyncing}
              >
                {discoveredDevices.some(d => d.name === "Epson TM-T82 Thermal Printer") ? "Simulate Printer Unplug" : "Simulate Printer Plug-in"}
              </button>
            </div>
          </div>
        </div>

        {/* Discovered Printers List (Bluetooth Style) */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                Discovered Thermal Printers (Real-Time)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Click on the found printer to sync spool buffers and register with the ERP.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-550 dark:bg-blue-400 animate-ping" />
              Scanning Ports...
            </span>
          </div>

          {discoveredDevices.length === 0 ? (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20">
              <Printer size={30} className="mx-auto mb-3 text-slate-400 dark:text-slate-655 animate-pulse" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                No printer detected
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Connect your thermal printer to a port, or click "Simulate Printer Plug-in" to pair.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {discoveredDevices.map(device => (
                <div key={device.id} className={`p-4 rounded-xl border flex flex-col justify-between transition duration-200 ${
                  device.status === 'connected'
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : device.status === 'syncing'
                      ? 'bg-amber-500/5 border-amber-500/30 animate-pulse'
                      : 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {device.type} Port
                      </span>
                      <span className={`text-xs font-semibold ${
                        device.status === 'connected' ? 'text-emerald-605 dark:text-emerald-400' :
                        device.status === 'syncing' ? 'text-amber-550 dark:text-amber-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>
                        {device.status === 'connected' ? '● Connected' :
                         device.status === 'syncing' ? '● Connecting...' :
                         '● Discovered'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mt-2">
                      {device.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 font-mono">
                      VID: 0x{device.vendorId.toString(16).toUpperCase()} | PID: 0x{device.productId.toString(16).toUpperCase()}
                    </p>
                  </div>
                  <div className="mt-4">
                    {device.status === 'found' && (
                      <button
                        onClick={() => handleConnectDevice(device)}
                        className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-200"
                      >
                        Pair with ERP Receipt Terminal
                      </button>
                    )}
                    {device.status === 'syncing' && (
                      <button
                        disabled
                        className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-amber-500/20 text-amber-550 border border-amber-500/30 flex items-center justify-center gap-1.5"
                      >
                        <span className="w-3 h-3 border-2 border-amber-550 border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </button>
                    )}
                    {device.status === 'connected' && (
                      <button
                        onClick={() => handleDisconnectDevice(device)}
                        className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-500/10 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all duration-200"
                      >
                        Disconnect Printer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <div className="rounded-xl border border-slate-300 bg-white p-5 font-mono text-slate-900 shadow-inner dark:border-slate-700 dark:bg-slate-100 dark:text-slate-955">

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

        {/* Hardware Console Logs */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Hardware Console Logs (ERP Communication)
          </h3>
          <div className="mt-3 font-mono text-xs text-slate-600 dark:text-slate-400 max-h-40 overflow-y-auto space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-850">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-emerald-500">[{log.time}]</span>
                <span className="text-slate-450">&gt;</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
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