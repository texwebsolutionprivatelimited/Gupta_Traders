import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  DatabaseBackup,
  Download,
  Upload,
  Mail,
  Send,
  MessageCircle,
  Phone,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  RefreshCw,
  FileJson,
  UserCheck,
  Settings2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStoredBusinessSettings } from '../../services/erpService';
import {
  createERPBackup,
  restoreERPBackup,
  downloadBackupFile,
  generateWhatsAppBackupLink,
  sendBackupViaEmail,
  validateBackupPayload,
  getBackupHistory,
  getLatestBackup,
  findBackupsByDestination,
  getLastBackupDate,
  getLastBackupEmail,
  getSafetySnapshot,
  formatBackupDate,
  rollbackSafetySnapshot,
  updateBackupHistoryStatus
} from '../../services/backupService';
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  sendBackupViaWhatsAppAPI,
  testWhatsAppAPIConnection,
  normalizeWhatsAppNumber
} from '../../services/whatsappService';
import { checkMonthlyBackupReminder } from '../../services/notificationService';

export default function BackupRestore() {
  const { user, profile, role } = useAuth();
  const fileInputRef = useRef(null);

  // Business settings fallback
  const businessSettings = getStoredBusinessSettings();
  const defaultOwnerEmail =
    profile?.email ||
    user?.email ||
    getLastBackupEmail() ||
    businessSettings?.shop?.email ||
    '';

  const defaultOwnerPhone =
    businessSettings?.shop?.phone ||
    '';

  // Active Backup Tab: 'whatsapp' | 'email'
  const [activeBackupTab, setActiveBackupTab] = useState('whatsapp');

  // Input states
  const [backupEmail, setBackupEmail] = useState(defaultOwnerEmail);
  const [backupPhone, setBackupPhone] = useState(defaultOwnerPhone);
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);

  // Confirmation Modals
  const [showBackupConfirmModal, setShowBackupConfirmModal] = useState(false);
  const [confirmTargetType, setConfirmTargetType] = useState('whatsapp'); // 'whatsapp' | 'email'

  // WhatsApp API Settings Modal
  const [showWhatsAppSettingsModal, setShowWhatsAppSettingsModal] = useState(false);
  const [waConfigForm, setWaConfigForm] = useState(getWhatsAppConfig());
  const [isTestingWaApi, setIsTestingWaApi] = useState(false);
  const [waApiTestResult, setWaApiTestResult] = useState(null);

  // Latest Backup details
  const [latestBackupResult, setLatestBackupResult] = useState(null);
  const [failedWhatsAppFallback, setFailedWhatsAppFallback] = useState(null);

  // Restore states
  const [restoreAccountLookup, setRestoreAccountLookup] = useState(defaultOwnerPhone);
  const [matchedBackups, setMatchedBackups] = useState([]);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null);
  const [restoreValidation, setRestoreValidation] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(null);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);
  const [restoreConfirmedCheckbox, setRestoreConfirmedCheckbox] = useState(false);
  const [restoreSuccessResult, setRestoreSuccessResult] = useState(null);

  // History & Snapshot
  const [backupHistory, setBackupHistory] = useState([]);
  const [safetySnapshot, setSafetySnapshot] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Authorization check
  const isAuthorized = !role || ['admin', 'manager', 'owner'].includes(role.toLowerCase());

  useEffect(() => {
    refreshBackupState();
    setWaConfigForm(getWhatsAppConfig());
  }, []);

  const refreshBackupState = () => {
    const history = getBackupHistory();
    setBackupHistory(history);
    const latest = getLatestBackup();
    if (latest && !latestBackupResult) {
      setLatestBackupResult({
        backup: latest.data,
        summary: latest
      });
    }
    const snap = getSafetySnapshot();
    setSafetySnapshot(snap);
    checkMonthlyBackupReminder();
  };

  const lastDate = getLastBackupDate();
  const isMonthlyBackupDue = (() => {
    if (!lastDate) return true;
    const diffDays = (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  })();

  // ───────────────────────────────────────────────────────────────────────────
  // WhatsApp & Email Backup Handlers
  // ───────────────────────────────────────────────────────────────────────────

  const handleOpenBackupConfirmation = (e, type) => {
    if (e) e.preventDefault();
    if (type === 'whatsapp') {
      const clean = normalizeWhatsAppNumber(backupPhone);
      if (!clean || clean.length < 10) {
        showNotice('Please enter a valid 10-digit WhatsApp mobile number.', 'error');
        return;
      }
      setConfirmTargetType('whatsapp');
    } else {
      if (!backupEmail || !backupEmail.includes('@')) {
        showNotice('Please enter a valid Gmail / email address.', 'error');
        return;
      }
      setConfirmTargetType('email');
    }
    setShowBackupConfirmModal(true);
  };

  const handleExecuteBackup = async () => {
    setShowBackupConfirmModal(false);
    setIsGeneratingBackup(true);
    setNotificationMsg(null);
    setFailedWhatsAppFallback(null);

    const isWhatsApp = confirmTargetType === 'whatsapp';
    const method = isWhatsApp ? 'WhatsApp' : 'Email';
    const destination = isWhatsApp ? backupPhone : backupEmail;

    let backupRes = null;

    try {
      // 1. Generate sanitized ERP backup securely
      backupRes = await createERPBackup({
        email: isWhatsApp ? '' : backupEmail,
        phone: isWhatsApp ? backupPhone : '',
        method,
        destination,
        channel: isWhatsApp ? 'whatsapp' : 'email',
        status: 'pending'
      });

      setLatestBackupResult(backupRes);

      if (isWhatsApp) {
        // 2. WhatsApp API Integration
        try {
          await sendBackupViaWhatsAppAPI({
            phone: backupPhone,
            backup: backupRes.backup,
            summary: backupRes.summary
          });

          // Mark status as 'sent'
          updateBackupHistoryStatus(backupRes.summary.id, { status: 'sent' });
          refreshBackupState();

          // Download copy to local device as well
          downloadBackupFile(backupRes.backup);

          // Show exact required success message
          showNotice('Backup sent successfully via WhatsApp.', 'success');
        } catch (apiErr) {
          console.error('WhatsApp API sending failed:', apiErr);

          // Mark status as 'failed' in ERP backup history - DO NOT pretend it was sent
          updateBackupHistoryStatus(backupRes.summary.id, {
            status: 'failed',
            error: apiErr.message
          });
          refreshBackupState();

          setFailedWhatsAppFallback({
            backup: backupRes.backup,
            summary: backupRes.summary,
            phone: backupPhone,
            error: apiErr.message
          });

          // Show clear error message
          showNotice(
            `WhatsApp API Error: ${apiErr.message}`,
            'error'
          );
        }
      } else {
        // Email Backup flow
        sendBackupViaEmail({
          backup: backupRes.backup,
          summary: backupRes.summary,
          email: backupEmail
        });

        updateBackupHistoryStatus(backupRes.summary.id, { status: 'sent' });
        refreshBackupState();

        showNotice(
          `Backup generated successfully! Verification file downloaded and dispatch prepared for ${backupEmail}.`,
          'success'
        );
      }
    } catch (err) {
      console.error('Backup generation error:', err);
      showNotice(err.message || 'Failed to generate database backup.', 'error');
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  // WhatsApp Web manual fallback dispatch if API unconfigured
  const handleWhatsAppWebFallback = () => {
    if (!failedWhatsAppFallback) return;
    const waUrl = generateWhatsAppBackupLink({
      backup: failedWhatsAppFallback.backup,
      summary: failedWhatsAppFallback.summary,
      email: failedWhatsAppFallback.phone
    });
    window.open(waUrl, '_blank');
    downloadBackupFile(failedWhatsAppFallback.backup);
    showNotice('Opened backup report in WhatsApp Web & downloaded JSON verification file.', 'info');
  };

  // WhatsApp API Settings Save
  const handleSaveWhatsAppConfig = (e) => {
    e.preventDefault();
    try {
      saveWhatsAppConfig(waConfigForm);
      setShowWhatsAppSettingsModal(false);
      showNotice('WhatsApp API configuration saved successfully.', 'success');
    } catch (err) {
      showNotice(err.message || 'Failed to save configuration.', 'error');
    }
  };

  // Test WhatsApp Connection
  const handleTestWhatsAppConnection = async () => {
    setIsTestingWaApi(true);
    setWaApiTestResult(null);
    try {
      await testWhatsAppAPIConnection({
        phoneNumberId: waConfigForm.phoneNumberId,
        accessToken: waConfigForm.accessToken,
        testPhone: backupPhone || waConfigForm.defaultPhone
      });
      setWaApiTestResult({ success: true, message: 'Connection test passed! WhatsApp Cloud API is active.' });
    } catch (err) {
      setWaApiTestResult({ success: false, message: err.message || 'Connection failed.' });
    } finally {
      setIsTestingWaApi(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Restore Handlers
  // ───────────────────────────────────────────────────────────────────────────

  const handleSearchBackups = () => {
    if (!restoreAccountLookup || !restoreAccountLookup.trim()) {
      showNotice('Please enter the mobile number or email where your backup was stored.', 'warning');
      return;
    }
    const found = findBackupsByDestination(restoreAccountLookup);
    setMatchedBackups(found);

    if (found.length > 0) {
      handleSelectBackupPayload(found[0].data);
      showNotice(`Found ${found.length} saved backup(s) matching "${restoreAccountLookup}".`, 'success');
    } else {
      setSelectedBackupForRestore(null);
      setRestoreValidation(null);
      showNotice(
        `No local archives found matching "${restoreAccountLookup}". You can also select the backup JSON file from your device.`,
        'warning'
      );
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        handleSelectBackupPayload(parsed);
      } catch (err) {
        console.error('JSON parse error:', err);
        setRestoreValidation({
          isValid: false,
          error: 'The uploaded file is not a valid JSON document.'
        });
        setSelectedBackupForRestore(null);
        showNotice('Invalid JSON file. Please select a valid ERP backup JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSelectBackupPayload = (payload) => {
    const val = validateBackupPayload(payload);
    setRestoreValidation(val);
    if (val.isValid) {
      setSelectedBackupForRestore(payload);
      if (val.summary?.destination && !restoreAccountLookup) {
        setRestoreAccountLookup(val.summary.destination);
      }
      showNotice('Backup file loaded & verified. Review details below before restoring.', 'success');
    } else {
      setSelectedBackupForRestore(null);
      showNotice(val.error || 'Backup validation failed.', 'error');
    }
  };

  const handleOpenRestoreConfirmation = () => {
    if (!selectedBackupForRestore || !restoreValidation?.isValid) {
      showNotice('Please select and validate a backup file first.', 'warning');
      return;
    }
    setRestoreConfirmedCheckbox(false);
    setShowRestoreConfirmModal(true);
  };

  const handleExecuteRestore = async () => {
    if (!restoreConfirmedCheckbox) return;
    setShowRestoreConfirmModal(false);
    setIsRestoring(true);
    setRestoreProgress({ step: 1, totalSteps: 4, message: 'Initializing restore sequence...', percent: 5 });

    try {
      const result = await restoreERPBackup(selectedBackupForRestore, {
        onProgress: (prog) => setRestoreProgress(prog)
      });

      setRestoreSuccessResult(result);
      refreshBackupState();
      showNotice(
        `Database restored successfully! ${result.restoredCount} records synchronized across ${result.restoredTables.length} tables.`,
        'success'
      );
    } catch (err) {
      console.error('Restoration error:', err);
      showNotice(err.message || 'Restoration encountered an unexpected error.', 'error');
    } finally {
      setIsRestoring(false);
      setRestoreProgress(null);
    }
  };

  const handleRollbackSnapshot = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to rollback to the pre-restore safety snapshot? Current data will be replaced by the snapshot.'
    );
    if (!confirmed) return;

    setIsRollingBack(true);
    try {
      const result = await rollbackSafetySnapshot();
      refreshBackupState();
      showNotice(`Successfully rolled back to safety snapshot (${result.restoredCount} records restored).`, 'success');
    } catch (err) {
      showNotice(err.message || 'Failed to rollback snapshot.', 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  const showNotice = (text, type = 'info') => {
    setNotificationMsg({ text, type });
    setTimeout(() => {
      setNotificationMsg(null);
    }, 8000);
  };

  const currentWaConfig = getWhatsAppConfig();
  const isWaApiConfigured = Boolean(
    (currentWaConfig.provider === 'meta_cloud' && currentWaConfig.phoneNumberId && currentWaConfig.accessToken) ||
    (currentWaConfig.provider === 'custom_gateway' && currentWaConfig.apiUrl)
  );

  return (
    <div className="min-h-full bg-slate-50/80 p-4 transition-colors duration-200 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <ArrowLeft size={16} />
            Back to Settings
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isAuthorized
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              <UserCheck size={13} />
              {isAuthorized ? 'Owner / Admin Verified' : 'Standard User Access'}
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <DatabaseBackup size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                    Backup & Restore Management
                  </h1>
                  <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    Enterprise
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Protect your business records with automated WhatsApp and Email backups, monthly reminders, and secure point-in-time disaster recovery.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Clock size={14} className="text-slate-400" />
                <span>Last Backup:</span>
                <strong className="text-slate-700 dark:text-slate-200">
                  {lastDate ? formatBackupDate(lastDate) : 'No backups recorded yet'}
                </strong>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Monthly Bell Reminder:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Alert Notification */}
        {notificationMsg && (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium transition-all ${
              notificationMsg.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : notificationMsg.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />
            )}
            <div className="flex-1">{notificationMsg.text}</div>
            <button
              type="button"
              onClick={() => setNotificationMsg(null)}
              className="text-xs font-semibold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Fallback Option if WhatsApp API failed */}
        {failedWhatsAppFallback && (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <XCircle size={20} className="mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Automated WhatsApp API Dispatch Failed
                </h4>
                <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">
                  {failedWhatsAppFallback.error}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Backup data was generated and saved to your device. You can configure WhatsApp API keys or dispatch via WhatsApp Web.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWhatsAppSettingsModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Settings2 size={13} />
                API Settings
              </button>
              <button
                type="button"
                onClick={handleWhatsAppWebFallback}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                <MessageCircle size={13} />
                Send via WhatsApp Web
              </button>
            </div>
          </div>
        )}

        {/* Monthly Backup Reminder Callout Banner */}
        {isMonthlyBackupDue && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 border-l-4 border-l-amber-500 bg-white p-5 shadow-md shadow-slate-200/60 transition-all dark:border-slate-800 dark:border-l-amber-500 dark:bg-slate-900/95 dark:shadow-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400">
                  <Clock size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Monthly Backup Due Reminder
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Action Required
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                    {lastDate
                      ? `Last backup was performed on ${formatBackupDate(lastDate)}. A monthly backup reminder is posted to your Notification Bell.`
                      : 'No complete database backup has been created yet. Generate your monthly backup to safeguard sales and inventory.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBackupConfirmation(null, activeBackupTab)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-md sm:text-sm"
              >
                <Sparkles size={16} />
                Create Monthly Backup Now
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Primary Grid: Create Backup & Restore Backup */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* Card 1: Create & Send Backup (WhatsApp & Email) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <DatabaseBackup size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Create ERP Backup
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Export full system snapshot & dispatch via WhatsApp or Email
                    </p>
                  </div>
                </div>

                {/* WhatsApp / Email Tab Selector */}
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveBackupTab('whatsapp')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      activeBackupTab === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBackupTab('email')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                      activeBackupTab === 'email'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              </div>

              {/* ── WhatsApp Backup Form ── */}
              {activeBackupTab === 'whatsapp' ? (
                <form onSubmit={(e) => handleOpenBackupConfirmation(e, 'whatsapp')} className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Owner WhatsApp Mobile Number
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowWhatsAppSettingsModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        <Settings2 size={13} />
                        WhatsApp API Settings
                        {isWaApiConfigured && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="API Configured" />
                        )}
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Phone
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="tel"
                          required
                          value={backupPhone}
                          onChange={(e) => setBackupPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:text-white dark:focus:ring-emerald-500/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackupPhone(defaultOwnerPhone)}
                        className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        title="Use shop phone"
                      >
                        Shop Phone
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>Includes Date, Records, Type, and Backup Document.</span>
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        {isWaApiConfigured ? '● Meta Cloud API Ready' : '○ Web & Manual Gateway'}
                      </span>
                    </div>
                  </div>

                  {/* Scope Preview */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Layers size={14} className="text-emerald-500" />
                        Data Included in Backup:
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">22 Core Tables</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {['Products & Stock', 'POS Sales & Invoices', 'Purchase Orders', 'Customers Ledger', 'Suppliers', 'Expenses', 'Categories', 'Shop Settings'].map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-lg border border-slate-200/60 bg-white px-2 py-0.5 font-medium shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                          >
                            ✓ {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Primary WhatsApp Backup Action Button */}
                  <button
                    type="submit"
                    disabled={isGeneratingBackup}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg disabled:opacity-50"
                  >
                    {isGeneratingBackup ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Generating & Sending to WhatsApp...
                      </>
                    ) : (
                      <>
                        <MessageCircle size={17} />
                        Backup via WhatsApp
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ── Email Backup Form ── */
                <form onSubmit={(e) => handleOpenBackupConfirmation(e, 'email')} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Owner Gmail / Email Address
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail
                          size={17}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="email"
                          required
                          value={backupEmail}
                          onChange={(e) => setBackupEmail(e.target.value)}
                          placeholder="owner@gmail.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:bg-slate-800 dark:focus:text-white dark:focus:ring-emerald-500/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setBackupEmail(defaultOwnerEmail)}
                        className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        title="Use default email"
                      >
                        Default Email
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      Full system snapshot will be dispatched to your email inbox.
                    </p>
                  </div>

                  {/* Scope Preview */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/60 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Layers size={14} className="text-emerald-500" />
                        Data Included in Backup:
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">22 Core Tables</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {['Products & Stock', 'POS Sales & Invoices', 'Purchase Orders', 'Customers Ledger', 'Suppliers', 'Expenses', 'Categories', 'Shop Settings'].map(
                        (item) => (
                          <span
                            key={item}
                            className="rounded-lg border border-slate-200/60 bg-white px-2 py-0.5 font-medium shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                          >
                            ✓ {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Primary Email Backup Action Button */}
                  <button
                    type="submit"
                    disabled={isGeneratingBackup}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg disabled:opacity-50"
                  >
                    {isGeneratingBackup ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Generating & Packaging Data...
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        Backup Data to this Email
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Download Option Shortcut */}
              {latestBackupResult && (
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => downloadBackupFile(latestBackupResult.backup)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <Download size={14} />
                    Download JSON Backup File
                  </button>
                </div>
              )}
            </div>

            {/* Last Backup Summary Footer Card */}
            {latestBackupResult && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <FileCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                    Latest Backup Details
                  </span>
                  <span className="rounded-md bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {latestBackupResult.summary?.sizeFormatted || 'Ready'}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Date & Time:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatBackupDate(latestBackupResult.summary?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Method & Destination:</span>
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                      {latestBackupResult.summary?.method || 'WhatsApp'}: {latestBackupResult.summary?.destination || backupPhone}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Records:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {latestBackupResult.summary?.totalRecords || 0} items
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        latestBackupResult.summary?.status === 'failed'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                      }`}
                    >
                      {latestBackupResult.summary?.status === 'failed' ? 'Failed' : 'Sent'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Card 2: Restore Backup */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    <RotateCcw size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Restore Backup
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Recover database from verified WhatsApp/Email account or JSON file
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Step 2
                </span>
              </div>

              {/* Account / Mobile Fetcher */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Enter WhatsApp Mobile Number or Email Account
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <div className="relative flex-1">
                      <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={restoreAccountLookup}
                        onChange={(e) => setRestoreAccountLookup(e.target.value)}
                        placeholder="Mobile number or email"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-800 dark:focus:text-white dark:focus:ring-blue-500/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchBackups}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      <Search size={14} />
                      Fetch Backups
                    </button>
                  </div>
                </div>

                {/* Upload or Drop Backup File */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Or Select Backup File (.json)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-blue-400 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-500/50"
                  >
                    <Upload size={22} className="text-blue-500 dark:text-blue-400" />
                    <span className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Click to choose backup file received on WhatsApp or Email
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Accepts gupta-traders-backup-*.json
                    </span>
                  </div>
                </div>

                {/* Pre-Restoration Inspection Card */}
                {selectedBackupForRestore && restoreValidation?.isValid && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5 dark:border-blue-900/50">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                        <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                        Verified Backup Inspection
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        Integrity Validated
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Backup Date / Time:</span>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatBackupDate(restoreValidation.summary.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Origin Account:</span>
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                          {restoreValidation.summary.destination || restoreAccountLookup || 'Owner Account'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Records Backed Up:</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          {restoreValidation.summary.totalRecords} records
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Size & Type:</span>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {restoreValidation.summary.sizeFormatted} • {restoreValidation.summary.format}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown Chips */}
                    <div className="mt-3 border-t border-blue-200/40 pt-2.5 text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Data Breakdown:</span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {Object.entries(restoreValidation.summary.tablesBreakdown || {}).slice(0, 8).map(
                          ([tbl, count]) => (
                            <span
                              key={tbl}
                              className="rounded-md bg-white px-2 py-0.5 font-medium text-slate-700 shadow-2xs dark:bg-slate-800 dark:text-slate-300"
                            >
                              {tbl}: <strong className="text-blue-600 dark:text-blue-400">{count}</strong>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Restore Action Button */}
            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
              <button
                type="button"
                disabled={!selectedBackupForRestore || isRestoring}
                onClick={handleOpenRestoreConfirmation}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Restoring ERP Database...
                  </>
                ) : (
                  <>
                    <RotateCcw size={17} />
                    Restore Backup
                  </>
                )}
              </button>
              <p className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
                Safe restore guarantee: Live database will be automatically snapshotted before any overwrite.
              </p>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Section 3: Backup History & Point-in-time Archives */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <FileJson size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Backup History & Archives
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit log of all WhatsApp and Email backups created for your ERP
                </p>
              </div>
            </div>

            {safetySnapshot && (
              <button
                type="button"
                disabled={isRollingBack}
                onClick={handleRollbackSnapshot}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <RotateCcw size={13} />
                {isRollingBack ? 'Rolling back...' : 'Rollback to Safety Snapshot'}
              </button>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            {backupHistory.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No previous backup archives found in local registry. Create a new backup to begin tracking.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="py-3 font-semibold">Date & Time</th>
                    <th className="py-3 font-semibold">Method</th>
                    <th className="py-3 font-semibold">Destination</th>
                    <th className="py-3 font-semibold">Records</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {backupHistory.map((item) => {
                    const isWa = item.method === 'WhatsApp' || item.channel === 'whatsapp';
                    const isFailed = item.status === 'failed';

                    return (
                      <tr key={item.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                          {formatBackupDate(item.createdAt)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              isWa
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                            }`}
                          >
                            {isWa ? <MessageCircle size={11} /> : <Mail size={11} />}
                            {item.method || (isWa ? 'WhatsApp' : 'Email')}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          <span className="font-mono text-xs">
                            {item.destination || item.targetPhone || item.targetEmail || 'Owner Account'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.totalRecords} records
                          </span>{' '}
                          <span className="text-slate-400">({item.sizeFormatted})</span>
                        </td>
                        <td className="py-3">
                          {isFailed ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                              title={item.error || 'Failed'}
                            >
                              <XCircle size={10} />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                              <CheckCircle2 size={10} />
                              Sent
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectBackupPayload(item.data);
                                showNotice('Selected archive loaded into Restore section.', 'info');
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadBackupFile(item.data)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                              title="Download JSON File"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Modal: Backup Confirmation */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showBackupConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                {confirmTargetType === 'whatsapp' ? <MessageCircle size={24} /> : <Mail size={24} />}
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
                {confirmTargetType === 'whatsapp'
                  ? 'Backup data via WhatsApp?'
                  : 'Backup data to this email?'}
              </h3>

              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-slate-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-slate-300">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {confirmTargetType === 'whatsapp' ? 'WhatsApp Mobile Number:' : 'Destination Email:'}
                </span>
                <strong className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {confirmTargetType === 'whatsapp' ? backupPhone : backupEmail}
                </strong>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {confirmTargetType === 'whatsapp'
                    ? 'A sanitized ERP snapshot (date/time, records count, and backup document) will be dispatched to this WhatsApp number.'
                    : 'A complete sanitized snapshot of all products, inventory, customers, sales, and settings will be packaged and sent to this email.'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBackupConfirmModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBackup}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
                >
                  <CheckCircle2 size={16} />
                  Confirm & Create Backup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Modal: WhatsApp API Settings */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showWhatsAppSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      WhatsApp Business API Settings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Configure Meta Cloud API or Private Gateway for automated backup delivery
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveWhatsAppConfig} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    API Provider
                  </label>
                  <select
                    value={waConfigForm.provider}
                    onChange={(e) => setWaConfigForm({ ...waConfigForm, provider: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="meta_cloud">Meta WhatsApp Cloud API (Official / Approved)</option>
                    <option value="custom_gateway">Custom Webhook / Private Gateway Endpoint</option>
                  </select>
                </div>

                {waConfigForm.provider === 'meta_cloud' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Phone Number ID (Meta Graph API)
                      </label>
                      <input
                        type="text"
                        value={waConfigForm.phoneNumberId}
                        onChange={(e) => setWaConfigForm({ ...waConfigForm, phoneNumberId: e.target.value })}
                        placeholder="e.g. 102938475610293"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Found in your Meta for Developers App → WhatsApp → API Setup
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Permanent / System User Access Token
                      </label>
                      <input
                        type="password"
                        value={waConfigForm.accessToken}
                        onChange={(e) => setWaConfigForm({ ...waConfigForm, accessToken: e.target.value })}
                        placeholder="EAAB..."
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Tokens are kept securely in browser storage and never exported inside backups.
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Custom Gateway Webhook URL
                    </label>
                    <input
                      type="url"
                      value={waConfigForm.apiUrl}
                      onChange={(e) => setWaConfigForm({ ...waConfigForm, apiUrl: e.target.value })}
                      placeholder="https://api.mygateway.com/send-whatsapp"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}

                {/* Connection Test Result */}
                {waApiTestResult && (
                  <div
                    className={`rounded-xl border p-3 text-xs ${
                      waApiTestResult.success
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {waApiTestResult.message}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isTestingWaApi || !waConfigForm.phoneNumberId || !waConfigForm.accessToken}
                    onClick={handleTestWhatsAppConnection}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {isTestingWaApi ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                    Test Connection
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppSettingsModal(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Modal: Restore Safety Gate */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showRestoreConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/50 dark:bg-slate-900 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <AlertTriangle size={24} />
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
                Confirm ERP Database Restoration
              </h3>

              <div className="mt-3 space-y-2 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 text-xs text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                <p className="font-semibold">⚠️ Important Safety Notice:</p>
                <p>Restoring will synchronize live ERP tables with records from the selected backup file.</p>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  🛡️ Automatic Safety Precaution: A live safety snapshot of your current database will be saved before restoring, ensuring you can undo this operation if needed.
                </p>
              </div>

              {restoreValidation?.summary && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex justify-between font-semibold">
                    <span>Backup Origin:</span>
                    <span>{restoreValidation.summary.destination || restoreAccountLookup}</span>
                  </div>
                  <div className="mt-1 flex justify-between font-semibold">
                    <span>Records to Restore:</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {restoreValidation.summary.totalRecords} records
                    </span>
                  </div>
                </div>
              )}

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={restoreConfirmedCheckbox}
                  onChange={(e) => setRestoreConfirmedCheckbox(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  I have verified the backup date, account, and records count, and explicitly authorize this database restoration.
                </span>
              </label>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestoreConfirmModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!restoreConfirmedCheckbox}
                  onClick={handleExecuteRestore}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={16} />
                  Proceed with Restoration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Restoration Progress Modal */}
        {/* ───────────────────────────────────────────────────────────── */}
        {isRestoring && restoreProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-6 shadow-2xl dark:border-blue-900/50 dark:bg-slate-900 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <RefreshCw size={22} className="animate-spin" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Restoring Database Records
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step {restoreProgress.step} of {restoreProgress.totalSteps}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="truncate">{restoreProgress.message}</span>
                  <span>{restoreProgress.percent}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${restoreProgress.percent}%` }}
                  />
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
                Please keep this browser window open while tables are being synchronized.
              </p>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Restoration Success Modal */}
        {/* ───────────────────────────────────────────────────────────── */}
        {restoreSuccessResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl dark:border-emerald-900 dark:bg-slate-900 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2 size={26} />
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
                ERP Restoration Successful!
              </h3>

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Your ERP database has been restored successfully. Cache invalidated and all relevant modules synchronized.
              </p>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Total Records Restored:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {restoreSuccessResult.restoredCount} records
                  </span>
                </div>
                <div className="mt-1 flex justify-between font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Tables Synchronized:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {restoreSuccessResult.restoredTables?.length || 0} modules
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRestoreSuccessResult(null);
                    window.location.reload();
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
                >
                  <RefreshCw size={15} />
                  Refresh ERP Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
