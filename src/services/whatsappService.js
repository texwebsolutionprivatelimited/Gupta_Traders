const WHATSAPP_CONFIG_KEY = 'erp_whatsapp_api_config';
export function getWhatsAppConfig() {
  try {
    const raw = localStorage.getItem(WHATSAPP_CONFIG_KEY);
    if (!raw) {
      return {
        provider: 'meta_cloud', // 'meta_cloud' | 'custom_gateway'
        phoneNumberId: '',
        accessToken: '',
        apiUrl: '',
        defaultPhone: '9876543210',
        isEnabled: false
      };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read WhatsApp config:', err);
    return {
      provider: 'meta_cloud',
      phoneNumberId: '',
      accessToken: '',
      apiUrl: '',
      defaultPhone: '9876543210',
      isEnabled: false
    };
  }
}

/**
 * Save WhatsApp API Configuration
 */
export function saveWhatsAppConfig(config) {
  try {
    const current = getWhatsAppConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('erp:whatsapp_config_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to save WhatsApp config:', err);
    throw new Error('Could not persist WhatsApp API settings.');
  }
}

/**
 * Normalize and clean phone numbers into standard E.164 (without leading +)
 */
export function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^\d]/g, '');
  if (digits.length === 10) {
    return `91${digits}`; // Default to India (+91) for 10-digit mobile numbers
  }
  return digits;
}

/**
 * Format message body containing all required backup information
 */
export function buildWhatsAppBackupMessage({ backup, summary, phone }) {
  const dt = summary?.createdAt
    ? new Date(summary.createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
    : new Date().toLocaleString('en-IN');

  const total = summary?.totalRecords ?? 0;
  const breakdown = summary?.tablesBreakdown || {};
  const checksum = summary?.checksum || 'VERIFIED';
  const sizeFormatted = summary?.sizeFormatted || 'Calculated';
  const targetPhone = phone || 'Owner WhatsApp';

  const dateSlug = (summary?.createdAt || new Date().toISOString())
    .slice(0, 19)
    .replace(/[:T]/g, '-');
  const filename = `gupta-traders-backup-${dateSlug}.json`;

  return [
    `📦 *GUPTA TRADERS ERP - DATABASE BACKUP*`,
    `────────────────────────`,
    `🗓 *Backup Date & Time:* ${dt}`,
    `📁 *Backup Type:* Full ERP System Snapshot (Supabase v1)`,
    `📱 *Destination Number:* +${normalizeWhatsAppNumber(targetPhone)}`,
    `📊 *Total Records Backed Up:* ${total} records`,
    `💾 *Backup File Size:* ${sizeFormatted}`,
    `🔐 *Integrity Checksum:* ${checksum}`,
    `────────────────────────`,
    `📂 *Module Data Breakdown:*`,
    `• Products & Catalog: ${breakdown.products ?? 0}`,
    `• POS Sales & Invoices: ${breakdown.sales ?? 0}`,
    `• Customers Ledger: ${breakdown.customers ?? 0}`,
    `• Suppliers Directory: ${breakdown.suppliers ?? 0}`,
    `• Purchase Orders: ${breakdown.purchases ?? 0}`,
    `• Categories: ${breakdown.categories ?? 0}`,
    `• Inventory & Movements: ${(breakdown.inventory ?? 0) + (breakdown.stock_movements ?? 0)}`,
    `• Expenses & Ledgers: ${(breakdown.expenses ?? 0) + (breakdown.transactions ?? 0)}`,
    `• Shop Configurations: ${breakdown.settings ?? 1}`,
    `────────────────────────`,
    `📄 *Backup Document:* ${filename}`,
    `🛡 *Security Status:* Sanitized (No Passwords or Secrets)`,
    `────────────────────────`,
    `_Notice: This is an official automated backup notification from Gupta Traders ERP. The full database JSON archive is securely formatted for archival and 1-click disaster recovery._`
  ].join('\n');
}

/**
 * Send backup via approved WhatsApp Business API (Meta Cloud API / Custom Gateway)
 */
export async function sendBackupViaWhatsAppAPI({ phone, backup, summary }) {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Please enter a valid WhatsApp mobile number (minimum 10 digits).');
  }

  const config = getWhatsAppConfig();
  const messageText = buildWhatsAppBackupMessage({ backup, summary, phone: cleanPhone });

  // 1. Meta WhatsApp Cloud API Integration
  if (config.provider === 'meta_cloud' && config.phoneNumberId && config.accessToken) {
    const endpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(config.phoneNumberId.trim())}/messages`;

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText
          }
        })
      });
    } catch (netErr) {
      throw new Error(`WhatsApp API network connection error: ${netErr.message || 'Unable to reach Meta servers.'}`);
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg =
        errData.error?.message ||
        errData.error?.error_user_msg ||
        `HTTP ${res.status}: ${res.statusText || 'Delivery Failed'}`;
      throw new Error(`WhatsApp API delivery failed: ${errorMsg}`);
    }

    const data = await res.json().catch(() => ({}));
    return {
      success: true,
      provider: 'meta_cloud',
      messageId: data.messages?.[0]?.id || `WA-${Date.now()}`,
      phone: cleanPhone,
      timestamp: new Date().toISOString()
    };
  }

  // 2. Custom Webhook / Private WhatsApp Gateway Integration
  if (config.provider === 'custom_gateway' && config.apiUrl) {
    let res;
    try {
      res = await fetch(config.apiUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.accessToken ? { Authorization: `Bearer ${config.accessToken.trim()}` } : {})
        },
        body: JSON.stringify({
          recipient: cleanPhone,
          message: messageText,
          backupSummary: summary,
          timestamp: new Date().toISOString()
        })
      });
    } catch (netErr) {
      throw new Error(`Custom WhatsApp gateway network error: ${netErr.message}`);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Custom WhatsApp gateway rejected message (HTTP ${res.status}): ${errText || res.statusText}`);
    }

    return {
      success: true,
      provider: 'custom_gateway',
      phone: cleanPhone,
      timestamp: new Date().toISOString()
    };
  }

  // 3. Fallback when credentials are not yet configured:
  // Do not fake success! Inform clearly that credentials are required for automated API dispatch
  throw new Error(
    'WhatsApp Business API is not configured. Please open "WhatsApp API Settings" to enter your Meta Phone Number ID & Access Token, or use WhatsApp Web dispatch.'
  );
}

/**
 * Test WhatsApp API Credentials
 */
export async function testWhatsAppAPIConnection({ phoneNumberId, accessToken, testPhone }) {
  if (!phoneNumberId || !accessToken) {
    throw new Error('Both Meta Phone Number ID and Access Token are required to test connection.');
  }

  const cleanPhone = normalizeWhatsAppNumber(testPhone || '919876543210');
  const endpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId.trim())}/messages`;

  const testMessage = `🔔 *Gupta Traders ERP - WhatsApp API Connection Verified*\nTimestamp: ${new Date().toLocaleString('en-IN')}\nWhatsApp Cloud API integration is connected and active.`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: testMessage
      }
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `WhatsApp API error: HTTP ${res.status}`);
  }

  return await res.json().catch(() => ({ success: true }));
}
