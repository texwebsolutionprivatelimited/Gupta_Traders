import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  DatabaseBackup,
  Download,
  Upload,
  RotateCcw,
  Mail,
  Send,
} from "lucide-react";
import { exportDatabaseBackup } from '../../services/erpService'

export default function BackupRestore() {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Helper: Get Backup Object
  // 1. Download Backup File
  const createBackup = async () => {
    try{const backup = await exportDatabaseBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gupta-traders-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage("Database backup downloaded successfully.");}catch(error){setMessage(error.message)}
  };

  // 2. Email Backup (Frontend via EmailJS)
  const sendBackupToEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsSending(true);
    try {
      await exportDatabaseBackup();setMessage('For security, download the backup and send it using your approved business email system. Browser-side email credentials are not used.')
    } catch (error) {
      console.error(error);
      setMessage("Failed to send email. Check frontend API keys.");
    } finally {
      setIsSending(false);
    }
  };

  // 3. Restore Backup
  const restoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);

        if (!['supabase-existing-v1','supabase-erp-v1'].includes(backup.format) || !backup.data || typeof backup.data !== "object") {
          throw new Error("Invalid backup file");
        }

        setMessage("Backup validated. Import is intentionally disabled because restoring can overwrite live database records; use the controlled server-side restore procedure.");
      } catch (error) {
        console.error(error);
        setMessage("Invalid backup file. Select a valid JSON backup.");
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  // 4. Clear Application Data
  const clearApplicationData = () => {
    const confirmed = window.confirm("Clear temporary browser preferences and hardware connection state? ERP database records will not be affected.");
    if (!confirmed) return;

    ['theme','usbPrinterSettings','thermalPrinterSettings','barcodeScannerSettings'].forEach((key) => localStorage.removeItem(key));
    setMessage("Temporary browser state cleared. ERP data remains in Supabase. Refreshing page...");
    setTimeout(() => window.location.reload(), 1500);
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
          <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500">
            <DatabaseBackup size={22} />
          </div>
          <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

              Backup & Restore
              </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your local data or send a copy directly to your email.
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            {message}
          </div>
        )}

        {/* Email Backup Section */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3 text-emerald-500">
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <Mail size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Send Backup to Email
            </h2>
          </div>

          <form onSubmit={sendBackupToEmail} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address (e.g. owner@gmail.com)"
              required
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              <Send size={16} />
              {isSending ? "Sending..." : "Send Email Backup"}
            </button>
          </form>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Download Backup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Download size={22} />
            </div>
            <h2 className="text-lg font-semibold">Create Backup</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Download customers, suppliers, settings, and sales data as a JSON file.
            </p>
            <button
              type="button"
              onClick={createBackup}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Download size={18} />
              Download Backup File
            </button>
          </div>

          {/* Restore Backup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Upload size={22} />
            </div>
            <h2 className="text-lg font-semibold">Restore Backup</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Select a JSON backup file to overwrite current application data.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={restoreBackup}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Upload size={18} />
              Select Backup File
            </button>
          </div>
        </div>

        {/* Clear Data */}
        <div className="mt-5 rounded-2xl border border-rose-200 bg-white p-6 dark:border-rose-500/20 dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-rose-500/10 p-3 text-rose-500">
              <RotateCcw size={20} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-rose-500">
                Clear Application Data
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Remove saved local data from this browser.
              </p>
              <button
                type="button"
                onClick={clearApplicationData}
                className="mt-4 rounded-xl border border-rose-300 px-5 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
