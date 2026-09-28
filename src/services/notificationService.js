const NOTIFICATIONS_STORAGE_KEY = 'erp_notifications';
const MAX_NOTIFICATIONS = 50;

export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read notifications from localStorage:', err);
    return [];
  }
}

export function getUnreadNotificationCount() {
  const list = getNotifications();
  return list.filter(n => !n.read).length;
}

/**
 * Add a new notification
 * @param {Object} notification
 * @param {string} notification.title
 * @param {string} notification.message
 * @param {string} [notification.type='sales_return']
 * @param {string} [notification.targetUrl='/inventory']
 * @param {Object} [notification.meta={}]
 */
export function addNotification(notification) {
  try {
    const list = getNotifications();
    const newNotif = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: notification.title || 'Stock Notification',
      message: notification.message || '',
      type: notification.type || 'sales_return',
      targetUrl: notification.targetUrl || '/inventory',
      read: false,
      createdAt: notification.createdAt || new Date().toISOString(),
      meta: notification.meta || {},
    };

    const updated = [newNotif, ...list].slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global event for instant reactive update across all mounted components & header
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
 * Mark a specific notification as read
 * @param {string} id
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
 * @param {string} id
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
