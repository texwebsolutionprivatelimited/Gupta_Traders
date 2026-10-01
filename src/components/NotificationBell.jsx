import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaTrashAlt,
  FaUndoAlt,
  FaShoppingCart,
  FaExclamationTriangle,
  FaBuilding,
  FaReceipt,
  FaExchangeAlt,
  FaBoxOpen,
  FaWarehouse,
  FaMoneyBillWave,
  FaSyncAlt,
  FaArrowRight,
  FaTag,
  FaDatabase
} from 'react-icons/fa';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  syncRecentActivitiesFromDB,
  checkMonthlyBackupReminder
} from '../services/notificationService';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const menuRef = useRef(null);

  // Sync state from localStorage & events
  const refreshList = () => {
    const list = getNotifications();
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.read).length);
  };

  useEffect(() => {
    refreshList();
    checkMonthlyBackupReminder();
    // Run an initial authentic database activity sync on mount
    syncRecentActivitiesFromDB().then(() => {
      checkMonthlyBackupReminder();
      refreshList();
    });

    const handleUpdate = () => refreshList();
    window.addEventListener('erp:notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('erp:notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async (e) => {
    e.stopPropagation();
    setIsSyncing(true);
    try {
      await syncRecentActivitiesFromDB(true);
      refreshList();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const handleSingleMarkRead = (e, notifId) => {
    e.stopPropagation();
    markNotificationAsRead(notifId);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllNotificationsAsRead();
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearAllNotifications();
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Icon and badge color resolver per notification type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'purchase_return':
        return {
          icon: <FaUndoAlt className="w-3.5 h-3.5 text-amber-500" />,
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
          badgeText: 'Purchase Return',
          badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
          actionText: 'Open Return Receipt'
        };
      case 'purchase_added':
        return {
          icon: <FaShoppingCart className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
          bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
          badgeText: 'Purchase Bill',
          badgeColor: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
          actionText: 'View Purchase Bill'
        };
      case 'stock_alert':
        return {
          icon: <FaExclamationTriangle className="w-3.5 h-3.5 text-rose-500" />,
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
          badgeText: 'Low Stock Alert',
          badgeColor: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
          actionText: 'View in Inventory'
        };
      case 'new_supplier':
        return {
          icon: <FaBuilding className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
          bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
          badgeText: 'New Supplier',
          badgeColor: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
          actionText: 'Open Supplier Details'
        };
      case 'new_sale':
        return {
          icon: <FaReceipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
          badgeText: 'Sale Completed',
          badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
          actionText: 'View Sales History'
        };
      case 'sales_return':
        return {
          icon: <FaExchangeAlt className="w-3.5 h-3.5 text-orange-500" />,
          bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/60',
          badgeText: 'Sales Return',
          badgeColor: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
          actionText: 'Open Return Voucher'
        };
      case 'new_product':
        return {
          icon: <FaBoxOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
          badgeText: 'New Product',
          badgeColor: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
          actionText: 'Open Product Details'
        };
      case 'inventory_update':
        return {
          icon: <FaWarehouse className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
          badgeText: 'Inventory Update',
          badgeColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
          actionText: 'Open Inventory Record'
        };
      case 'expense_added':
        return {
          icon: <FaMoneyBillWave className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />,
          bg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/60',
          badgeText: 'Expense Recorded',
          badgeColor: 'text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 border-pink-200 dark:border-pink-800',
          actionText: 'View Expense Record'
        };
      case 'missing_mrp':
        return {
          icon: <FaTag className="w-3.5 h-3.5 text-amber-500" />,
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
          badgeText: 'Missing MRP',
          badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
          actionText: 'Add Product MRP'
        };
      case 'backup_reminder':
        return {
          icon: <FaDatabase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
          badgeText: 'Monthly Backup Reminder',
          badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
          actionText: 'Backup ERP Now'
        };
      default:
        return {
          icon: <FaBell className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
          bg: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
          badgeText: 'ERP Activity',
          badgeColor: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          actionText: 'View Record'
        };
    }
  };

  const displayedNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div ref={menuRef} className="relative">
      {/* ── Notification Bell Button ──────────────────────────────── */}
      <button
        id="header-notification-bell"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer border ${
          isOpen
            ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50/80 dark:hover:bg-slate-800/60 border-transparent'
        }`}
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        aria-label="Notifications"
      >
        <FaBell className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Notification Dropdown Panel ───────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 md:w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-sky-950/15 overflow-hidden z-50 animate-fadeIn text-left">
          
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                <FaBell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Notifications
                </h3>
              </div>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <FaCheckDouble className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <FaTrashAlt className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-[11px] font-medium text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1 cursor-pointer transition-colors"
              title="Sync latest activities from database"
            >
              <FaSyncAlt className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-sky-500' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 dark:bg-slate-800/80 flex items-center justify-center text-sky-500 dark:text-sky-400 border border-sky-100 dark:border-slate-700/60">
                  <FaBell className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                  Real-time activity for purchases, returns, sales, stock alerts, and suppliers will appear here.
                </p>
              </div>
            ) : (
              displayedNotifications.map(notif => {
                const config = getTypeConfig(notif.type);
                const isUnread = !notif.read;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start group relative ${
                      isUnread
                        ? 'bg-sky-50/50 hover:bg-sky-100/70 dark:bg-sky-950/20 dark:hover:bg-sky-950/40 border-l-4 border-sky-500'
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Activity Type Icon */}
                    <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 border ${config.bg}`}>
                      {config.icon}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${config.badgeColor}`}>
                            {config.badgeText}
                          </span>
                          <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {notif.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap pl-1" title={notif.createdAt}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Message / Details */}
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action & Metadata Footer */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center gap-2">
                          {notif.recordId && (
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              #{String(notif.recordId).slice(-10)}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 flex items-center gap-1 transition-colors">
                            <span>{config.actionText}</span>
                            <FaArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <button
                              type="button"
                              onClick={(e) => handleSingleMarkRead(e, notif.id)}
                              className="p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                              title="Mark as read"
                            >
                              <FaCheck className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-slate-500 dark:text-slate-400">Live activity sync active</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
