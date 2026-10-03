import { supabase } from '../supabase/supabase.js';
import { formatINR } from '../utils/erp';

const NOTIFICATIONS_STORAGE_KEY = 'erp_notifications';
const MAX_NOTIFICATIONS = 80;

/**
 * Get all stored notifications from localStorage, sorted newest first
 */
export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.error('Failed to read notifications from localStorage:', err);
    return [];
  }
}

/**
 * Count unread notifications
 */
export function getUnreadNotificationCount() {
  const list = getNotifications();
  return list.filter(n => !n.read).length;
}

/**
 * Add a new notification with deduplication
 * @param {Object} notification
 * @param {string} [notification.id]
 * @param {string} [notification.dedupKey]
 * @param {string} notification.title
 * @param {string} notification.message
 * @param {string} [notification.type='other']
 * @param {string} [notification.targetUrl='/']
 * @param {string} [notification.recordId]
 * @param {boolean} [notification.read=false]
 * @param {string} [notification.createdAt]
 * @param {Object} [notification.meta={}]
 */
export function addNotification(notification) {
  if (!notification || (!notification.title && !notification.message)) return null;

  try {
    const list = getNotifications();
    const targetId = notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const targetDedupKey = notification.dedupKey || notification.id || targetId;

    // Deduplication check: do not add duplicate for the exact same event
    const existingIndex = list.findIndex(n => {
      if (n.id === targetId) return true;
      if (n.dedupKey && n.dedupKey === targetDedupKey) return true;
      if (notification.recordId && n.recordId === notification.recordId && n.type === notification.type) return true;
      return false;
    });

    if (existingIndex !== -1) {
      // Event already recorded. Return existing without creating duplicate
      return list[existingIndex];
    }

    const newNotif = {
      id: targetId,
      dedupKey: targetDedupKey,
      title: notification.title || 'ERP Activity',
      message: notification.message || '',
      type: notification.type || 'other',
      targetUrl: notification.targetUrl || '/',
      recordId: notification.recordId ? String(notification.recordId) : null,
      read: notification.read ?? false,
      createdAt: notification.createdAt || new Date().toISOString(),
      meta: notification.meta || {},
    };

    const updated = [newNotif, ...list].slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global event for reactive update across all mounted components
    window.dispatchEvent(
      new CustomEvent('erp:notifications_updated', {
        detail: { notifications: updated, added: newNotif }
      })
    );
    return newNotif;
  } catch (err) {
    console.error('Failed to add notification:', err);
    return null;
  }
}

/**
 * Batch add notifications efficiently (useful when syncing from database)
 * Preserves user's read status for existing records.
 */
export function batchAddNotifications(newItems) {
  if (!Array.isArray(newItems) || newItems.length === 0) return getNotifications();

  try {
    const list = getNotifications();
    const existingMap = new Map();
    list.forEach(n => {
      existingMap.set(n.id, n);
      if (n.dedupKey) existingMap.set(n.dedupKey, n);
      if (n.recordId && n.type) existingMap.set(`${n.type}-${n.recordId}`, n);
    });

    const itemsToAdd = [];
    for (const item of newItems) {
      const targetId = item.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const targetDedupKey = item.dedupKey || targetId;
      const typeRecordKey = item.recordId && item.type ? `${item.type}-${item.recordId}` : null;

      if (!existingMap.has(targetId) && !existingMap.has(targetDedupKey) && (!typeRecordKey || !existingMap.has(typeRecordKey))) {
        const notifObj = {
          id: targetId,
          dedupKey: targetDedupKey,
          title: item.title || 'ERP Activity',
          message: item.message || '',
          type: item.type || 'other',
          targetUrl: item.targetUrl || '/',
          recordId: item.recordId ? String(item.recordId) : null,
          read: item.read ?? false,
          createdAt: item.createdAt || new Date().toISOString(),
          meta: item.meta || {},
        };
        itemsToAdd.push(notifObj);
        existingMap.set(targetId, notifObj);
        existingMap.set(targetDedupKey, notifObj);
        if (typeRecordKey) existingMap.set(typeRecordKey, notifObj);
      }
    }

    if (itemsToAdd.length === 0) return list;

    const combined = [...itemsToAdd, ...list]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, MAX_NOTIFICATIONS);

    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(combined));

    window.dispatchEvent(
      new CustomEvent('erp:notifications_updated', {
        detail: { notifications: combined, batchAdded: itemsToAdd.length }
      })
    );
    return combined;
  } catch (err) {
    console.error('Failed in batchAddNotifications:', err);
    return getNotifications();
  }
}

/**
 * Mark a specific notification as read
 */
export function markNotificationAsRead(id) {
  try {
    const list = getNotifications();
    const updated = list.map(n => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('erp:notifications_updated', {
        detail: { notifications: updated }
      })
    );
    return updated;
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    return getNotifications();
  }
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  try {
    const list = getNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('erp:notifications_updated', {
        detail: { notifications: updated }
      })
    );
    return updated;
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
    return getNotifications();
  }
}

/**
 * Remove a specific notification
 */
export function removeNotification(id) {
  try {
    const list = getNotifications();
    const updated = list.filter(n => n.id !== id);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('erp:notifications_updated', {
        detail: { notifications: updated }
      })
    );
    return updated;
  } catch (err) {
    console.error('Failed to remove notification:', err);
    return getNotifications();
  }
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(
      new CustomEvent('erp:notifications_updated', {
        detail: { notifications: [] }
      })
    );
    return [];
  } catch (err) {
    console.error('Failed to clear notifications:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Builders for Specific ERP Activity Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Purchase Return Notification Builder
 */
export function buildPurchaseReturnNotification({ returnNo, supplierName, items, totalAmount, date }) {
  const safeItems = Array.isArray(items) ? items : [];
  const firstItem = safeItems[0];
  const totalQty = safeItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const prodName = firstItem?.product || firstItem?.product_name || firstItem?.name || 'Returned Items';
  const itemSummary = safeItems.length > 1 ? `${prodName} +${safeItems.length - 1} more` : prodName;
  const numAmount = Number(totalAmount || 0);

  return {
    id: `purchase_return-${returnNo}`,
    dedupKey: `purchase_return-${returnNo}`,
    title: 'Purchase Return Processed',
    message: `${itemSummary} (${totalQty} returned) to ${supplierName || 'Supplier'}. Refund: ₹${formatINR(numAmount)}`,
    type: 'purchase_return',
    targetUrl: `/purchase/return?recordId=${encodeURIComponent(returnNo)}`,
    recordId: returnNo,
    createdAt: date || new Date().toISOString(),
    meta: {
      productName: itemSummary,
      quantity: totalQty,
      returnAmount: numAmount,
      supplier: supplierName || 'Supplier',
      returnNo,
    }
  };
}

/**
 * 2. Purchase Added Notification Builder (ONE notification per purchase bill/list)
 */
export function buildPurchaseAddedNotification({ id, billNo, supplierName, totalAmount, date, itemCount }) {
  const billLabel = billNo || id || 'Bill';
  const numAmount = Number(totalAmount || 0);

  return {
    id: `purchase-${id || billNo}`,
    dedupKey: `purchase-${id || billNo}`,
    title: 'Purchase Bill Added',
    message: `Bill #${billLabel} from ${supplierName || 'Supplier'} for ₹${formatINR(numAmount)}${itemCount ? ` (${itemCount} items)` : ''}`,
    type: 'purchase_added',
    targetUrl: `/purchase/history?viewId=${id || ''}&billNo=${encodeURIComponent(billLabel)}`,
    recordId: id || billNo,
    createdAt: date || new Date().toISOString(),
    meta: {
      supplier: supplierName || 'Supplier',
      billNo: billLabel,
      totalAmount: numAmount,
      itemCount
    }
  };
}

/**
 * 3. Stock Alert Notification Builder
 */
export function buildStockAlertNotification({ productId, productName, currentStock, minStock, unit = 'pcs' }) {
  const numCurrent = Number(currentStock || 0);
  const numMin = Number(minStock || 0);

  return {
    id: `stock_alert-${productId}-${numCurrent}`,
    dedupKey: `stock_alert-${productId}-${numCurrent}`,
    title: 'Low Stock Alert',
    message: `${productName}: Stock is at ${numCurrent} ${unit} (Min limit: ${numMin} ${unit})`,
    type: 'stock_alert',
    targetUrl: `/inventory?search=${encodeURIComponent(productName)}&alert=low_stock`,
    recordId: productId,
    createdAt: new Date().toISOString(),
    meta: {
      productName,
      currentStock: numCurrent,
      minStock: numMin,
      unit
    }
  };
}

/**
 * 4. New Supplier Notification Builder
 */
export function buildNewSupplierNotification({ id, supplierName, date, contact }) {
  return {
    id: `supplier-${id}`,
    dedupKey: `supplier-${id}`,
    title: 'New Supplier Registered',
    message: `Supplier "${supplierName}" added to directory${contact ? ` (${contact})` : ''}`,
    type: 'new_supplier',
    targetUrl: `/suppliers?search=${encodeURIComponent(supplierName)}&id=${id}`,
    recordId: id,
    createdAt: date || new Date().toISOString(),
    meta: {
      supplierName,
      contact
    }
  };
}

/**
 * 5. Sales Notification Builder
 */
export function buildNewSaleNotification({ id, invoiceNumber, totalAmount, date, paymentMethod, customerName }) {
  const inv = invoiceNumber || id || 'INV';
  const numAmount = Number(totalAmount || 0);

  return {
    id: `sale-${id || inv}`,
    dedupKey: `sale-${id || inv}`,
    title: 'Sale Completed',
    message: `Invoice #${inv} for ₹${formatINR(numAmount)}${customerName ? ` • ${customerName}` : ''} (${paymentMethod || 'Paid'})`,
    type: 'new_sale',
    targetUrl: `/sales/history?invoice=${encodeURIComponent(inv)}&saleId=${id || ''}`,
    recordId: id || inv,
    createdAt: date || new Date().toISOString(),
    meta: {
      invoiceNumber: inv,
      totalAmount: numAmount,
      paymentMethod,
      customerName
    }
  };
}

/**
 * 6. Sales Return Notification Builder
 */
export function buildSalesReturnNotification({ returnNumber, items, refundAmount, date, invoiceNumber }) {
  const safeItems = Array.isArray(items) ? items : [];
  const firstItem = safeItems[0];
  const totalQty = safeItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const prodName = firstItem?.product?.name || firstItem?.product_name || firstItem?.name || 'Items';
  const itemSummary = safeItems.length > 1 ? `${prodName} +${safeItems.length - 1} more` : prodName;
  const numAmount = Number(refundAmount || 0);

  return {
    id: `sales_return-${returnNumber}`,
    dedupKey: `sales_return-${returnNumber}`,
    title: 'Sales Return Processed',
    message: `${itemSummary} (${totalQty} returned). Refund: ₹${formatINR(numAmount)} (Voucher #${returnNumber})`,
    type: 'sales_return',
    targetUrl: `/sales/return?returnNumber=${encodeURIComponent(returnNumber)}`,
    recordId: returnNumber,
    createdAt: date || new Date().toISOString(),
    meta: {
      productName: itemSummary,
      quantity: totalQty,
      refundAmount: numAmount,
      returnNumber,
      invoiceNumber
    }
  };
}

/**
 * 7. New Product Notification Builder
 */
export function buildNewProductNotification({ id, productName, stock = 0, unit = 'pcs', date }) {
  const numStock = Number(stock || 0);
  return {
    id: `product-${id}`,
    dedupKey: `product-${id}`,
    title: 'New Product Added',
    message: `"${productName}" created with opening inventory of ${numStock} ${unit}`,
    type: 'new_product',
    targetUrl: `/products?search=${encodeURIComponent(productName)}&productId=${id}`,
    recordId: id,
    createdAt: date || new Date().toISOString(),
    meta: {
      productName,
      currentStock: numStock,
      unit
    }
  };
}

/**
 * 8. Inventory Update Notification Builder
 */
export function buildInventoryUpdateNotification({ productId, productName, delta, reason, newStock, unit = 'pcs' }) {
  const numDelta = Number(delta || 0);
  const sign = numDelta > 0 ? '+' : '';

  return {
    id: `inventory-${productId}-${Date.now()}`,
    dedupKey: `inventory-${productId}-${delta}-${reason}-${Date.now().toString().slice(0, 8)}`,
    title: 'Stock Level Adjusted',
    message: `${productName}: Adjusted by ${sign}${numDelta} ${unit} (${reason || 'Manual Adjustment'}). Current: ${newStock ?? 'Updated'} ${unit}`,
    type: 'inventory_update',
    targetUrl: `/inventory?search=${encodeURIComponent(productName)}`,
    recordId: productId,
    createdAt: new Date().toISOString(),
    meta: {
      productName,
      delta: numDelta,
      reason,
      newStock
    }
  };
}

/**
 * 9. Expense Notification Builder
 */
export function buildExpenseNotification({ id, category, amount, description, date }) {
  const catName = category || 'General';
  const numAmount = Number(amount || 0);

  let targetUrl = '/expenses';
  const lowerCat = String(catName).toLowerCase();
  if (lowerCat.includes('rent')) targetUrl = '/expenses/rent';
  else if (lowerCat.includes('electric')) targetUrl = '/expenses/electricity';
  else if (lowerCat.includes('salary') || lowerCat.includes('staff')) targetUrl = '/expenses/staff-salary';
  else targetUrl = '/expenses/miscellaneous';

  return {
    id: `expense-${id}`,
    dedupKey: `expense-${id}`,
    title: 'Expense Recorded',
    message: `${catName} expense of ₹${formatINR(numAmount)}${description ? ` • ${description}` : ''}`,
    type: 'expense_added',
    targetUrl,
    recordId: id,
    createdAt: date || new Date().toISOString(),
    meta: {
      category: catName,
      amount: numAmount,
      description
    }
  };
}

/**
 * 10. Customer Notification Builder
 */
export function buildNewCustomerNotification({ id, customerName, phone, date }) {
  return {
    id: `customer-${id}`,
    dedupKey: `customer-${id}`,
    title: 'New Customer Registered',
    message: `Customer "${customerName}"${phone ? ` (${phone})` : ''} added to system`,
    type: 'other',
    targetUrl: `/customers?search=${encodeURIComponent(customerName)}`,
    recordId: id,
    createdAt: date || new Date().toISOString(),
    meta: {
      customerName,
      phone
    }
  };
}

const NOTIF_SYNC_STORAGE_KEY = 'erp_last_notif_sync_time';
let lastSyncTimestamp = (() => {
  try {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem(NOTIF_SYNC_STORAGE_KEY) : null;
    return saved ? Number(saved) : 0;
  } catch {
    return 0;
  }
})();
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between automatic syncs

export async function syncRecentActivitiesFromDB(force = false) {
  const now = Date.now();
  if (!force && lastSyncTimestamp > 0 && (now - lastSyncTimestamp < SYNC_COOLDOWN_MS)) {
    return getNotifications();
  }

  try {
    const { listRecentNotificationActivities } = await import('./erpService.js');
    const {
      purchases,
      purchaseReturns,
      sales,
      salesReturns,
      suppliers,
      lowStockProducts,
      newProducts,
      expenses,
      movements
    } = await listRecentNotificationActivities({ forceRefresh: force });

    lastSyncTimestamp = Date.now();
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(NOTIF_SYNC_STORAGE_KEY, String(lastSyncTimestamp));
      }
    } catch {}
    const generated = [];

    // 1. Recent Purchase Returns
    (purchaseReturns || []).forEach(pr => {
      generated.push(buildPurchaseReturnNotification({
        returnNo: pr.return_number || pr.id,
        supplierName: pr.supplier?.company_name || 'Supplier',
        items: [],
        totalAmount: pr.total_amount,
        date: pr.return_date || pr.created_at
      }));
    });

    // 2. Recent Purchases Added
    (purchases || []).forEach(p => {
      generated.push(buildPurchaseAddedNotification({
        id: p.id,
        billNo: p.supplier_invoice_number || p.invoice_number,
        supplierName: p.supplier?.company_name || 'Supplier',
        totalAmount: p.total_amount,
        date: p.purchase_date || p.created_at
      }));
    });

    // 3. Recent Sales Completed
    (sales || []).forEach(s => {
      generated.push(buildNewSaleNotification({
        id: s.id,
        invoiceNumber: s.invoice_number,
        totalAmount: s.total_amount,
        date: s.sale_date || s.created_at,
        paymentMethod: s.payment_method,
        customerName: s.customer?.name || 'Walk-in Customer'
      }));
    });

    // 4. Recent Sales Returns
    (salesReturns || []).forEach(sr => {
      generated.push(buildSalesReturnNotification({
        returnNumber: sr.return_number || sr.id,
        items: [],
        refundAmount: sr.total_amount,
        date: sr.return_date || sr.created_at,
        invoiceNumber: sr.sale?.invoice_number
      }));
    });

    // 5. Recent Suppliers
    (suppliers || []).forEach(sup => {
      generated.push(buildNewSupplierNotification({
        id: sup.id,
        supplierName: sup.company_name,
        date: sup.created_at,
        contact: sup.phone || sup.contact_person
      }));
    });

    // 6. Stock Alerts
    (lowStockProducts || []).forEach(prod => {
      const inv = Array.isArray(prod.inventory) ? prod.inventory[0] : prod.inventory;
      const stock = Number(inv?.quantity || 0);
      const min = Number(prod.minimum_stock || 0);

      if (min > 0 && stock <= min) {
        generated.push(buildStockAlertNotification({
          productId: prod.id,
          productName: prod.name,
          currentStock: stock,
          minStock: min,
          unit: prod.unit || 'pcs'
        }));
      }
    });

    // 7. Recent New Products
    (newProducts || []).forEach(prod => {
      const inv = Array.isArray(prod.inventory) ? prod.inventory[0] : prod.inventory;
      generated.push(buildNewProductNotification({
        id: prod.id,
        productName: prod.name,
        stock: Number(inv?.quantity || 0),
        unit: prod.unit || 'pcs',
        date: prod.created_at
      }));
    });

    // 8. Recent Expenses
    (expenses || []).forEach(e => {
      generated.push(buildExpenseNotification({
        id: e.id,
        category: e.expense_type,
        amount: e.amount,
        description: e.description,
        date: e.expense_date || e.created_at
      }));
    });

    // 9. Recent Inventory Stock Adjustments
    (movements || []).forEach(m => {
      generated.push(buildInventoryUpdateNotification({
        productId: m.product_id,
        productName: m.product?.name || 'Product',
        delta: Number(m.quantity || 0),
        reason: m.reason,
        newStock: undefined,
        unit: m.product?.unit || 'pcs'
      }));
    });

    const result = batchAddNotifications(generated);
    checkMonthlyBackupReminder();
    return result;
  } catch (err) {
    console.warn('Failed to sync recent activities from DB:', err);
    return getNotifications();
  }
}

/**
 * Setup Realtime Supabase Subscriptions to update notifications automatically
 * Cleaned up to eliminate duplicate WebSocket channels
 */
export function setupRealtimeNotificationSubscriptions() {
  return () => { };
}

/**
 * Build notification for missing MRP alert
 */
export function buildMissingMrpNotification({ count, productNames = [], firstProductId = null }) {
  const namesStr = productNames.slice(0, 3).join(', ') + (productNames.length > 3 ? ` and ${productNames.length - 3} more` : '');
  const isSingle = count === 1;
  const targetUrl = firstProductId ? `/products?productId=${firstProductId}&action=edit-mrp` : '/products';

  return {
    id: `missing_mrp-${count}-${productNames.slice(0, 2).join('-')}`,
    dedupKey: `missing_mrp-${count}-${productNames.slice(0, 2).join('-')}`,
    title: '⚠️ Missing MRP Alert',
    message: isSingle
      ? `MRP is missing for "${namesStr}". Please add the MRP to continue.`
      : `MRP is missing for ${count} products (${namesStr}). Please add MRPs to continue.`,
    type: 'missing_mrp',
    targetUrl,
    recordId: firstProductId ? String(firstProductId) : 'missing_mrp',
    createdAt: new Date().toISOString(),
    meta: { count, productNames },
  };
}

/**
 * Build notification for monthly backup reminder
 */
export function buildBackupReminderNotification({ lastBackupDate = null } = {}) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let message = 'No ERP database backup has been created yet. Please create a backup now to keep your business records safe.';

  if (lastBackupDate) {
    try {
      const dt = new Date(lastBackupDate);
      const dateText = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const daysAgo = Math.max(0, Math.floor((now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24)));
      message = `Last ERP backup was performed on ${dateText} (${daysAgo} days ago). Please create a new database backup to secure current records.`;
    } catch (_) { }
  }

  return {
    id: `backup_reminder-${currentMonthKey}`,
    dedupKey: `backup_reminder-${currentMonthKey}`,
    title: 'Monthly Backup Reminder',
    message,
    type: 'backup_reminder',
    targetUrl: '/settings/backup',
    recordId: `backup-${currentMonthKey}`,
    createdAt: new Date().toISOString(),
    meta: {
      lastBackupDate,
      monthKey: currentMonthKey
    }
  };
}

/**
 * Check if a monthly backup reminder is needed and add it without duplicates
 */
export function checkMonthlyBackupReminder() {
  try {
    const rawDate = localStorage.getItem('erp_last_backup_date');
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // If backup was created within the current calendar month AND less than 30 days ago, no reminder
    if (rawDate) {
      const lastDate = new Date(rawDate);
      const backupMonthKey = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;
      const daysAgo = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

      if (backupMonthKey === currentMonthKey || daysAgo < 30) {
        return null;
      }
    }

    // Deduplication check: do not create duplicate reminder if one already exists for this month
    const existing = getNotifications();
    const alreadyReminded = existing.some(
      n => n.dedupKey === `backup_reminder-${currentMonthKey}` || n.id === `backup_reminder-${currentMonthKey}`
    );
    if (alreadyReminded) return null;

    const notif = buildBackupReminderNotification({ lastBackupDate: rawDate });
    return addNotification(notif);
  } catch (err) {
    console.warn('Failed to check monthly backup reminder:', err);
    return null;
  }
}

/**
 * Clear or dismiss monthly backup reminder once a fresh backup is performed
 */
export function clearMonthlyBackupReminder() {
  try {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const list = getNotifications();
    const updated = list.filter(
      n => n.id !== `backup_reminder-${currentMonthKey}` && n.dedupKey !== `backup_reminder-${currentMonthKey}`
    );

    if (updated.length !== list.length) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('erp:notifications_updated', {
          detail: { notifications: updated }
        })
      );
    }
  } catch (_) { }
}
