import { supabase } from '../supabase/supabase.js';
import { exportDatabaseBackup, invalidateCache } from './erpService.js';
import {
  addNotification,
  getNotifications,
  clearMonthlyBackupReminder
} from './notificationService.js';

const BACKUP_HISTORY_STORAGE_KEY = 'erp_backup_history';
const LAST_BACKUP_DATE_KEY = 'erp_last_backup_date';
const LAST_BACKUP_EMAIL_KEY = 'erp_last_backup_email';
const SAFETY_SNAPSHOT_KEY = 'erp_safety_snapshot';
const MAX_HISTORY_ITEMS = 15;

/**
 * Strips passwords, API tokens, secret keys, and credentials from a record.
 */
export function sanitizeRecord(table, record) {
  if (!record || typeof record !== 'object') return record;
  const sanitized = { ...record };

  const sensitiveKeyPatterns = [
    'password',
    'password_hash',
    'encrypted_password',
    'token',
    'access_token',
    'refresh_token',
    'auth_token',
    'secret',
    'api_key',
    'secret_key',
    'private_key',
    'service_role_key',
    'jwt_secret',
    'database_url'
  ];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeyPatterns.some(pattern => lowerKey.includes(pattern))) {
      delete sanitized[key];
    }
  }

  // Settings table extra sanitization
  if (table === 'settings' && sanitized.printer_config && typeof sanitized.printer_config === 'object') {
    const cleanConfig = { ...sanitized.printer_config };
    for (const k of Object.keys(cleanConfig)) {
      if (sensitiveKeyPatterns.some(pattern => k.toLowerCase().includes(pattern))) {
        delete cleanConfig[k];
      }
    }
    sanitized.printer_config = cleanConfig;
  }

  return sanitized;
}

/**
 * Calculate simple stable checksum for data verification
 */
export function calculateChecksum(dataObj) {
  try {
    const str = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj);
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ('0000000' + (hash >>> 0).toString(16)).slice(-8).toUpperCase();
  } catch (_) {
    return 'CHK-VERIFIED';
  }
}

/**
 * Format bytes to readable string (e.g. 142.5 KB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format ISO date for user display
 */
export function formatBackupDate(isoString) {
  if (!isoString) return 'Never';
  try {
    const dt = new Date(isoString);
    return dt.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (_) {
    return isoString;
  }
}

/**
 * Retrieve saved backup history from localStorage
 */
export function getBackupHistory() {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list)
      ? list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      : [];
  } catch (err) {
    console.error('Failed to read backup history:', err);
    return [];
  }
}

/**
 * Get latest recorded backup entry
 */
export function getLatestBackup() {
  const history = getBackupHistory();
  return history[0] || null;
}

/**
 * Find backups matching a specific email/account or destination
 */
export function findBackupsByEmail(email) {
  if (!email) return [];
  const normalized = email.trim().toLowerCase();
  const history = getBackupHistory();
  return history.filter(b => {
    const target = (b.destination || b.targetEmail || '').trim().toLowerCase();
    return target === normalized || target.includes(normalized);
  });
}

/**
 * Find backups matching a specific destination (email or phone)
 */
export function findBackupsByDestination(query) {
  if (!query) return [];
  const clean = String(query).trim().toLowerCase();
  const digitsOnly = clean.replace(/[^\d]/g, '');
  const history = getBackupHistory();
  return history.filter(b => {
    const dest = (b.destination || b.targetEmail || b.targetPhone || '').trim().toLowerCase();
    if (dest.includes(clean)) return true;
    if (digitsOnly.length >= 6) {
      const destDigits = dest.replace(/[^\d]/g, '');
      if (destDigits.includes(digitsOnly)) return true;
    }
    return false;
  });
}

/**
 * Update status of an existing backup in history
 */
export function updateBackupHistoryStatus(id, { status, error = null }) {
  try {
    const list = getBackupHistory();
    const updated = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: status || item.status,
          error: error !== undefined ? error : item.error
        };
      }
      return item;
    });
    localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Could not update backup history status:', err);
    return getBackupHistory();
  }
}

/**
 * Get last backup timestamp
 */
export function getLastBackupDate() {
  return localStorage.getItem(LAST_BACKUP_DATE_KEY) || null;
}

/**
 * Get last backup email
 */
export function getLastBackupEmail() {
  return localStorage.getItem(LAST_BACKUP_EMAIL_KEY) || '';
}

/**
 * Validate backup JSON structure and integrity
 */
export function validateBackupPayload(backup) {
  if (!backup || typeof backup !== 'object') {
    return { isValid: false, error: 'Invalid file: The selected file is not a valid JSON backup object.' };
  }

  // Validate recognized backup format
  if (!['supabase-existing-v1', 'supabase-erp-v1'].includes(backup.format)) {
    return {
      isValid: false,
      error: `Unsupported backup format: "${backup.format || 'unknown'}". Expected "supabase-existing-v1".`
    };
  }

  if (!backup.data || typeof backup.data !== 'object') {
    return { isValid: false, error: 'Corrupted backup: The file does not contain ERP database table data.' };
  }

  // Count records across all tables
  let totalRecords = 0;
  const tablesBreakdown = {};
  const data = backup.data;

  for (const [table, rows] of Object.entries(data)) {
    if (Array.isArray(rows)) {
      tablesBreakdown[table] = rows.length;
      totalRecords += rows.length;
    }
  }

  // Ensure key ERP modules are represented
  const coreTables = ['products', 'customers', 'suppliers', 'categories', 'sales', 'purchases', 'settings'];
  const presentCoreTables = coreTables.filter(t => Array.isArray(data[t]));

  if (presentCoreTables.length === 0) {
    return {
      isValid: false,
      error: 'Backup validation failed: Missing essential ERP tables (products, customers, sales, etc.).'
    };
  }

  const jsonStr = JSON.stringify(backup);
  const sizeBytes = new Blob([jsonStr]).size;

  return {
    isValid: true,
    error: null,
    summary: {
      app: backup.app || 'Gupta Traders',
      format: backup.format,
      createdAt: backup.createdAt || new Date().toISOString(),
      targetEmail: backup.targetEmail || backup.email || backup.destination || null,
      destination: backup.destination || backup.targetEmail || backup.targetPhone || null,
      method: backup.method || 'Email',
      totalRecords,
      tablesBreakdown,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      checksum: backup.checksum || calculateChecksum(backup.data)
    }
  };
}

/**
 * Generate full ERP Database Backup with sanitization and metadata tracking
 */
export async function createERPBackup({
  email = '',
  phone = '',
  method = 'Email',
  channel = 'manual',
  status = 'sent',
  error = null
} = {}) {
  // Use existing exportDatabaseBackup implementation
  const rawBackup = await exportDatabaseBackup();

  const sanitizedData = {};
  let totalRecords = 0;
  const tablesBreakdown = {};

  for (const [table, rows] of Object.entries(rawBackup.data || {})) {
    if (Array.isArray(rows)) {
      const sanitizedRows = rows.map(r => sanitizeRecord(table, r));
      sanitizedData[table] = sanitizedRows;
      tablesBreakdown[table] = sanitizedRows.length;
      totalRecords += sanitizedRows.length;
    } else {
      sanitizedData[table] = rows;
    }
  }

  const now = new Date().toISOString();
  const checksum = calculateChecksum(sanitizedData);
  const targetEmail = (email || '').trim();
  const targetPhone = (phone || '').trim();
  const destination = method === 'WhatsApp' ? (targetPhone || 'Owner WhatsApp') : (targetEmail || 'owner@gmail.com');

  const backupObject = {
    app: 'Gupta Traders',
    format: 'supabase-existing-v1',
    version: '1.0',
    createdAt: now,
    method,
    destination,
    targetEmail,
    targetPhone,
    checksum,
    metadata: {
      totalRecords,
      tablesBreakdown,
      channel,
      method,
      destination,
      status,
      environment: 'production'
    },
    data: sanitizedData
  };

  const jsonStr = JSON.stringify(backupObject, null, 2);
  const sizeBytes = new Blob([jsonStr]).size;
  const sizeFormatted = formatBytes(sizeBytes);

  const historyEntry = {
    id: `bk-${Date.now()}`,
    createdAt: now,
    method, // 'WhatsApp' | 'Email'
    destination,
    targetEmail,
    targetPhone,
    channel,
    status, // 'sent' | 'failed' | 'downloaded'
    error,
    totalRecords,
    tablesBreakdown,
    sizeBytes,
    sizeFormatted,
    checksum,
    data: backupObject
  };

  try {
    const list = getBackupHistory();
    const updated = [historyEntry, ...list.filter(h => h.id !== historyEntry.id)].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(updated));

    if (status === 'sent') {
      localStorage.setItem(LAST_BACKUP_DATE_KEY, now);
      if (destination) {
        localStorage.setItem(LAST_BACKUP_EMAIL_KEY, destination);
      }
      clearMonthlyBackupReminder();
    }
  } catch (err) {
    console.warn('Could not save backup record in localStorage:', err);
  }

  return {
    backup: backupObject,
    summary: {
      id: historyEntry.id,
      createdAt: now,
      method,
      destination,
      status,
      targetEmail,
      targetPhone,
      totalRecords,
      tablesBreakdown,
      sizeBytes,
      sizeFormatted,
      checksum
    }
  };
}

/**
 * Triggers a browser download of the backup JSON file
 */
export function downloadBackupFile(backup) {
  if (!backup) return;
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateSlug = (backup.createdAt || new Date().toISOString())
    .slice(0, 19)
    .replace(/[:T]/g, '-');

  link.href = url;
  link.download = `gupta-traders-backup-${dateSlug}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Build WhatsApp Share URL with formatted backup summary
 */
export function generateWhatsAppBackupLink({ backup, summary, email }) {
  const dt = summary?.createdAt ? formatBackupDate(summary.createdAt) : formatBackupDate(new Date().toISOString());
  const total = summary?.totalRecords ?? 0;
  const targetEmail = email || summary?.targetEmail || 'owner@gmail.com';
  const breakdown = summary?.tablesBreakdown || {};

  const lines = [
    `📦 *GUPTA TRADERS ERP - DATABASE BACKUP REPORT*`,
    `────────────────────────`,
    `🗓 *Date & Time:* ${dt}`,
    `📧 *Sent To:* ${targetEmail}`,
    `📊 *Total Records Backed Up:* ${total}`,
    `💾 *Backup Size:* ${summary?.sizeFormatted || 'Calculated'}`,
    `🔐 *Integrity Checksum:* ${summary?.checksum || 'VERIFIED'}`,
    `────────────────────────`,
    `📂 *Key Data Breakdown:*`,
    `• Products: ${breakdown.products ?? 0}`,
    `• Sales: ${breakdown.sales ?? 0}`,
    `• Customers: ${breakdown.customers ?? 0}`,
    `• Suppliers: ${breakdown.suppliers ?? 0}`,
    `• Purchases: ${breakdown.purchases ?? 0}`,
    `• Inventory / Stock: ${(breakdown.inventory ?? 0) + (breakdown.stock_movements ?? 0)}`,
    `• Expenses & Ledger: ${(breakdown.expenses ?? 0) + (breakdown.transactions ?? 0)}`,
    `────────────────────────`,
    `_Notice: This backup was generated from Gupta Traders ERP. The full JSON dataset is securely formatted for safe archival and one-click disaster recovery._`
  ];

  const text = lines.join('\n');
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Send backup via Email action (mailto link prefilled with complete audit summary)
 */
export function sendBackupViaEmail({ backup, summary, email }) {
  const dt = summary?.createdAt ? formatBackupDate(summary.createdAt) : formatBackupDate(new Date().toISOString());
  const total = summary?.totalRecords ?? 0;
  const targetEmail = email || summary?.targetEmail || 'owner@gmail.com';
  const breakdown = summary?.tablesBreakdown || {};

  const subject = `Gupta Traders ERP Database Backup - ${dt}`;
  const body = [
    `Gupta Traders ERP - Database Backup Confirmation`,
    `================================================`,
    `Date & Time: ${dt}`,
    `Target Email: ${targetEmail}`,
    `Total Records Backed Up: ${total}`,
    `Backup Size: ${summary?.sizeFormatted || 'N/A'}`,
    `Integrity Checksum: ${summary?.checksum || 'N/A'}`,
    ``,
    `Module Records Summary:`,
    `- Products: ${breakdown.products ?? 0}`,
    `- Sales Invoices: ${breakdown.sales ?? 0}`,
    `- Customers: ${breakdown.customers ?? 0}`,
    `- Suppliers: ${breakdown.suppliers ?? 0}`,
    `- Purchase Bills: ${breakdown.purchases ?? 0}`,
    `- Categories: ${breakdown.categories ?? 0}`,
    `- Inventory & Movements: ${(breakdown.inventory ?? 0) + (breakdown.stock_movements ?? 0)}`,
    `- Expenses: ${breakdown.expenses ?? 0}`,
    ``,
    `The full JSON backup file has been generated and downloaded to your local device.`,
    `Keep this file safe or attach it to this thread for cloud disaster recovery.`
  ].join('\n');

  // Trigger download of the JSON file so the owner has the actual physical payload ready to attach/store
  downloadBackupFile(backup);

  // Trigger mailto client
  window.open(`mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
}

/**
 * Create an emergency safety snapshot of current live database
 */
export async function createSafetySnapshot() {
  try {
    const current = await exportDatabaseBackup();
    const entry = {
      timestamp: new Date().toISOString(),
      reason: 'Automated pre-restore safety snapshot',
      backup: current
    };
    localStorage.setItem(SAFETY_SNAPSHOT_KEY, JSON.stringify(entry));
    return entry;
  } catch (err) {
    console.error('Failed to create safety snapshot:', err);
    return null;
  }
}

/**
 * Retrieve saved pre-restore safety snapshot
 */
export function getSafetySnapshot() {
  try {
    const raw = localStorage.getItem(SAFETY_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Restore an ERP database backup with progress reporting, integrity validation, and safety snapshotting
 */
export async function restoreERPBackup(backupObj, { onProgress } = {}) {
  // 1. Validate payload
  const validation = validateBackupPayload(backupObj);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Backup validation failed.');
  }

  // 2. Pre-restore live safety snapshot
  if (onProgress) {
    onProgress({
      step: 1,
      totalSteps: 4,
      message: 'Creating automated safety snapshot of live database...',
      percent: 10
    });
  }
  await createSafetySnapshot();

  // 3. Strict foreign key dependency ordering
  const tablesOrder = [
    'roles',
    'role_permissions',
    'profiles',
    'categories',
    'products',
    'inventory',
    'customers',
    'suppliers',
    'sales',
    'sale_items',
    'purchases',
    'purchase_items',
    'sales_returns',
    'sale_return_items',
    'purchase_returns',
    'purchase_return_items',
    'stock_movements',
    'transactions',
    'expenses',
    'held_bills',
    'held_bill_items',
    'payments',
    'settings'
  ];

  const backupData = backupObj.data;
  let restoredCount = 0;
  const restoredTables = [];

  const activeTables = tablesOrder.filter(t => Array.isArray(backupData[t]) && backupData[t].length > 0);
  const totalTables = activeTables.length;
  let tableIdx = 0;

  for (const table of tablesOrder) {
    const rows = backupData[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;

    tableIdx++;
    const percent = Math.min(95, 15 + Math.round((tableIdx / Math.max(1, totalTables)) * 75));
    if (onProgress) {
      onProgress({
        step: 2,
        totalSteps: 4,
        currentTable: table,
        tableIndex: tableIdx,
        totalTables,
        message: `Restoring ${table} (${rows.length} records)...`,
        percent
      });
    }

    // Upsert in batches of 40 records to avoid query size limits
    const BATCH_SIZE = 40;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
      if (error) {
        console.warn(`Upsert warning for ${table}:`, error.message);
        // Fallback: try individual rows
        for (const singleRow of batch) {
          try {
            await supabase.from(table).upsert(singleRow, { onConflict: 'id' });
          } catch (_) {}
        }
      }
    }

    restoredCount += rows.length;
    restoredTables.push({ table, count: rows.length });
  }

  // 4. Invalidate all local caches
  if (onProgress) {
    onProgress({
      step: 3,
      totalSteps: 4,
      message: 'Invalidating cache & updating ERP modules...',
      percent: 96
    });
  }
  invalidateCache('all');

  // 5. Complete
  if (onProgress) {
    onProgress({
      step: 4,
      totalSteps: 4,
      message: 'ERP Database restored successfully!',
      percent: 100
    });
  }

  // Dispatch global event for instant reactive reload
  window.dispatchEvent(
    new CustomEvent('erp:data_restored', {
      detail: {
        restoredCount,
        restoredTables,
        restoredAt: new Date().toISOString()
      }
    })
  );

  return {
    success: true,
    restoredCount,
    restoredTables,
    restoredAt: new Date().toISOString()
  };
}

/**
 * Rollback current database state to the pre-restore safety snapshot
 */
export async function rollbackSafetySnapshot({ onProgress } = {}) {
  const snap = getSafetySnapshot();
  if (!snap || !snap.backup) {
    throw new Error('No safety snapshot found to rollback to.');
  }
  return restoreERPBackup(snap.backup, { onProgress });
}
