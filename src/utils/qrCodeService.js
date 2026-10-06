import QRCode from 'qrcode'
import jsQR from 'jsqr'

export const DEFAULT_QR_SETTINGS = {
  enabled: true,
  upiId: '9131822789@upi',
  payeeName: 'Gupta Traders & Superstore',
  amountMode: 'bill_amount', // 'bill_amount' | 'fixed'
  fixedAmount: '',
  uploadedQrImage: '', // Data URL of uploaded QR
  customNote: 'Bill Payment',
}

export function getStoredQrSettings() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_QR_SETTINGS }
  }
  try {
    const raw = localStorage.getItem('qrCodeSettings')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_QR_SETTINGS,
        ...parsed,
      }
    }
    // Also check businessSettings
    const bizRaw = localStorage.getItem('businessSettings')
    if (bizRaw) {
      const biz = JSON.parse(bizRaw)
      if (biz && biz.qrCode) {
        return {
          ...DEFAULT_QR_SETTINGS,
          ...biz.qrCode,
        }
      }
    }
  } catch (e) {
    console.warn('Failed to read QR settings:', e)
  }
  return { ...DEFAULT_QR_SETTINGS }
}

/**
 * Save QR code settings to localStorage and businessSettings
 */
export function saveStoredQrSettings(settings) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_QR_SETTINGS, ...settings }
  }
  try {
    const merged = { ...getStoredQrSettings(), ...settings }
    localStorage.setItem('qrCodeSettings', JSON.stringify(merged))

    // Mirror to businessSettings
    try {
      const bizRaw = localStorage.getItem('businessSettings')
      const biz = bizRaw ? JSON.parse(bizRaw) : {}
      biz.qrCode = merged
      localStorage.setItem('businessSettings', JSON.stringify(biz))
    } catch { }

    window.dispatchEvent(new CustomEvent('erp:qr_settings_updated', { detail: merged }))
    return merged
  } catch (e) {
    console.error('Failed to save QR settings:', e)
    throw e
  }
}

/**
 * Build a valid UPI payment deep link
 */
export function buildUpiUri({ upiId, payeeName, amount, billNumber, note }) {
  const cleanUpi = String(upiId || '9131822789@upi').trim()
  const cleanName = String(payeeName || 'Gupta Traders & Superstore').trim()
  const cleanNote = String(note || (billNumber ? `Invoice ${billNumber}` : 'Bill Payment')).trim()

  const params = new URLSearchParams()
  params.set('pa', cleanUpi)
  params.set('pn', cleanName)
  params.set('tn', cleanNote)
  params.set('cu', 'INR')

  const numAmount = Number(amount)
  if (!isNaN(numAmount) && numAmount > 0) {
    params.set('am', numAmount.toFixed(2))
  }

  return `upi://pay?${params.toString()}`
}

/**
 * Generate a synchronous SVG Data URI for any text payload
 */
export function generateSyncQrSvgUri(payload) {
  try {
    const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' })
    const size = qr.modules.size
    const data = qr.modules.data
    const margin = 2
    let rects = ''
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (data[r * size + c]) {
          rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="#000000"/>`
        }
      }
    }
    const totalDim = size + margin * 2
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/>${rects}</svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  } catch (e) {
    console.error('Failed to generate sync QR SVG:', e)
    return ''
  }
}

/**
 * Generate high-quality PNG Data URL (Promise)
 */
export async function generateQrPngDataUrl(payload, size = 260) {
  try {
    return await QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  } catch (e) {
    console.error('Failed to generate QR PNG:', e)
    return generateSyncQrSvgUri(payload)
  }
}

/**
 * Get the exact QR image data URI for a bill/receipt
 * Encodes the configured payment amount (bill amount or fixed)
 * without displaying the amount as text outside the QR
 */
export function getReceiptQrPayload(bill, settingsOverride = null) {
  const settings = settingsOverride || getStoredQrSettings()
  if (!settings.enabled) return null

  // Calculate amount to encode into the QR code
  let amount = 0
  if (settings.amountMode === 'fixed' && Number(settings.fixedAmount) > 0) {
    amount = Number(settings.fixedAmount)
  } else {
    // Dynamic bill amount: prioritize amountPaid or grandTotal
    const grand = Number(bill?.summary?.grandTotal ?? bill?.total ?? bill?.total_amount ?? 0)
    const paid = Number(bill?.amountPaid ?? bill?.paid_amount ?? grand)
    amount = grand > 0 ? grand : paid
  }

  const billNo = bill?.billNumber || bill?.invoice_number || bill?.invoice || bill?.id || ''
  const upiUri = buildUpiUri({
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    amount,
    billNumber: billNo,
    note: settings.customNote || `Bill ${billNo}`,
  })

  return {
    upiUri,
    amount,
    settings,
  }
}

/**
 * Generate ready-to-render QR Data URL (synchronous with SVG fallback, compatible with all prints & downloads)
 */
export function getReceiptQrCodeDataUrl(bill, settingsOverride = null) {
  const result = getReceiptQrPayload(bill, settingsOverride)
  if (!result) return ''
  return generateSyncQrSvgUri(result.upiUri)
}

/**
 * Decode uploaded QR code image to detect UPI ID and Payee Name
 */
export async function decodeQrFromImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code && code.data) {
          const raw = code.data
          let upiId = ''
          let payeeName = ''
          let amount = ''

          if (raw.startsWith('upi://pay?')) {
            const query = raw.slice('upi://pay?'.length)
            const params = new URLSearchParams(query)
            upiId = params.get('pa') || ''
            payeeName = params.get('pn') || ''
            amount = params.get('am') || ''
          } else {
            // Check regex for UPI ID pattern
            const upiMatch = raw.match(/([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/i)
            if (upiMatch) {
              upiId = upiMatch[1]
            }
          }

          resolve({
            found: true,
            rawText: raw,
            upiId,
            payeeName,
            amount,
          })
        } else {
          resolve({ found: false, rawText: '' })
        }
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image for QR decoding'))
    img.src = dataUrl
  })
}
