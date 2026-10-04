import { useState, useEffect, useRef } from 'react'
import { FaPlus, FaTimes, FaCalculator, FaBalanceScale, FaBox } from 'react-icons/fa'
import { formatINR } from '../../utils/erp'

export default function AddCustomItemModal({ isOpen = true, onClose, onAddToCart }) {
  // Mode: 'weight' (वजन) or 'piece' (नग/गिनती)
  const [itemMode, setItemMode] = useState('weight')
  // Weight unit: 'kg' or 'g'
  const [weightUnit, setWeightUnit] = useState('kg')
  
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [weightValue, setWeightValue] = useState('1')
  const [pieceQty, setPieceQty] = useState('1')
  const [unit, setUnit] = useState('Pcs')
  const [gstRate, setGstRate] = useState(18)
  
  const nameInputRef = useRef(null)
  const priceInputRef = useRef(null)
  const weightInputRef = useRef(null)

  // Focus name input when modal mounts and handle Escape key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50)
      
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Calculate effective quantity in standard units
  const rawWeight = parseFloat(weightValue) || 0
  const effectiveKg = weightUnit === 'kg' ? rawWeight : rawWeight / 1000
  const effectiveQty = itemMode === 'weight' ? effectiveKg : (parseFloat(pieceQty) || 0)
  
  const numPrice = parseFloat(price) || 0
  const subtotal = numPrice * effectiveQty
  const gstAmount = (subtotal * (Number(gstRate) || 0)) / 100
  const grandTotal = subtotal + gstAmount

  // Handle switching between kg and grams for weight
  const handleWeightUnitSwitch = (newUnit) => {
    if (newUnit === weightUnit) return
    const currentNum = parseFloat(weightValue)
    if (!isNaN(currentNum) && currentNum > 0) {
      if (newUnit === 'g') {
        // kg -> grams (e.g. 1.25 kg -> 1250 g)
        setWeightValue(String(Math.round(currentNum * 1000)))
      } else {
        // grams -> kg (e.g. 1250 g -> 1.25 kg)
        setWeightValue(String(Number((currentNum / 1000).toFixed(3))))
      }
    }
    setWeightUnit(newUnit)
    setTimeout(() => weightInputRef.current?.focus(), 30)
  }

  // Quick weight presets based on active weight unit
  const kgPresets = [
    { label: '0.25 kg (250g)', val: '0.25' },
    { label: '0.5 kg (½ kg)', val: '0.5' },
    { label: '0.75 kg (750g)', val: '0.75' },
    { label: '1 kg', val: '1' },
    { label: '1.25 kg', val: '1.25' },
    { label: '1.5 kg', val: '1.5' },
    { label: '2 kg', val: '2' },
    { label: '2.5 kg', val: '2.5' },
    { label: '5 kg', val: '5' }
  ]

  const gramPresets = [
    { label: '100g', val: '100' },
    { label: '250g', val: '250' },
    { label: '500g (½ kg)', val: '500' },
    { label: '750g', val: '750' },
    { label: '1000g (1 kg)', val: '1000' },
    { label: '1250g (1.25 kg)', val: '1250' },
    { label: '1500g (1.5 kg)', val: '1500' },
    { label: '2000g (2 kg)', val: '2000' },
    { label: '5000g (5 kg)', val: '5000' }
  ]

  // Quick piece presets
  const piecePresets = [
    { label: '1', val: '1' },
    { label: '2', val: '2' },
    { label: '3', val: '3' },
    { label: '5', val: '5' },
    { label: '10', val: '10' },
    { label: '12 (1 Doz)', val: '12' },
    { label: '20', val: '20' }
  ]

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!name.trim() || numPrice <= 0 || effectiveQty <= 0) {
      return
    }

    const itemUnit = itemMode === 'weight' ? 'kg' : unit
    const isLoose = itemMode === 'weight' || ['kg', 'g', 'ltr', 'meter'].includes(itemUnit.toLowerCase())

    const customProduct = {
      id: `loose-${Date.now()}`,
      name: name.trim(),
      salePrice: numPrice,
      price: numPrice,
      rate: numPrice,
      quantity: Number(effectiveQty.toFixed(3)),
      unit: itemUnit,
      isLoose: isLoose,
      gstRate: Number(gstRate) || 0,
      isCustomItem: true,
      cartId: `cart-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    }

    onAddToCart(customProduct)
    
    // Reset Form & Close
    setName('')
    setPrice('')
    setWeightValue('1')
    setWeightUnit('kg')
    setPieceQty('1')
    setUnit('Pcs')
    setGstRate(18)
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-[95%] sm:w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700/80 p-4 sm:p-6 shadow-2xl text-slate-100 transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-3.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FaPlus className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">Add Custom Item (मैन्युअल प्रोडक्ट)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
            title="Close (Esc)"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Mode Selector: Weight vs Quantity */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setItemMode('weight')}
            className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              itemMode === 'weight'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FaBalanceScale className="w-3.5 h-3.5" />
            <span>By Weight (वजन / Kg)</span>
          </button>

          <button
            type="button"
            onClick={() => setItemMode('piece')}
            className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              itemMode === 'piece'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FaBox className="w-3.5 h-3.5" />
            <span>By Quantity (गिनती / Pcs)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Product Name / Description (सामान का नाम) *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder={itemMode === 'weight' ? "e.g. Sugar / Dal / Rice / Loose Hardware..." : "e.g. Bearing 6204 Special / Nut-Bolt Packet..."}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  priceInputRef.current?.focus()
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
            />
          </div>

          {/* Price & Quantity/Weight Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Price Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {itemMode === 'weight' ? 'Rate per Kg (₹ / kg) *' : 'Price per Unit (₹) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm font-semibold">₹</span>
                <input
                  ref={priceInputRef}
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      weightInputRef.current?.focus()
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all font-semibold"
                />
              </div>
            </div>

            {/* Weight OR Quantity Input */}
            <div>
              {itemMode === 'weight' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Manual Weight ({weightUnit === 'kg' ? 'किलो' : 'ग्राम'}) *
                    </label>
                    {/* Unit Switcher: Kg vs Grams */}
                    <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleWeightUnitSwitch('kg')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          weightUnit === 'kg'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWeightUnitSwitch('g')}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                          weightUnit === 'g'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        grams (g)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      ref={weightInputRef}
                      type="number"
                      required
                      min="0.001"
                      step="any"
                      value={weightValue}
                      onChange={(e) => setWeightValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                      placeholder={weightUnit === 'kg' ? "e.g. 1.25" : "e.g. 1250"}
                      className="w-full pl-3 pr-14 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all font-bold"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                      {weightUnit}
                    </span>
                  </div>

                  {/* Real-time Equivalent conversion helper */}
                  <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center justify-between">
                    {weightUnit === 'kg' ? (
                      <span>= {rawWeight > 0 ? `${Math.round(rawWeight * 1000)} grams` : '0 grams'}</span>
                    ) : (
                      <span>= {rawWeight > 0 ? `${Number((rawWeight / 1000).toFixed(3))} kg` : '0 kg'}</span>
                    )}
                    <span className="text-[10px] text-slate-400">Type any value like 1.25</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Quantity (मात्रा) *
                  </label>
                  <div className="relative">
                    <input
                      ref={weightInputRef}
                      type="number"
                      required
                      min="0.001"
                      step="any"
                      value={pieceQty}
                      onChange={(e) => setPieceQty(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                      placeholder="1"
                      className="w-full pl-3 pr-14 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all font-bold"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                      {unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcut Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400">
                {itemMode === 'weight' 
                  ? (weightUnit === 'kg' ? 'Quick Weight (Kg Shortcuts):' : 'Quick Weight (Gram Shortcuts):')
                  : 'Quick Quantity Shortcuts:'}
              </span>
              <span className="text-[10px] text-slate-500">Click to select instantly</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {itemMode === 'weight' ? (
                (weightUnit === 'kg' ? kgPresets : gramPresets).map(preset => {
                  const isSelected = String(weightValue) === preset.val
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => {
                        setWeightValue(preset.val)
                        weightInputRef.current?.focus()
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })
              ) : (
                piecePresets.map(preset => {
                  const isSelected = String(pieceQty) === preset.val
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => {
                        setPieceQty(preset.val)
                        weightInputRef.current?.focus()
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Unit & GST Rate Grid (Shown for Piece mode or Unit override) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Unit Type (इकाई)
              </label>
              {itemMode === 'weight' ? (
                <div className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-300 font-medium flex items-center justify-between">
                  <span>Weight Base (किलो / ग्राम)</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Kg (Standard)
                  </span>
                </div>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer font-medium"
                >
                  <option value="Pcs" className="bg-slate-900 text-slate-100">Pcs (नग)</option>
                  <option value="Box" className="bg-slate-900 text-slate-100">Box (डिब्बा)</option>
                  <option value="Packet" className="bg-slate-900 text-slate-100">Packet (पैकेट)</option>
                  <option value="Dozen" className="bg-slate-900 text-slate-100">Dozen (दर्जन)</option>
                  <option value="Meter" className="bg-slate-900 text-slate-100">Meter (मीटर)</option>
                  <option value="Ltr" className="bg-slate-900 text-slate-100">Liter (लीटर)</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                GST Rate (%)
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer font-medium"
              >
                <option value={0} className="bg-slate-900 text-slate-100">0% (No GST)</option>
                <option value={5} className="bg-slate-900 text-slate-100">5% GST</option>
                <option value={12} className="bg-slate-900 text-slate-100">12% GST</option>
                <option value={18} className="bg-slate-900 text-slate-100">18% GST</option>
                <option value={28} className="bg-slate-900 text-slate-100">28% GST</option>
              </select>
            </div>
          </div>

          {/* Quick Summary Preview */}
          {subtotal > 0 && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <FaCalculator className="text-emerald-400 w-3.5 h-3.5" />
                  Calculation:
                </span>
                <span className="text-slate-300 font-mono text-xs font-semibold">
                  {effectiveQty} {itemMode === 'weight' ? 'kg' : unit} × {formatINR(numPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 font-medium">Total Amount:</span>
                <span className="font-bold text-emerald-400 text-sm sm:text-base">
                  {formatINR(subtotal)}
                  {gstRate > 0 && (
                    <span className="text-[11px] font-normal text-slate-400 ml-1.5">
                      (+{gstRate}% GST: {formatINR(grandTotal)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-700/60">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaPlus className="w-3 h-3" />
              Add to Cart ({effectiveQty > 0 ? `${effectiveQty} ${itemMode === 'weight' ? 'kg' : unit}` : 'Item'})
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}