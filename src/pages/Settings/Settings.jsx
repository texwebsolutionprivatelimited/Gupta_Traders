import { useNavigate } from "react-router-dom";
import {
  Store,
  ReceiptText,
  FileText,
  Printer,
  DatabaseBackup,
  ChevronRight,
} from "lucide-react";

const settingsItems = [
  {
    title: "Shop Information",
    description: "Manage shop name, address, contact and business details.",
    icon: Store,
    path: "/settings/shop-information",
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "GST Settings",
    description: "Configure GSTIN, GST registration and tax preferences.",
    icon: ReceiptText,
    path: "/settings/gst",
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Invoice Settings",
    description: "Configure invoice numbering, format and invoice details.",
    icon: FileText,
    path: "/settings/invoice",
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    title: "Printer Settings",
    description: "Configure invoice printer and printing preferences.",
    icon: Printer,
    path: "/settings/printer",
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Backup & Restore",
    description: "Backup application data or restore previous data.",
    icon: DatabaseBackup,
    path: "/settings/backup",
    iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Settings</span>
            <span>/</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Configuration
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your shop, billing, printer and application settings.
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          {settingsItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="group flex w-full items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}
                >
                  <Icon size={25} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>

                <ChevronRight
                  size={20}
                  className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400"
                />
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}