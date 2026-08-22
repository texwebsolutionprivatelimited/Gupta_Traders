import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  Printer,
  Usb,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Activity,
  Settings,
} from "lucide-react";

export default function Hardware() {
  const navigate = useNavigate();

  const devices = [
    {
      title: "Barcode Scanner",
      description: "Scan and test product barcodes.",
      icon: ScanLine,
      iconColor: "text-sky-600 dark:text-sky-400",
      bg: "from-sky-500/10 to-sky-600/5 dark:from-sky-500/10 dark:to-sky-600/5",
      status: "Connected",
      path: "/hardware/barcode-scanner",
    },
    {
      title: "Thermal Printer",
      description: "Print receipts and invoices.",
      icon: Printer,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/10 dark:to-emerald-600/5",
      status: "Disconnected",
      path: "/hardware/thermal-printer",
    },
    {
      title: "USB Printer",
      description: "Configure USB printing device.",
      icon: Usb,
      iconColor: "text-violet-600 dark:text-violet-400",
      bg: "from-violet-500/10 to-violet-600/5 dark:from-violet-500/10 dark:to-violet-600/5",
      status: "Setup Required",
      path: "/hardware/usb-printer",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Activity size={14} />
            Hardware Control Center
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

            Hardware Management
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage scanners, printers and connected devices.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Connected"
            value="1"
            icon={CheckCircle2}
            color="text-emerald-600 dark:text-emerald-400"
          />

          <StatCard
            title="Disconnected"
            value="1"
            icon={AlertTriangle}
            color="text-amber-600 dark:text-amber-400"
          />

          <StatCard
            title="Total Devices"
            value="3"
            icon={Cpu}
            color="text-sky-600 dark:text-sky-400"
          />
        </div>

        {/* Device Cards */}
        <div className="grid gap-5 lg:grid-cols-3">
          {devices.map((device) => {
            const Icon = device.icon;

            return (
              <div
                key={device.title}
                onClick={() => navigate(device.path)}
                className={`group cursor-pointer rounded-2xl border border-slate-200 bg-white bg-gradient-to-br ${device.bg} p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/30 dark:hover:shadow-xl dark:hover:shadow-emerald-500/5`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-xl bg-slate-100 p-3 dark:bg-slate-800/80 ${device.iconColor}`}
                  >
                    <Icon size={24} />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${device.status === "Connected"
                        ? "border border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:text-emerald-400"
                        : "border border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:text-amber-400"
                      }`}
                  >
                    {device.status}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                  {device.title}
                </h3>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {device.description}
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(device.path);
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  Open Device
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-2">
            <Settings
              size={18}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Quick Actions
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <QuickAction
              title="Scan Test Barcode"
              onClick={() => navigate("/hardware/barcode-scanner")}
            />

            <QuickAction
              title="Print Test Receipt"
              onClick={() => navigate("/hardware/thermal-printer")}
            />

            <QuickAction
              title="USB Printer Setup"
              onClick={() => navigate("/hardware/usb-printer")}
            />
          </div>
        </div>

        {/* Device Logs */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
            Recent Device Logs
          </h2>

          <div className="space-y-3">
            <LogItem
              status="success"
              text="Barcode Scanner connected successfully."
              onClick={() => navigate("/hardware/barcode-scanner")}
            />

            <LogItem
              status="warning"
              text="Thermal Printer not detected."
              onClick={() => navigate("/hardware/thermal-printer")}
            />

            <LogItem
              status="warning"
              text="USB Printer setup pending."
              onClick={() => navigate("/hardware/usb-printer")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>
        </div>

        <Icon size={26} className={color} />
      </div>
    </div>
  );
}

function QuickAction({ title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 transition hover:border-emerald-500/40 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-slate-900 dark:hover:text-white"
    >
      <span className="text-sm font-medium">{title}</span>
      <ArrowRight size={18} className="text-slate-400 dark:text-slate-500" />
    </button>
  );
}

function LogItem({ status, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-500/40 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/30 dark:hover:bg-slate-900"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${status === "success" ? "bg-emerald-500" : "bg-amber-500"
          }`}
      />

      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {text}
      </span>
    </button>
  );
}