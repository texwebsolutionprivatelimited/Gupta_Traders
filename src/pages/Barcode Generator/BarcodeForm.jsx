import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { unitOptions } from '../../hooks/productData'

export default function BarcodeForm({
  formData,
  onChange,
  onGenerate,
  isGenerating,
  generationStep = 'Generating...',
  errors,
  existingBarcode,
  onTranslate,
  isTranslating,
}) {
  const manualBarcodeSvgRef = useRef(null)

  useEffect(() => {
    if (manualBarcodeSvgRef.current && formData.manualBarcode && formData.manualBarcode.trim()) {
      try {
        JsBarcode(manualBarcodeSvgRef.current, formData.manualBarcode.trim(), {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        })
      } catch (e) {
        console.warn('Live barcode rendering error:', e)
      }
    }
  }, [formData.manualBarcode])

  const handleChange = (field) => (e) => onChange(field, e.target.value)

  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${errors[field]
      ? 'border-rose-500/60 focus:border-rose-500/80 focus:ring-rose-500/20'
      : 'border-slate-800/60 focus:border-amber-500/50 focus:ring-amber-500/20'
    }`

  const selectClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer ${errors[field]
      ? 'border-rose-500/60 focus:border-rose-500/80 focus:ring-rose-500/20'
      : 'border-slate-800/60 focus:border-amber-500/50 focus:ring-amber-500/20'
    }`

  return (
    <div className="bg-slate-900/70 border border-slate-800/60 rounded-2xl p-5 space-y-4">
      {/* Section Header */}
      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
        </svg>
        Product Details
      </h3>

      {/* Product Type & Manual Barcode Input */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Product Type <span className="text-rose-400">*</span>
          </label>
          <select
            value={formData.productType || 'packaged'}
            onChange={handleChange('productType')}
            className={selectClass('productType')}
            id="barcode-product-type"
          >
            <option value="packaged">Packaged Product</option>
            <option value="loose">Loose Product</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Barcode / SKU <span className="text-slate-600">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.manualBarcode || ''}
            onChange={handleChange('manualBarcode')}
            placeholder="Auto-generates if blank"
            className={inputClass('manualBarcode')}
            id="barcode-manual-input"
          />
        </div>
      </div>

      {/* Live Barcode Preview on Paste */}
      {formData.manualBarcode && formData.manualBarcode.trim() && (
        <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3 flex flex-col items-center justify-center animate-fadeIn">
          <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Instant Barcode Preview</p>
          <div className="bg-white p-2 rounded-lg flex justify-center w-full max-w-[200px]">
            <svg ref={manualBarcodeSvgRef} className="max-w-full" />
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">{formData.manualBarcode.trim()}</p>
        </div>
      )}

      {/* Product Name — English */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Product Name — English <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={handleChange('name')}
          onBlur={() => {
            if (formData.name.trim() && !formData.nameHi.trim() && onTranslate) {
              onTranslate(formData.name)
            }
          }}
          placeholder="e.g. Tata Salt"
          className={inputClass('name')}
          id="barcode-product-name"
        />
        {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
      </div>

      {/* Product Name — Hindi */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-slate-400">
            Product Name — Hindi <span className="text-slate-600">(हिंदी)</span>
          </label>
          {formData.name.trim() && onTranslate && (
            <button
              type="button"
              onClick={() => onTranslate(formData.name)}
              disabled={isTranslating}
              className="text-[10px] text-amber-500 hover:text-amber-400 disabled:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isTranslating ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Translating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 0 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                  </svg>
                  Translate
                </>
              )}
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={formData.nameHi}
            onChange={handleChange('nameHi')}
            placeholder="e.g. टाटा नमक"
            className={`${inputClass('nameHi')} pr-10`}
            id="barcode-product-name-hi"
            lang="hi"
            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
          />
          {isTranslating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <svg className="animate-spin h-3.5 w-3.5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-600 mt-1">Supports Unicode / Devanagari script</p>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Brand</label>
        <input
          type="text"
          value={formData.brand}
          onChange={handleChange('brand')}
          placeholder="e.g. Tata, Amul, Fortune"
          className={inputClass('brand')}
          id="barcode-brand"
        />
      </div>

      {/* Unit & Quantity — Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Unit <span className="text-rose-400">*</span>
          </label>
          <select
            value={formData.unit}
            onChange={handleChange('unit')}
            className={selectClass('unit')}
            id="barcode-unit"
          >
            {unitOptions.slice(0, 11).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Quantity <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={formData.quantity}
            onChange={handleChange('quantity')}
            placeholder="e.g. 500"
            className={inputClass('quantity')}
            id="barcode-quantity"
          />
          {errors.quantity && <p className="text-xs text-rose-400 mt-1">{errors.quantity}</p>}
        </div>
      </div>

      {/* Price & Barcode Count — Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Price / MRP (₹) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange('price')}
            placeholder="e.g. 30"
            className={inputClass('price')}
            id="barcode-price"
          />
          {errors.price && <p className="text-xs text-rose-400 mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            No. of Barcodes <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={formData.barcodeCount}
            onChange={handleChange('barcodeCount')}
            placeholder="e.g. 10"
            className={inputClass('barcodeCount')}
            id="barcode-count"
          />
          {errors.barcodeCount && <p className="text-xs text-rose-400 mt-1">{errors.barcodeCount}</p>}
        </div>
      </div>

      {/* Existing Barcode Info */}
      {existingBarcode && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center animate-fadeIn">
          <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Existing Barcode</p>
          <p className="text-sm font-mono font-bold text-emerald-300 tracking-wider">{existingBarcode}</p>
          <p className="text-[10px] text-slate-500 mt-1.5">This barcode will be reused — no new barcode generated</p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98]"
        id="barcode-generate-btn"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {generationStep}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14M6 5v14M8 5v14M12 5v14M15 5v14M18 5v14M21 5v14" />
            </svg>
            Generate Barcodes
          </span>
        )}
      </button>
    </div>
  )
}
