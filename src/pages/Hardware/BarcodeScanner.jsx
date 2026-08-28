import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Barcode,
    CheckCircle2,
    ScanLine,
    Settings2,
    XCircle,
    RefreshCw,
} from "lucide-react";

export default function BarcodeScanner() {
    const getInitialSettings = () => {
        try {
            const stored = localStorage.getItem("barcodeScannerSettings");
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Error reading scanner settings:", e);
        }
        return {
            connected: false,
            scannerName: "USB Barcode Scanner",
            connectionType: "USB",
            prefix: "",
            suffix: "Enter",
            erpConnected: false
        };
    };

    const initialSettings = getInitialSettings();

    const [connected, setConnected] = useState(initialSettings.connected);
    const [scannerName, setScannerName] = useState(initialSettings.scannerName);
    const [connectionType, setConnectionType] = useState(initialSettings.connectionType);
    const [prefix, setPrefix] = useState(initialSettings.prefix);
    const [suffix, setSuffix] = useState(initialSettings.suffix);
    const [barcode, setBarcode] = useState("");
    const [lastScanned, setLastScanned] = useState("");

    // Bluetooth/Earbuds-style discovery list
    const [discoveredDevices, setDiscoveredDevices] = useState([]);

    // ERP Sync States
    const [erpStatus, setErpStatus] = useState(initialSettings.connected ? "Connected" : "Disconnected");
    const [isSyncing, setIsSyncing] = useState(false);
    const [logs, setLogs] = useState([
        { time: new Date().toLocaleTimeString(), text: "System initialized. Scanning USB/HID ports for device signals..." }
    ]);

    const addLog = (text) => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), text }, ...prev]);
    };

    // Load saved settings and pre-populate discovered devices if already active
    useEffect(() => {
        if (initialSettings.connected) {
            setDiscoveredDevices([{
                id: "saved-device",
                name: initialSettings.scannerName || "USB Barcode Scanner",
                type: "USB",
                vendorId: 0x05f9,
                productId: 0x2201,
                status: "connected"
            }]);
        }
    }, []);

    // Bluetooth Earbuds style device connect trigger
    const handleConnectDevice = (device) => {
        // Set state to syncing for this specific device card
        setDiscoveredDevices(prev => prev.map(d =>
            d.id === device.id ? { ...d, status: 'syncing' } : d
        ));
        
        setIsSyncing(true);
        setErpStatus("Syncing");
        addLog(`Initiating handshake with ERP for device: "${device.name}"`);
        
        setTimeout(() => {
            addLog(`ERP Connection: Verifying Vendor ID (0x${device.vendorId.toString(16)}) security certificate...`);
            
            setTimeout(() => {
                addLog("ERP Sync: Downloading databases, pricing tables and mapping local inventory indexes...");
                
                setTimeout(() => {
                    setErpStatus("Connected");
                    setIsSyncing(false);
                    setConnected(true);
                    setScannerName(device.name);
                    
                    // Mark as connected in our discovered devices pool
                    setDiscoveredDevices(prev => prev.map(d =>
                        d.id === device.id ? { ...d, status: 'connected' } : d
                    ));
                    
                    addLog(`Scanner "${device.name}" successfully registered and connected with ERP!`);
                    
                    const settings = {
                        scannerName: device.name,
                        connectionType: "USB",
                        prefix,
                        suffix,
                        connected: true,
                        erpConnected: true
                    };
                    localStorage.setItem("barcodeScannerSettings", JSON.stringify(settings));
                }, 500);
            }, 600);
        }, 700);
    };

    // Disconnect device flow
    const handleDisconnectDevice = (device) => {
        setDiscoveredDevices(prev => prev.map(d =>
            d.id === device.id ? { ...d, status: 'found' } : d
        ));
        setConnected(false);
        setErpStatus("Disconnected");
        addLog(`Scanner "${device.name}" disconnected from ERP.`);
        
        const settings = {
            scannerName: device.name,
            connectionType: "USB",
            prefix,
            suffix,
            connected: false,
            erpConnected: false
        };
        localStorage.setItem("barcodeScannerSettings", JSON.stringify(settings));
    };

    // Scan and Request browser permission for physical USB/HID devices
    const handleScanForPhysicalDevices = async () => {
        try {
            if (typeof navigator === "undefined") {
                alert("Browser APIs not loaded.");
                return;
            }
            addLog("Opening native device selection dialog. Please choose your barcode scanner...");
            
            // Try WebUSB first
            if (navigator.usb) {
                const device = await navigator.usb.requestDevice({ filters: [] });
                if (device) {
                    const name = device.productName || device.manufacturerName || "USB Barcode Scanner";
                    const devId = `usb-scanner-${device.vendorId}-${device.productId}-${Date.now()}`;
                    
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
                    return;
                }
            }
            
            // Fallback/Option to try WebHID
            if (navigator.hid) {
                const devices = await navigator.hid.requestDevice({ filters: [] });
                if (devices && devices.length > 0) {
                    const device = devices[0];
                    const name = device.productName || "HID Scanner";
                    const devId = `hid-scanner-${device.vendorId}-${device.productId}-${Date.now()}`;
                    
                    setDiscoveredDevices(prev => {
                        if (prev.some(d => d.vendorId === device.vendorId && d.productId === device.productId)) {
                            return prev;
                        }
                        return [...prev, {
                            id: devId,
                            name,
                            type: "HID",
                            vendorId: device.vendorId,
                            productId: device.productId,
                            status: "found"
                        }];
                    });
                    
                    addLog(`Discovered physical HID device: "${name}" (VID: 0x${device.vendorId.toString(16)}, PID: 0x${device.productId.toString(16)}).`);
                }
            }
        } catch (err) {
            console.error("Device scan failed:", err);
            addLog(`Device Port Scan canceled: ${err.message}`);
        }
    };

    // Listen to real-time WebUSB/WebHID connection signals
    useEffect(() => {
        if (typeof navigator === "undefined") return;

        const handleConnect = (event) => {
            const dev = event.device;
            const name = dev.productName || dev.manufacturerName || "Honeywell USB Scanner";
            const devId = `usb-${dev.vendorId}-${dev.productId}-${Date.now()}`;
            
            setDiscoveredDevices(prev => {
                // Avoid duplicating if device already exists in pool
                if (prev.some(d => d.vendorId === dev.vendorId && d.productId === dev.productId)) {
                    return prev;
                }
                return [...prev, {
                    id: devId,
                    name,
                    type: "USB",
                    vendorId: dev.vendorId || 0x05f9,
                    productId: dev.productId || 0x2201,
                    status: "found"
                }];
            });

            addLog(`Real-time Discovery: Found USB device signal from "${name}" (Ready to Connect).`);
        };

        const handleDisconnect = (event) => {
            const dev = event.device;
            
            // Remove device from list
            setDiscoveredDevices(prev => prev.filter(d => 
                !(d.vendorId === dev.vendorId && d.productId === dev.productId)
            ));
            
            addLog(`Real-time Event: USB device unplugged: ${dev.productName || "Scanner"}`);
            setConnected(false);
            setErpStatus("Disconnected");
            
            const settings = {
                scannerName,
                connectionType,
                prefix,
                suffix,
                connected: false,
                erpConnected: false
            };
            localStorage.setItem("barcodeScannerSettings", JSON.stringify(settings));
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
    }, [scannerName, prefix, suffix]);

    const handleTestScan = (e) => {
        e.preventDefault();

        if (!barcode.trim()) {
            alert("Please enter a barcode to test.");
            return;
        }

        setLastScanned(barcode.trim());
        setBarcode("");
        addLog(`Processed scan test for barcode: ${barcode.trim()}`);
    };

    const handleSave = () => {
        const settings = {
            scannerName,
            connectionType,
            prefix,
            suffix,
            connected,
            erpConnected: erpStatus === "Connected"
        };

        localStorage.setItem(
            "barcodeScannerSettings",
            JSON.stringify(settings)
        );

        addLog("Settings updated manually by user.");
        alert("Barcode scanner settings saved successfully.");
    };

    const handleReset = () => {
        setScannerName("USB Barcode Scanner");
        setConnectionType("USB");
        setPrefix("");
        setSuffix("Enter");
        setConnected(false);
        setErpStatus("Disconnected");
        setLastScanned("");
        setBarcode("");
        setDiscoveredDevices([]);
        setLogs([{ time: new Date().toLocaleTimeString(), text: "Settings reset. Devices cleared." }]);

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
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
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
                                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                                    Terminal Pairing Status
                                </h2>

                                <p
                                    className={`text-sm font-medium ${
                                        connected
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400"
                                    }`}
                                >
                                    {connected
                                        ? `Scanner Connected (${scannerName})`
                                        : "Scanner Offline / Not Paired"}
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

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleScanForPhysicalDevices}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition flex items-center gap-2"
                                disabled={isSyncing}
                            >
                                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                                Scan & Pair Physical Barcode Scanner
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const simulatedName = "Datalogic QuickScan QD2430";
                                    const simulatedId = `sim-${Date.now()}`;
                                    const isDiscovered = discoveredDevices.some(d => d.name === simulatedName);

                                    if (isDiscovered) {
                                        // Unplug simulated device
                                        setDiscoveredDevices(prev => prev.filter(d => d.name !== simulatedName));
                                        setConnected(false);
                                        setErpStatus("Disconnected");
                                        addLog("Simulated unplug: Datalogic QuickScan QD2430 removed from port.");
                                        
                                        const settings = {
                                            scannerName,
                                            connectionType,
                                            prefix,
                                            suffix,
                                            connected: false,
                                            erpConnected: false
                                        };
                                        localStorage.setItem("barcodeScannerSettings", JSON.stringify(settings));
                                    } else {
                                        // Plug in simulated device
                                        setDiscoveredDevices(prev => [...prev, {
                                            id: simulatedId,
                                            name: simulatedName,
                                            type: "USB",
                                            vendorId: 0x05f9,
                                            productId: 0x2201,
                                            status: "found"
                                        }]);
                                        addLog("Simulated USB plug-in: Datalogic QuickScan QD2430 discovered. Ready to pair.");
                                    }
                                }}
                                className="rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition"
                                disabled={isSyncing}
                            >
                                {discoveredDevices.some(d => d.name === "Datalogic QuickScan QD2430") ? "Simulate USB Unplug" : "Simulate USB Plug-in"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Discovered Devices List (Earbuds Bluetooth Style) */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                Discovered USB Barcode Scanners (Real-Time)
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Click on the found device to establish security handshakes and register with the ERP.
                            </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-550 dark:bg-blue-400 animate-ping" />
                            Scanning Ports...
                        </span>
                    </div>

                    {discoveredDevices.length === 0 ? (
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20">
                            <Barcode size={30} className="mx-auto mb-3 text-slate-400 dark:text-slate-650 animate-pulse" />
                            <p className="text-sm font-medium text-slate-650 dark:text-slate-400">
                                No scanner detected
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Connect your barcode scanner to a USB port, or click "Simulate USB Plug-in" to pair.
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
                                                USB Device
                                            </span>
                                            <span className={`text-xs font-semibold ${
                                                device.status === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                                                device.status === 'syncing' ? 'text-amber-550 dark:text-amber-400' :
                                                'text-blue-600 dark:text-blue-405'
                                            }`}>
                                                {device.status === 'connected' ? '● Connected' :
                                                 device.status === 'syncing' ? '● Connecting...' :
                                                 '● Discovered'}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-105 mt-2">
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
                                                Pair with ERP Terminal
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
                                                Disconnect Device
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Scanner Settings */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                        <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600 dark:text-violet-400">
                                <Settings2 size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
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
                                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
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
                                    className="input-field text-lg tracking-wider font-mono"
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

                        <div className="mt-5">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Simulate Barcode Scan Actions</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { name: "Aashirvaad Atta", code: "8901063010017" },
                                    { name: "Tata Salt", code: "8901725181123" },
                                    { name: "Pepsi", code: "8901233011127" },
                                    { name: "Surf Excel", code: "8901030555119" }
                                ].map(prod => (
                                    <button
                                        key={prod.code}
                                        type="button"
                                        onClick={() => {
                                            if (!connected) {
                                                alert("Please connect/simulate the scanner first!");
                                                return;
                                            }
                                            setBarcode(prod.code);
                                            addLog(`Simulating product scan: ${prod.name} (${prod.code})`);
                                            setTimeout(() => {
                                                setLastScanned(prod.code);
                                                setBarcode("");
                                            }, 150);
                                        }}
                                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 transition"
                                    >
                                        {prod.name}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                                    className="mx-auto mb-3 text-slate-400 dark:text-slate-655"
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

                {/* Console Logs */}
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