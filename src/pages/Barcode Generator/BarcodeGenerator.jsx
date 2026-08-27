import { useState, useRef } from 'react'
import ProductSelector from './ProductSelector'
import BarcodeForm from './BarcodeForm'
import PrintSettings, { LABEL_SIZES } from './PrintSettings'
import BarcodePreview from './BarcodePreview'
import PrinterStatus from './PrinterStatus'
import {
  getAllProducts,
  updateProduct,
  addProduct,
  generateNextSKU,
} from '../../hooks/productData'

function generateUniqueBarcode() {
  const products = getAllProducts()
  const existing = new Set(
    products.filter((p) => p.barcode).map((p) => p.barcode.trim().toLowerCase())
  )
  let barcode
  let attempts = 0
  do {
    // Generate an 11-digit unique barcode string starting with '0'
    const ts = Date.now().toString().slice(-6)
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    barcode = '0' + ts + rand
    attempts++
  } while (existing.has(barcode) && attempts < 100)
  return barcode
}

// ─── Unit Normalizer ───────────────────────────────────────────
function normalizeUnit(unit) {
  if (!unit) return 'Piece'
  const u = String(unit).trim().toLowerCase()
  const map = {
    pcs: 'Piece', piece: 'Piece', pieces: 'Piece',
    kg: 'Kg', kilogram: 'Kg', kilograms: 'Kg',
    g: 'Gram', gram: 'Gram', grams: 'Gram',
    l: 'Litre', litre: 'Litre', litres: 'Litre',
    ml: 'ML', millilitre: 'ML', milliliters: 'ML',
    pack: 'Pack', package: 'Pack',
    box: 'Box',
    bottle: 'Bottle',
    dozen: 'Dozen',
    meter: 'Meter', metre: 'Meter', meters: 'Meter',
    other: 'Other'
  }
  for (const key of Object.keys(map)) {
    if (key.toLowerCase() === u) return map[key]
  }
  return unit.charAt(0).toUpperCase() + unit.slice(1)
}

// ─── Pack Size Parser ───────────────────────────────────────────
function parsePackSize(packSize) {
  if (!packSize) return { qty: '', unit: '' }
  const clean = packSize.replace(/^per\s+/i, '').trim()
  const match = clean.match(/^([\d.]+)\s*(.*)$/)
  if (match) {
    const qty = match[1]
    const unitStr = match[2].trim()
    return { qty, unit: normalizeUnit(unitStr) }
  }
  return { qty: '', unit: '' }
}

// ─── Print History ──────────────────────────────────────────────
function savePrintHistory(productName, barcode, count) {
  try {
    const history = JSON.parse(localStorage.getItem('gt_barcode_print_history') || '[]')
    const user = localStorage.getItem('userName') || localStorage.getItem('userRole') || 'Admin'
    history.unshift({
      id: `bp-${Date.now()}`,
      productName,
      barcode,
      quantityPrinted: count,
      printedAt: new Date().toISOString(),
      printedBy: user,
    })
    if (history.length > 100) history.length = 100
    localStorage.setItem('gt_barcode_print_history', JSON.stringify(history))
  } catch (e) {
    console.error('Failed to save print history:', e)
  }
}

// ─── Initial Form Data ─────────────────────────────────────────
const INITIAL_FORM = {
  name: '',
  nameHi: '',
  brand: '',
  unit: 'Piece',
  quantity: '1',
  price: '',
  barcodeCount: '10',
}

// ─── Empty State Component ──────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-slate-900/50 border border-slate-800/40 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[460px]">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14M6 5v14M8 5v14M12 5v14M15 5v14M18 5v14M21 5v14" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">Barcode Preview</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        Fill in the product details and click <strong className="text-amber-400">"Generate Barcodes"</strong> to see a live preview of your labels here.
      </p>
      <div className="mt-6 flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Real CODE128
        </span>
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Scannable
        </span>
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          POS Ready
        </span>
      </div>
    </div>
  )
}

// ─── Toast Component ────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl shadow-black/30 animate-slideIn max-w-sm ${isSuccess
      ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
      : 'bg-slate-900 border-rose-500/30 text-rose-400'
      }`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${isSuccess ? 'bg-emerald-500/10' : 'bg-rose-500/10'
        }`}>
        {isSuccess ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight">{toast.title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug truncate">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-2 text-sm font-bold cursor-pointer flex-shrink-0">✕</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN: Barcode Generator Page ───────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function BarcodeGenerator() {
  // ─── State ──────────────────────────────────────────────────
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [generatedBarcode, setGeneratedBarcode] = useState('')
  const [generatedLabels, setGeneratedLabels] = useState([])
  const [labelSize, setLabelSize] = useState(LABEL_SIZES[2]) // 60×40mm
  const [customSize, setCustomSize] = useState({ width: 60, height: 40 })
  const [columns, setColumns] = useState(4)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('Generating...')
  const [isPrinting, setIsPrinting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)
  const [isTranslating, setIsTranslating] = useState(false)

  // ─── Translation helper ──────────────────────────────────────
  const translateNameToHindi = async (text) => {
    if (!text || !text.trim()) return
    setIsTranslating(true)
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translated = data[0][0][0]
          setFormData(prev => ({ ...prev, nameHi: translated }))
        }
      }
    } catch (err) {
      console.error('Translation error:', err)
    } finally {
      setIsTranslating(false)
    }
  }

  // ─── Toast Helper ───────────────────────────────────────────
  const showToast = (type, title, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ type, title, message })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000)
  }

  // ─── Product Selection ──────────────────────────────────────
  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    const parsed = parsePackSize(product.packSize)
    const nameHi = product.nameHi || ''
    setFormData({
      name: product.name || '',
      nameHi: nameHi,
      brand: product.brand && product.brand !== 'General' ? product.brand : '',
      unit: parsed.unit || normalizeUnit(product.unit) || 'Piece',
      quantity: parsed.qty || '1',
      price: String(product.sellingPrice || product.mrp || ''),
      barcodeCount: '10',
    })
    setGeneratedBarcode(product.barcode || '')
    setErrors({})
    setShowPreview(false)
    setGeneratedLabels([])
  }

  const handleClearProduct = () => {
    setSelectedProduct(null)
    setFormData(INITIAL_FORM)
    setGeneratedBarcode('')
    setGeneratedLabels([])
    setShowPreview(false)
    setErrors({})
  }

  // ─── Form Change ────────────────────────────────────────────
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // ─── Validation ─────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Product name is required'
    if (!formData.price || Number(formData.price) <= 0 || isNaN(Number(formData.price))) {
      e.price = 'Enter a valid price'
    }
    if (!formData.quantity || Number(formData.quantity) <= 0 || isNaN(Number(formData.quantity))) {
      e.quantity = 'Enter a valid quantity'
    }
    const count = Number(formData.barcodeCount)
    if (!count || count <= 0 || count > 200 || isNaN(count) || !Number.isInteger(count)) {
      e.barcodeCount = 'Enter 1 to 200'
    }
    return e
  }

  // ─── Generate Barcodes ──────────────────────────────────────
  const handleGenerate = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      showToast('error', 'Validation Error', 'Please fix the highlighted fields')
      return
    }

    setIsGenerating(true)
    setErrors({})
    setGenerationStep('Generating...')

    try {
      // Step 1: Simulate generation UX
      await new Promise((r) => setTimeout(r, 450))
      setGenerationStep('Saving...')

      let barcode
      let productToUse = selectedProduct

      // ── Deduplication Check ──
      // If no product selected, look up if a product with the same name + unit exists
      if (!productToUse) {
        const normalizedInputUnit = normalizeUnit(formData.unit)
        const found = getAllProducts().find(p => 
          p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          normalizeUnit(p.unit).toLowerCase() === normalizedInputUnit.toLowerCase()
        )
        if (found) {
          productToUse = found
          setSelectedProduct(found)
        }
      }

      if (productToUse) {
        // ── Existing Product ──
        if (productToUse.barcode) {
          // Reuse existing barcode
          barcode = productToUse.barcode
        } else {
          // Generate new barcode for product that has none
          barcode = generateUniqueBarcode()
          updateProduct(productToUse.id, { barcode })
        }
        
        // Update product metadata in DB if needed (newly translated Hindi name, brand, or price changes)
        const updates = {}
        if (formData.nameHi.trim() && !productToUse.nameHi) {
          updates.nameHi = formData.nameHi.trim()
        }
        if (formData.brand.trim() && (!productToUse.brand || productToUse.brand === 'General')) {
          updates.brand = formData.brand.trim()
        }
        if (formData.price && Number(formData.price) !== Number(productToUse.sellingPrice)) {
          updates.sellingPrice = Number(formData.price)
        }
        if (Object.keys(updates).length > 0) {
          updateProduct(productToUse.id, updates)
        }
      } else if (generatedBarcode) {
        // ── Previously generated manual barcode — reuse barcode ──
        barcode = generatedBarcode
      } else {
        // ── New Manual Product — Create & Associate ──
        barcode = generateUniqueBarcode()
        const newProduct = addProduct({
          type: 'packaged',
          name: formData.name.trim(),
          nameHi: formData.nameHi.trim(),
          barcode,
          sku: generateNextSKU(),
          brand: formData.brand.trim() || 'General',
          unit: formData.unit,
          packSize: `${formData.quantity} ${formData.unit}`,
          purchasePrice: Number(formData.price),
          sellingPrice: Number(formData.price),
          category: 'grocery',
          currentStock: 0,
          minStock: 10,
          gstRate: 0,
        })
        setSelectedProduct(newProduct)
      }

      setGeneratedBarcode(barcode)
      
      // Step 2: Simulate saving transition
      await new Promise((r) => setTimeout(r, 350))

      // Create individual labels
      const count = parseInt(formData.barcodeCount, 10)
      const labels = Array.from({ length: count }, (_, i) => ({
        id: `label-${i}-${Date.now()}`,
        brand: formData.brand.trim(),
        name: formData.name.trim(),
        nameHi: formData.nameHi.trim(),
        barcode,
        price: formData.price,
        quantity: formData.quantity,
        unit: formData.unit,
      }))

      setGeneratedLabels(labels)
      setShowPreview(true)

      showToast('success', 'Barcodes Generated', `${count} labels created • ${barcode}`)
    } catch (err) {
      console.error('Generation error:', err)
      showToast('error', 'Generation Failed', err.message || 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  // ─── Print ──────────────────────────────────────────────────
  const handlePrint = () => {
    setIsPrinting(true)

    // Save print history
    savePrintHistory(formData.name, generatedBarcode, generatedLabels.length)

    // Allow print area to fully render, then trigger print dialog
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
      showToast('success', 'Print Dialog', 'Print dialog opened successfully')
    }, 600)
  }

  // ─── Edit / Regenerate ──────────────────────────────────────
  const handleEdit = () => setShowPreview(false)
  const handleRegenerate = () => handleGenerate()

  // Compute effective label size for print
  const effectiveLabelSize =
    labelSize.id === 'custom'
      ? { ...labelSize, width: Number(customSize.width) || 60, height: Number(customSize.height) || 40 }
      : labelSize

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* ─── Page Header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14M6 5v14M8 5v14M12 5v14M15 5v14M18 5v14M21 5v14" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Barcode Generator</h1>
            <p className="text-xs text-slate-500">बारकोड जनरेटर • Generate & print product labels</p>
          </div>
        </div>
        <PrinterStatus />
      </div>

      {/* ─── Main Split Layout ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Form Panel ─────────────────────────────── */}
        <div className="lg:w-[420px] xl:w-[460px] flex-shrink-0 space-y-0">
          <ProductSelector
            onSelect={handleProductSelect}
            selectedProduct={selectedProduct}
            onClear={handleClearProduct}
          />
          <BarcodeForm
            formData={formData}
            onChange={handleFormChange}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generationStep={generationStep}
            errors={errors}
            existingBarcode={selectedProduct?.barcode || ''}
            onTranslate={translateNameToHindi}
            isTranslating={isTranslating}
          />
          <PrintSettings
            labelSize={labelSize}
            onLabelSizeChange={setLabelSize}
            columns={columns}
            onColumnsChange={setColumns}
            customSize={customSize}
            onCustomSizeChange={setCustomSize}
          />
        </div>

        {/* ── Right: Preview Panel ─────────────────────────── */}
        <div className="flex-1 min-w-0">
          {showPreview && generatedLabels.length > 0 ? (
            <BarcodePreview
              labels={generatedLabels}
              labelSize={effectiveLabelSize}
              columns={columns}
              onEdit={handleEdit}
              onRegenerate={handleRegenerate}
              onPrint={handlePrint}
              generatedBarcode={generatedBarcode}
              productName={formData.name}
              isPrinting={isPrinting}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* ─── Toast Notification ────────────────────────────── */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
