import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  formatINR, unitOptions, gstOptions, generateNextSKU, generateNextProductCode,
  generateNextBarcode,
} from '../../utils/erp'
import { createProduct, listCategories, listUIProducts, removeProduct, subscribeToTable, updateProduct as updateRemoteProduct } from '../../services/erpService'

const FormContext = createContext(null)

function PackagedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function LooseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function StockWarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function BarcodeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
    </svg>
  )
}
// TOAST NOTIFICATION
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bg = type === 'success'
    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
    : type === 'error'
      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slideIn ${bg}`}>
      {type === 'success' && <CheckIcon />}
      {type === 'error' && <CloseIcon />}
      {type === 'warning' && <WarningIcon />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <CloseIcon />
      </button>
    </div>
  )
}
// DELETE CONFIRMATION MODAL
function DeleteConfirmModal({ product, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        {/* Warning icon */}
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <WarningIcon />
        </div>

        <h3 className="text-xl font-bold text-slate-100 text-center mb-2">
          Delete Product?
        </h3>
        <p className="text-slate-400 text-center mb-1 text-sm">
          Are you sure you want to delete this product?
        </p>
        <p className="text-slate-200 text-center font-semibold mb-6">
          {product.name}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 font-medium hover:bg-slate-700 transition-all text-sm cursor-pointer"
          >
            No, Keep It
          </button>
          <button
            onClick={() => onConfirm(product.id)}
            className="flex-1 px-5 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/25 transition-all text-sm cursor-pointer"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Form field renderer (simple, big, clear) ──────────
const Field = ({ label, field, type: inputType = 'text', placeholder, required, prefix, options, disabled, helpText }) => {
  const context = useContext(FormContext)
  if (!context) return null
  const { form, errors, handleChange, handleBlur } = context

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-300">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
            {prefix}
          </span>
        )}
        {options ? (
          <>
            <select
              value={form[field]}
              onChange={e => handleChange(field, e.target.value)}
              disabled={disabled}
              className={`
                w-full pl-4 pr-10 py-3 rounded-xl text-sm font-medium
                bg-slate-800/80 border text-slate-200
                focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                transition-all appearance-none cursor-pointer
                ${errors[field] ? 'border-rose-500/50' : 'border-slate-700/60'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </>
        ) : (
          <input
            type={inputType}
            value={form[field]}
            onChange={e => handleChange(field, e.target.value)}
            onBlur={() => {
              if (handleBlur) handleBlur(field)
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full py-3 rounded-xl text-sm font-medium
              bg-slate-800/80 border text-slate-200
              placeholder:text-slate-600
              focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
              transition-all
              ${prefix ? 'pl-9 pr-4' : 'px-4'}
              ${errors[field] ? 'border-rose-500/50' : 'border-slate-700/60'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        )}
      </div>
      {errors[field] && (
        <p className="text-xs text-rose-400 font-medium field-error">{errors[field]}</p>
      )}
    </div>
  )
}

// PRODUCT FORM MODAL (shared for Packaged & Loose)
function ProductFormModal({ product, type, categories, onSave, onClose }) {
  const isEditing = !!product
  const formRef = useRef(null)

  // Build default form values
  const defaultForm = type === 'packaged' ? {
    name: '', nameHi: '', barcode: '', sku: generateNextSKU(),
    category: categories[0]?.id || '', brand: '', unit: 'pcs',
    packSize: '', purchasePrice: '', sellingPrice: '', gstRate: 0,
    currentStock: '', minStock: 10,
  } : {
    name: '', nameHi: '', productCode: generateNextProductCode(),
    barcode: generateNextBarcode('loose'),
    category: 'loose', unit: 'kg',
    purchasePrice: '', sellingPrice: '', gstRate: 0,
    currentStock: '', minStock: 20,
  }

  const [form, setForm] = useState(isEditing ? { ...defaultForm, ...product } : defaultForm)
  const [errors, setErrors] = useState({})
  const [translating, setTranslating] = useState(false)

  const translateNameToHindi = async (text) => {
    if (!text.trim()) {
      setForm(prev => ({ ...prev, nameHi: '' }))
      return
    }
    setTranslating(true)
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translated = data[0][0][0]
          setForm(prev => ({ ...prev, nameHi: translated }))
        }
      }
    } catch (err) {
      console.error('Translation error:', err)
    } finally {
      setTranslating(false)
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBlur = (field) => {
    if (field === 'name') {
      translateNameToHindi(form.name)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Product name is required'
    if (!form.barcode.trim()) newErrors.barcode = 'Barcode is required'
    if (type === 'packaged' && !form.brand.trim()) newErrors.brand = 'Brand is required'
    if (!form.purchasePrice || Number(form.purchasePrice) <= 0) newErrors.purchasePrice = 'Enter valid price'
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) newErrors.sellingPrice = 'Enter valid price'
    if (Number(form.sellingPrice) < Number(form.purchasePrice)) newErrors.sellingPrice = 'Selling price should be ≥ purchase price'
    if (!form.currentStock && form.currentStock !== 0) newErrors.currentStock = 'Enter current stock'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      // Scroll to first error
      const firstError = formRef.current?.querySelector('.field-error')
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onSave({
      ...form,
      type,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      gstRate: Number(form.gstRate),
      currentStock: Number(form.currentStock),
      minStock: Number(form.minStock),
    })
  }

  // ─── Category options for dropdown ─────────────────────
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))

  // ─── Profit calculation ────────────────────────────────
  const profit = form.purchasePrice && form.sellingPrice
    ? (Number(form.sellingPrice) - Number(form.purchasePrice)).toFixed(2)
    : null

  return (
    <FormContext.Provider value={{ form, errors, handleChange, handleBlur }}>
      <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto py-8" onClick={onClose}>
        <div
          ref={formRef}
          className="bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-2xl mx-4 shadow-2xl animate-scaleIn"
          onClick={e => e.stopPropagation()}
        >
        {/* ── Header ───────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'packaged'
              ? 'bg-blue-500/15 text-blue-400'
              : 'bg-amber-500/15 text-amber-400'
              }`}>
              {type === 'packaged' ? <PackagedIcon /> : <LooseIcon />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-500">
                {type === 'packaged' ? 'Packaged / Branded Product' : 'Loose / Weight-Based Product'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Form ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">

          {/* Section 1: Basic Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
              Basic Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Product Name" field="name" placeholder="e.g. Tata Salt" required />
              </div>
              <Field
                label={translating ? "Hindi Name (Auto-translating...)" : "Hindi Name (Optional)"}
                field="nameHi"
                placeholder={translating ? "Writing in Hindi..." : "e.g. टाटा नमक"}
                helpText={translating ? "Automatically fetching translation..." : ""}
              />
              <Field
                label="Category"
                field="category"
                options={categoryOptions}
                required
              />
              {type === 'packaged' && (
                <Field label="Brand" field="brand" placeholder="e.g. Tata, Amul" required />
              )}
              <Field label="Unit" field="unit" options={unitOptions} required />
              {type === 'packaged' && (
                <Field label="Pack Size" field="packSize" placeholder="e.g. 1 kg, 500ml" />
              )}
            </div>
          </div>

          {/* Section 2: Codes & Barcode */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
              Codes & Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Barcode"
                field="barcode"
                placeholder={type === 'packaged' ? 'Scan or type barcode' : 'Auto-generated'}
                required
                helpText={type === 'packaged' ? 'Scan product barcode or type manually' : ''}
              />
              {type === 'packaged' ? (
                <Field
                  label="SKU"
                  field="sku"
                  placeholder="Auto-generated"
                  disabled={!isEditing}
                  helpText="Auto-generated unique code"
                />
              ) : (
                <Field
                  label="Product Code"
                  field="productCode"
                  placeholder="Auto-generated"
                  disabled={!isEditing}
                  helpText="Auto-generated unique code"
                />
              )}
            </div>
          </div>

          {/* Section 3: Pricing */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center text-xs font-bold">3</span>
              Pricing & Tax
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Purchase Price"
                field="purchasePrice"
                type="number"
                placeholder="0.00"
                prefix="₹"
                required
                helpText="Price you buy at"
              />
              <Field
                label="Selling Price (MRP)"
                field="sellingPrice"
                type="number"
                placeholder="0.00"
                prefix="₹"
                required
                helpText="Price you sell at"
              />
              <Field label="GST Rate" field="gstRate" options={gstOptions} />

              {/* Profit indicator */}
              {profit !== null && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${Number(profit) >= 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                    }`}>
                    {Number(profit) >= 0 ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Profit per unit</p>
                    <p className={`text-sm font-bold ${Number(profit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{profit}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Stock */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs font-bold">4</span>
              Stock Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Current Stock"
                field="currentStock"
                type="number"
                placeholder="0"
                required
                helpText={`In ${unitOptions.find(u => u.value === form.unit)?.label || form.unit}`}
              />
              <Field
                label="Minimum Stock Alert"
                field="minStock"
                type="number"
                placeholder="10"
                helpText="Alert when stock falls below this"
              />
            </div>
          </div>

          {/* ── Actions ────────────────────────────── */}
          <div className="flex gap-3 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 font-semibold hover:bg-slate-700 transition-all text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckIcon />
              {isEditing ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </FormContext.Provider>
  )
}
// PRODUCT CARD (mobile-friendly card view)
function ProductCard({ product, type, onEdit, onDelete }) {
  const isLowStock = product.currentStock <= (product.minStock || 10)

  return (
    <div className="group bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 hover:bg-slate-900 transition-all duration-200">
      {/* Top row: Name + Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-100 truncate">{product.name}</h3>
          {product.nameHi && (
            <p className="text-sm text-slate-500 truncate">{product.nameHi}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product)}
            className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/15 transition-all cursor-pointer"
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
            title="Delete"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      {/* Info badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs font-medium text-slate-400 border border-slate-700/40">
          {product.category}
        </span>
        {type === 'packaged' && product.brand && (
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-xs font-medium text-blue-400 border border-blue-500/20">
            {product.brand}
          </span>
        )}
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-xs font-medium text-violet-400 border border-violet-500/20">
          GST {product.gstRate}%
        </span>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/40">
        <div>
          <p className="text-[11px] text-slate-500 font-medium mb-0.5">Purchase</p>
          <p className="text-sm font-bold text-slate-300">{formatINR(product.purchasePrice)}</p>
        </div>
        <div className="text-slate-700">→</div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium mb-0.5">Selling</p>
          <p className="text-sm font-bold text-emerald-400">{formatINR(product.sellingPrice)}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${(product.sellingPrice - product.purchasePrice) >= 0
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-rose-500/10 text-rose-400'
          }`}>
          +₹{(product.sellingPrice - product.purchasePrice).toFixed(0)}
        </div>
      </div>

      {/* Bottom row: Barcode + Stock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <BarcodeIcon />
          <span className="font-mono">{product.barcode}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${isLowStock
          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
          {isLowStock && <StockWarningIcon />}
          {product.currentStock} {product.unit}
        </div>
      </div>
    </div>
  )
}
// PRODUCT TABLE (desktop view)
function ProductTable({ products, type, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-600">
          {type === 'packaged' ? <PackagedIcon /> : <LooseIcon />}
        </div>
        <p className="text-slate-500 font-medium">No products found</p>
        <p className="text-sm text-slate-600 mt-1">Add your first {type} product to get started</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table — hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/60">
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
              {type === 'packaged' && <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</th>}
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase ₹</th>
              <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Selling ₹</th>
              <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GST</th>
              <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const isLowStock = product.currentStock <= (product.minStock || 10)
              return (
                <tr
                  key={product.id}
                  className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{product.name}</p>
                      {product.nameHi && <p className="text-xs text-slate-500">{product.nameHi}</p>}
                    </div>
                  </td>
                  {type === 'packaged' && (
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-xs font-medium text-blue-400 border border-blue-500/20">
                        {product.brand}
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-slate-400">{product.barcode}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-400 capitalize">{product.category}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-slate-300">{formatINR(product.purchasePrice)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-bold text-emerald-400">{formatINR(product.sellingPrice)}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-xs font-medium text-violet-400">
                      {product.gstRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${isLowStock
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                      {isLowStock && <StockWarningIcon />}
                      {product.currentStock} {product.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/15 transition-all cursor-pointer"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view — visible on small screens */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            type={type}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  )
}
// MAIN PRODUCTS PAGE
const ITEMS_PER_PAGE = 10

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') || ''
  const urlTab = searchParams.get('tab') || ''

  const [activeTab, setActiveTab] = useState(urlTab || 'packaged')
  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [formType, setFormType] = useState('packaged')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef(null)

  // Sync state if URL params change
  useEffect(() => {
    setSearchQuery(urlSearch)
    if (urlTab) {
      setActiveTab(urlTab)
    }
  }, [urlSearch, urlTab])

  const handleSearchChange = (val) => {
    setSearchQuery(val)
    const params = {}
    if (val) params.search = val
    if (activeTab) params.tab = activeTab
    setSearchParams(params)
  }

  const handleTabChange = (tabVal) => {
    setActiveTab(tabVal)
    setCategoryFilter('all')
    const params = { tab: tabVal }
    if (searchQuery) params.search = searchQuery
    setSearchParams(params)
  }

  useEffect(() => {
    const handleClick = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ─── Pagination calculations ──────────────────────────
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = products.slice(startIndex, endIndex)

  // ─── Load products on tab/filter change ───────────────
  const loadProducts = async (query, tab, catFilter) => {
    try {
      let results=await listUIProducts({search:query||''})
      results=results.filter(p=>p.type===tab && (catFilter==='all'||p.category===catFilter))
      results.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));setProducts(results)
      setCategories((await listCategories()).map(c=>({...c,id:c.slug,name:c.name})))
    } catch(error){setToast({message:error.message,type:'error'})}
  }

  // Called from event handlers (after add/edit/delete)
  const refreshProducts = () => {
    loadProducts(searchQuery, activeTab, categoryFilter)
  }

  useEffect(() => {
    loadProducts(searchQuery, activeTab, categoryFilter)
    setCurrentPage(1)
  }, [activeTab, searchQuery, categoryFilter])

  useEffect(() => {
    const handleUpdate = () => {
      loadProducts(searchQuery, activeTab, categoryFilter)
    }
    const unsubscribeProducts=subscribeToTable('products',handleUpdate)
    const unsubscribeInventory=subscribeToTable('inventory',handleUpdate)
    return () => {
      unsubscribeProducts();unsubscribeInventory()
    }
  }, [searchQuery, activeTab, categoryFilter])

  // ─── Handlers ─────────────────────────────────────────
  const handleAddNew = (typeValue) => {
    setEditingProduct(null)
    setFormType(typeValue || activeTab)
    setShowForm(true)
    setShowAddMenu(false)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormType(product.type)
    setShowForm(true)
  }

  const handleDelete = (product) => {
    setDeleteTarget(product)
  }

  const confirmDelete = async (id) => {
    try{await removeProduct(id);setDeleteTarget(null);await refreshProducts();setToast({ message: 'Product deleted successfully', type: 'success' })}catch(error){setToast({message:error.message,type:'error'})}
  }

  const handleSave = async (formData) => {
    try{if (editingProduct) {
      await updateRemoteProduct(editingProduct.id, formData)
      setToast({ message: 'Product updated successfully!', type: 'success' })
    } else {
      await createProduct(formData)
      setToast({ message: 'New product added successfully!', type: 'success' })
    }
    setShowForm(false)
    setEditingProduct(null)
    await refreshProducts()}catch(error){setToast({message:error.message,type:'error'})}
  }

  // ─── Stats ────────────────────────────────────────────
  const allPackaged = products.filter(p=>p.type==='packaged')
  const allLoose = products.filter(p=>p.type==='loose')
  const totalProducts = allPackaged.length + allLoose.length
  const lowStockCount = [...allPackaged, ...allLoose].filter(p => p.currentStock <= (p.minStock || 10)).length

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6 lg:p-8 max-w-[1400px] mx-auto">

      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Page Header ───────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-1">
              Products
            </h1>
            <p className="text-slate-500 text-sm">
              Manage all your packaged and loose products in one place
            </p>
          </div>

          {/* Add Product Button with Dropdown Selector */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              id="add-product-btn"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 transition-all cursor-pointer text-sm"
            >
              <PlusIcon />
              <span>Add New Product</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                <button
                  onClick={() => handleAddNew('packaged')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-800/60"
                >
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">📦</span>
                  <div>
                    <p className="font-semibold text-slate-200">Packaged Product</p>
                    <p className="text-[10px] text-slate-500">Items with barcodes & brands</p>
                  </div>
                </button>
                <button
                  onClick={() => handleAddNew('loose')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">⚖️</span>
                  <div>
                    <p className="font-semibold text-slate-200">Loose Product</p>
                    <p className="text-[10px] text-slate-500">Weight-based loose items</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {/* Total Products */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-3 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <PackagedIcon />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100">{totalProducts}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Products</p>
        </div>

        {/* Packaged */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-3 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <PackagedIcon />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100">{allPackaged.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Packaged Items</p>
        </div>

        {/* Loose */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-3 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <LooseIcon />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100">{allLoose.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Loose Items</p>
        </div>

        {/* Low Stock */}
        <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-3 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockCount > 0
              ? 'bg-rose-500/15 text-rose-400'
              : 'bg-emerald-500/15 text-emerald-400'
              }`}>
              <WarningIcon />
            </div>
          </div>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
            {lowStockCount}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Low Stock Alert</p>
        </div>
      </div>

      {/* ── Tabs: Packaged / Loose ─────────────────── */}
      <div className="flex items-center gap-1.5 mb-6 bg-slate-900/50 p-1 rounded-2xl border border-slate-800/40 w-full sm:w-fit">
        <button
          onClick={() => handleTabChange('packaged')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeTab === 'packaged'
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-sm'
            : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
        >
          <span className="hidden sm:inline-flex"><PackagedIcon /></span>
          <span className="hidden sm:inline">Packaged Products</span>
          <span className="sm:hidden">Packaged</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${activeTab === 'packaged' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500'
            }`}>
            {allPackaged.length}
          </span>
        </button>
        <button
          onClick={() => handleTabChange('loose')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeTab === 'loose'
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-sm'
            : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
        >
          <span className="hidden sm:inline-flex"><LooseIcon /></span>
          <span className="hidden sm:inline">Loose Products</span>
          <span className="sm:hidden">Loose</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${activeTab === 'loose' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
            }`}>
            {allLoose.length}
          </span>
        </button>
      </div>

      {/* ── Search & Filter Bar ────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, barcode, SKU, brand..."
            id="product-search-input"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800/60 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="relative w-full sm:w-auto sm:min-w-[180px]">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            id="category-filter"
            className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-900/80 border border-slate-800/60 text-sm text-slate-300 font-medium focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Results count ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Showing <span className="text-slate-300 font-semibold">{startIndex + 1}–{Math.min(endIndex, products.length)}</span> of <span className="text-slate-300 font-semibold">{products.length}</span> {activeTab} products
          {searchQuery && <span> for "<span className="text-emerald-400">{searchQuery}</span>"</span>}
          {categoryFilter !== 'all' && <span> in <span className="text-blue-400 capitalize">{categoryFilter}</span></span>}
        </p>
        {totalPages > 1 && (
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Page <span className="text-slate-300 font-semibold">{currentPage}</span> of <span className="text-slate-300 font-semibold">{totalPages}</span>
          </p>
        )}
      </div>

      {/* ── Product List / Table ───────────────────── */}
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-2xl p-4 sm:p-6">
        <ProductTable
          products={paginatedProducts}
          type={activeTab}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* ── Pagination Controls ───────────────────── */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 pt-5 border-t border-slate-800/40">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${currentPage === 1
                ? 'bg-slate-800/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-100'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show: first, last, current, and ±1 around current. Ellipsis for gaps.
                const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                const showEllipsisBefore = page === currentPage - 2 && currentPage > 4
                const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 3

                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <span key={page} className="px-1 text-slate-600 text-sm">…</span>
                  )
                }

                if (!showPage) return null

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${page === currentPage
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700/40 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${currentPage === totalPages
                ? 'bg-slate-800/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-100'
                }`}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Form Modal ─────────────────────────────── */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          type={formType}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProduct(null) }}
        />
      )}

      {/* ── Delete Confirmation ─────────────────────── */}
      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
