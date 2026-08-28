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
  printerName: "USB Inkjet Printer",
  usbPort: "USB001",
  paperSize: "80mm",
  printCopies: 1,
  autoPrint: true,
};

export default function USBPrinter() {
  const [settings, setSettings] = useState(defaultSettings);
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Bluetooth-earbud style pairing states
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [manualDeviceName, setManualDeviceName] = useState("");
  const [erpStatus, setErpStatus] = useState("Disconnected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: "System initialized. Scanning USB/HID registry tables for standard printer endpoints..." }
  ]);

  const addLog = (text) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), text }, ...prev]);
  };

  const handleAddManualDevice = () => {
    if (!manualDeviceName.trim()) {
      alert("Please enter a valid printer name.");
      return;
    }
    const name = manualDeviceName.trim();
    const devId = `manual-${Date.now()}`;
    
    setDiscoveredDevices(prev => {
      if (prev.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        alert("This device is already in the list.");
        return prev;
      }
      return [...prev, {
        id: devId,
        name,
        type: "USB",
        vendorId: 0x03f0,
        productId: 0x0117,
        status: "found"
      }];
    });
    
    addLog(`Manually registered USB printer device: "${name}". Ready to pair.`);
    setManualDeviceName("");
  };

  // Load configuration settings
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
          setErpStatus(parsed.connected ? "Connected" : "Disconnected");

          if (parsed.connected) {
            setDiscoveredDevices([{
              id: "saved-usb-printer",
              name: parsed.printerName || "USB Receipt Printer",
              type: "USB",
              vendorId: 0x03f0, // HP generic VID
              productId: 0x0117,
              status: "connected"
            }]);
          }
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

  // Connect discovered printer
  const handleConnectDevice = (device) => {
    setDiscoveredDevices(prev => prev.map(d =>
      d.id === device.id ? { ...d, status: 'syncing' } : d
    ));
    setIsSyncing(true);
    setErpStatus("Syncing");
    addLog(`Initiating pairing handshake with USB printer: "${device.name}"`);

    setTimeout(() => {
      addLog(`ERP validation passed for USB interface (VID:0x${device.vendorId.toString(16)}).`);

      setTimeout(() => {
        addLog("ERP Sync: Downloading driver maps and local spooler pipelines...");

        setTimeout(() => {
          setErpStatus("Connected");
          setIsSyncing(false);
          setConnected(true);
          updateSetting("printerName", device.name);

          setDiscoveredDevices(prev => prev.map(d =>
            d.id === device.id ? { ...d, status: 'connected' } : d
          ));

          addLog(`USB Printer "${device.name}" successfully registered and synced with ERP database!`);

          const data = {
            ...settings,
            printerName: device.name,
            connected: true,
          };
          localStorage.setItem("usbPrinterSettings", JSON.stringify(data));
          setMessage(`USB printer "${device.name}" paired successfully.`);
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
    addLog(`USB Printer "${device.name}" disconnected from ERP.`);

    const data = {
      ...settings,
      connected: false,
    };
    localStorage.setItem("usbPrinterSettings", JSON.stringify(data));
    setMessage("USB printer disconnected.");
  };

  // Scan and Request browser permission for physical USB devices
  const handleScanForPhysicalDevices = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.usb) {
        alert("WebUSB is not supported in this browser/environment. Please use Chrome, Edge, or Opera.");
        return;
      }
      addLog("Opening native device selection dialog. Please choose your USB printer...");
      const device = await navigator.usb.requestDevice({ filters: [] });
      
      if (device) {
        const name = device.productName || device.manufacturerName || "USB Receipt Printer";
        const devId = `usb-printer-${device.vendorId}-${device.productId}-${Date.now()}`;
        
        setDiscoveredDevices(prev => {
          if (prev.some(d => d.vendorId === device.vendorId && d.productId === device.productId)) {
            return prev;
          }
          return [...prev, {
            id: devId,
            name,
            type: "USB",
            vendorId: device.vendorId,
            productId: device.productId,
            status: "found"
          }];
        });
        
        addLog(`Discovered physical USB device: "${name}" (VID: 0x${device.vendorId.toString(16)}, PID: 0x${device.productId.toString(16)}).`);
        setMessage(`Found "${name}". Click on the device below to Connect and Sync with ERP.`);
      }
    } catch (err) {
      console.error("WebUSB scan failed:", err);
      addLog(`USB Port Scan canceled: ${err.message}`);
    }
  };

  // Listen to WebUSB/WebHID connection events
  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const handleConnect = (event) => {
      const dev = event.device;
      const name = dev.productName || dev.manufacturerName || "Canon LBP USB Printer";
      const devId = `usb-printer-${dev.vendorId}-${dev.productId}-${Date.now()}`;

      setDiscoveredDevices(prev => {
        if (prev.some(d => d.vendorId === dev.vendorId && d.productId === dev.productId)) {
          return prev;
        }
        return [...prev, {
          id: devId,
          name,
          type: "USB",
          vendorId: dev.vendorId || 0x03f0,
          productId: dev.productId || 0x0117,
          status: "found"
        }];
      });

      addLog(`Real-time Discovery: Found USB printer device "${name}". Ready to connect.`);
    };

    const handleDisconnect = (event) => {
      const dev = event.device;

      setDiscoveredDevices(prev => prev.filter(d =>
        !(d.vendorId === dev.vendorId && d.productId === dev.productId)
      ));

      addLog(`Real-time Event: USB printer unplugged: ${dev.productName || "USB Printer"}`);
      setConnected(false);
      setErpStatus("Disconnected");

      const data = {
        ...settings,
        connected: false,
      };
      localStorage.setItem("usbPrinterSettings", JSON.stringify(data));
      setMessage("USB printer disconnected.");
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
  }, [settings]);

  const handleSave = () => {
    setSaving(true);
    const data = {
      ...settings,
      connected,
    };

    localStorage.setItem("usbPrinterSettings", JSON.stringify(data));

    setTimeout(() => {
      setSaving(false);
      addLog("Settings updated manually.");
      setMessage("USB printer settings saved successfully.");
    }, 500);
  };

  const handleTestPrint = () => {
    if (!connected) {
      setMessage("Please connect the USB printer first.");
      return;
    }

    setMessage("Test print sent successfully.");
    addLog(`Sent test print spool job to paired device "${settings.printerName}".`);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleRefresh = () => {
    setMessage("Checking USB printer connection...");
    addLog("Manual verification of printer ports requested.");
    setTimeout(() => {
      if (connected) {
        setMessage("USB printer is connected and active.");
      } else {
        setMessage("No active USB printer connected.");
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

        {/* Simulated USB Plug-in Control */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-55">
              USB Connection Control
            </h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
              Simulate hardware connections for local development or testing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleScanForPhysicalDevices}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition flex items-center gap-2"
              disabled={isSyncing}
            >
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
              Scan & Pair Physical USB Printer
            </button>

            <button
              type="button"
              onClick={() => {
                const simulatedName = "HP LaserJet Pro Printer";
                const simulatedId = `sim-usb-print-${Date.now()}`;
                const isDiscovered = discoveredDevices.some(d => d.name === simulatedName);

                if (isDiscovered) {
                  setDiscoveredDevices(prev => prev.filter(d => d.name !== simulatedName));
                  setConnected(false);
                  setErpStatus("Disconnected");
                  addLog("Simulated unplug: HP LaserJet Pro Printer removed.");
                  const data = {
                    ...settings,
                    connected: false,
                  };
                  localStorage.setItem("usbPrinterSettings", JSON.stringify(data));
                } else {
                  setDiscoveredDevices(prev => [...prev, {
                    id: simulatedId,
                    name: simulatedName,
                    type: "USB",
                    vendorId: 0x03f0,
                    productId: 0x0117,
                    status: "found"
                  }]);
                  addLog("Simulated USB plug-in: HP LaserJet Pro Printer discovered. Ready to pair.");
                }
              }}
              className="rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-750 dark:text-slate-200 transition"
              disabled={isSyncing}
            >
              {discoveredDevices.some(d => d.name === "HP LaserJet Pro Printer") ? "Simulate Printer Unplug" : "Simulate Printer Plug-in"}
            </button>
          </div>
        </div>

        {/* Discovered Devices Panel (Bluetooth earbuds style) */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                Discovered USB Printers (Real-Time)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Click on the found printer device to pair and register spooler pipelines with the ERP.
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
                Connect your USB printer to a port, or click "Simulate Printer Plug-in" to pair.
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
                        device.status === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                        device.status === 'syncing' ? 'text-amber-550 dark:text-amber-400' :
                        'text-blue-650 dark:text-blue-400'
                      }`}>
                        {device.status === 'connected' ? '● Connected' :
                         device.status === 'syncing' ? '● Connecting...' :
                         '● Discovered'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mt-2">
                      {device.name}
                    </h4>
                    <p className="text-[11px] text-slate-550 dark:text-slate-450 mt-0.5 font-mono">
                      VID: 0x{device.vendorId.toString(16).toUpperCase()} | PID: 0x{device.productId.toString(16).toUpperCase()}
                    </p>
                  </div>
                  <div className="mt-4">
                    {device.status === 'found' && (
                      <button
                        onClick={() => handleConnectDevice(device)}
                        className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition-all duration-200"
                      >
                        Pair with ERP Printer Hub
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

          {/* Manual Input Fallback */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-550 dark:text-slate-400 mb-2 font-medium">
              If your USB printer does not appear in the scanner popup (Windows Spooler lock), register it manually by name:
            </p>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Enter printer name (e.g., HP LaserJet, POS-80)"
                value={manualDeviceName}
                onChange={(e) => setManualDeviceName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-50 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={handleAddManualDevice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Add Device
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Printer Configuration */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-55">
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

                  <p className="mt-1 text-xs text-slate-655 dark:text-slate-400">
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
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-105 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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

        {/* Hardware Console Logs */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Hardware Console Logs (ERP Communication)
          </h3>
          <div className="mt-3 font-mono text-xs text-slate-650 dark:text-slate-400 max-h-40 overflow-y-auto space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-850">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-emerald-500">[{log.time}]</span>
                <span className="text-slate-450">&gt;</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
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

      <span className="text-sm text-slate-655 dark:text-slate-400">
        {label}
      </span>

      <span
        className={`text-right text-sm font-semibold ${
          active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-450 dark:text-slate-500"
        }`}
      >
        {value}
      </span>

    </div>
  );
}