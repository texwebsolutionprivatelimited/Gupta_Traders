import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Smartphone,
  Eye,
  Trash2,
} from 'lucide-react'
import {
  getStoredQrSettings,
  saveStoredQrSettings,
  DEFAULT_QR_SETTINGS,
  buildUpiUri,
  generateSyncQrSvgUri,
  decodeQrFromImageDataUrl,
} from '../../utils/qrCodeService'
import { saveBusinessSettings } from '../../services/erpService'

export default function QRCodeSettings() {
  const [form, setForm] = useState(DEFAULT_QR_SETTINGS)
  const [previewSvgUri, setPreviewSvgUri] = useState('')
  const [isDecoding, setIsDecoding] = useState(false)
  const [decodeFeedback, setDecodeFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  // Load existing settings
  useEffect(() => {
    const current = getStoredQrSettings()
    setForm(current)
  }, [])

  // Regenerate live preview whenever UPI ID, Payee, Mode, or Fixed Amount changes
  useEffect(() => {
    const sampleAmount = form.amountMode === 'fixed' && Number(form.fixedAmount) > 0
      ? Number(form.fixedAmount)
      : 350.00 // demo sample amount for preview

    const uri = buildUpiUri({
      upiId: form.upiId || '9131822789@upi',
      payeeName: form.payeeName || 'Gupta Traders & Superstore',
      amount: form.amountMode === 'fixed' ? Number(form.fixedAmount) : sampleAmount,
      billNumber: 'DEMO-101',
      note: form.customNote || 'Bill Payment',
    })

    const svg = generateSyncQrSvgUri(uri)
    setPreviewSvgUri(svg)
  }, [form.upiId, form.payeeName, form.amountMode, form.fixedAmount, form.customNote])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Handle QR image file upload & automatic decoding
  const handleFileUpload = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please upload a valid image file (PNG, JPG, WebP)')
      return
    }

    setIsDecoding(true)
    setDecodeFeedback(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result
      if (!dataUrl) {
        setIsDecoding(false)
        return
      }

      setForm(prev => ({ ...prev, uploadedQrImage: dataUrl }))

      try {
        const decoded = await decodeQrFromImageDataUrl(dataUrl)
        if (decoded && decoded.found) {
          setForm(prev => ({
            ...prev,
            upiId: decoded.upiId || prev.upiId,
            payeeName: decoded.payeeName || prev.payeeName,
            ...(decoded.amount ? { amountMode: 'fixed', fixedAmount: decoded.amount } : {}),
          }))
          setDecodeFeedback({
            success: true,
            message: `QR Scanned Successfully! Extracted UPI ID: ${decoded.upiId || 'Auto-linked'}`,
          })
          showToast('success', 'QR decoded & UPI ID extracted!')
        } else {
          setDecodeFeedback({
            success: false,
            message: 'Image uploaded. QR details could not be auto-decoded. Please confirm your UPI ID below.',
          })
        }
      } catch (err) {
        console.warn('Decode error:', err)
        setDecodeFeedback({
          success: false,
          message: 'Image saved. Please verify UPI ID manually.',
        })
      } finally {
        setIsDecoding(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, uploadedQrImage: '' }))
    setDecodeFeedback(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset QR code settings to Gupta Traders defaults?')) {
      setForm(DEFAULT_QR_SETTINGS)
      saveStoredQrSettings(DEFAULT_QR_SETTINGS)
      showToast('success', 'Reset to defaults!')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.upiId.trim()) {
      showToast('error', 'UPI ID is required (e.g. 9131822789@upi)')
      return
    }

    setIsSaving(true)
    try {
      saveStoredQrSettings(form)
      try {
        await saveBusinessSettings({ qrCode: form })
      } catch {
        // LocalStorage fallback already succeeded
      }
      showToast('success', 'QR Code settings saved successfully!')
    } catch (err) {
      showToast('error', err.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb & Back */}
        <Link
          to="/settings"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>

        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <QrCode size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Receipt QR Code & Payment Settings
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload shop QR code and configure dynamic or fixed payment amounts encoded for customers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className={`mb-6 flex items-center gap-3 rounded-2xl p-4 text-sm font-medium shadow-sm transition-all ${
            toast.type === 'success'
              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          {/* Main Configuration Card (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Enable/Disable Toggle Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Show QR Code on Receipts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    When enabled, a scannable payment QR code is placed at the bottom of printed and shared receipts.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={form.enabled}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full dark:bg-slate-700"></div>
                </label>
              </div>
            </div>

            {/* QR Upload Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Upload size={18} className="text-amber-500" />
                Upload Shop QR Code (PhonePe, Paytm, GPay, BHIM)
              </h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Upload your existing standee or printed QR image. We will automatically detect and extract your UPI ID.
              </p>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-emerald-500/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  className="hidden"
                />

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Click to upload or drag & drop QR image
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  PNG, JPG, or WebP (Max 5MB)
                </p>

                {isDecoding && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                      Decoding QR & Extracting UPI...
                    </div>
                  </div>
                )}
              </div>

              {/* Decode Feedback */}
              {decodeFeedback && (
                <div className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                  decodeFeedback.success
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {decodeFeedback.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{decodeFeedback.message}</span>
                </div>
              )}

              {/* Uploaded Thumbnail if present */}
              {form.uploadedQrImage && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-center gap-3">
                    <img
                      src={form.uploadedQrImage}
                      alt="Uploaded QR"
                      className="h-12 w-12 rounded-lg object-contain bg-white border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Uploaded QR Saved</p>
                      <p className="text-[11px] text-slate-400">Scannable and ready</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* UPI & Payment Details Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone size={18} className="text-emerald-500" />
                UPI Payment Configuration
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    UPI VPA / ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={form.upiId}
                    onChange={handleChange}
                    placeholder="e.g. 9131822789@upi"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Default: 9131822789@upi</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Payee Name
                  </label>
                  <input
                    type="text"
                    name="payeeName"
                    value={form.payeeName}
                    onChange={handleChange}
                    placeholder="Gupta Traders & Superstore"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Business name shown on customer's UPI app</p>
                </div>
              </div>

              {/* Payment Amount Configuration Mode */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Payment Amount Configuration
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Dynamic Bill Amount Option */}
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                    form.amountMode === 'bill_amount'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                  }`}>
                    <input
                      type="radio"
                      name="amountMode"
                      value="bill_amount"
                      checked={form.amountMode === 'bill_amount'}
                      onChange={handleChange}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Dynamic Bill Amount (Recommended)
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        QR encodes the exact net payable amount of each receipt automatically.
                      </p>
                    </div>
                  </label>

                  {/* Fixed Amount Option */}
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                    form.amountMode === 'fixed'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
                  }`}>
                    <input
                      type="radio"
                      name="amountMode"
                      value="fixed"
                      checked={form.amountMode === 'fixed'}
                      onChange={handleChange}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Fixed Amount
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        Every receipt QR encodes a predetermined fixed amount.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Fixed Amount Input if enabled */}
                {form.amountMode === 'fixed' && (
                  <div className="pt-2 animate-fadeIn">
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Fixed Payment Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="fixedAmount"
                      min="1"
                      step="0.01"
                      value={form.fixedAmount}
                      onChange={handleChange}
                      placeholder="e.g. 500.00"
                      className="w-full sm:w-60 rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-emerald-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                    />
                  </div>
                )}
              </div>

              {/* Note / Transaction Note */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  UPI Transaction Note
                </label>
                <input
                  type="text"
                  name="customNote"
                  value={form.customNote}
                  onChange={handleChange}
                  placeholder="e.g. Gupta Traders Bill Payment"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save QR Settings
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Preview Sidebar (1 col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Eye size={16} className="text-amber-500" />
                  Live Customer Scan Preview
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={11} /> Real-Time
                </span>
              </div>

              {/* Scannable Card */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70 text-center">
                {previewSvgUri ? (
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
                    <img
                      src={previewSvgUri}
                      alt="Payment QR"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800">
                    <QrCode size={48} className="text-slate-400" />
                  </div>
                )}

                <div className="mt-4 space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    {form.payeeName || 'Gupta Traders & Superstore'}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {form.upiId || '9131822789@upi'}
                  </p>
                </div>

                {/* Important specification reminder note */}
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-left text-[11px] text-amber-700 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1">
                    <Sparkles size={12} /> Scanned On Customer Phone:
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                    The payment amount is embedded inside the QR data. When customers scan using Google Pay, PhonePe, or Paytm, the exact amount will appear directly inside their app.
                  </p>
                </div>
              </div>

              {/* Status summary */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Status:</span>
                  <span className={`font-bold ${form.enabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {form.enabled ? 'Active on Receipts' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Mode:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {form.amountMode === 'fixed' ? `Fixed (₹${form.fixedAmount || 0})` : 'Dynamic Bill Total'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Receipt Placement:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Bottom of Receipt
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
