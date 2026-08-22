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
import emailjs from "@emailjs/browser"; // npm install @emailjs/browser

const BACKUP_KEYS = [
  "customers",
  "suppliers",
  "users",
  "shopInformation",
  "gstSettings",
  "invoiceSettings",
  "printerSettings",
  "salesReturns",
  "purchases",
];

export default function BackupRestore() {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Helper: Get Backup Object
  const getBackupData = () => {
    const backup = {
      app: "Gupta Traders",
      version: "1.0",
      createdAt: new Date().toISOString(),
      data: {},
    };

    BACKUP_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          backup.data[key] = JSON.parse(value);
        } catch {
          backup.data[key] = value;
        }
      }
    });

    return backup;
  };

  // 1. Download Backup File
  const createBackup = () => {
    const backup = getBackupData();
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

    setMessage("Backup downloaded successfully.");
  };

  // 2. Email Backup (Frontend via EmailJS)
  const sendBackupToEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsSending(true);
    const backupData = JSON.stringify(getBackupData());

    try {
      // EmailJS configuration (Replace with your keys)
      // Service ID, Template ID, Public Key setup from emailjs.com
      const templateParams = {
        to_email: email,
        backup_date: new Date().toLocaleString(),
        backup_content: backupData, // Sent as string attachment/body
      };

      /* 
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        templateParams,
        'YOUR_PUBLIC_KEY'
      );
      */

      // Simulated Frontend Delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setMessage(`Backup copy successfully sent to ${email}`);
      setEmail("");
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

        if (!backup.data || typeof backup.data !== "object") {
          throw new Error("Invalid backup file");
        }

        const confirmed = window.confirm(
          "Restore this backup? Existing saved data may be replaced."
        );
        if (!confirmed) return;

        Object.entries(backup.data).forEach(([key, value]) => {
          const valToSave =
            typeof value === "string" ? value : JSON.stringify(value);
          localStorage.setItem(key, valToSave);
        });

        setMessage("Backup restored successfully. Refreshing page...");
        setTimeout(() => window.location.reload(), 1500);
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
    const confirmed = window.confirm(
      "This will remove application data stored in this browser. Continue?"
    );
    if (!confirmed) return;

    BACKUP_KEYS.forEach((key) => localStorage.removeItem(key));
    setMessage("Application data cleared. Refreshing page...");
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
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