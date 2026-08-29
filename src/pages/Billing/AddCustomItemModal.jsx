import { useState, useEffect, useRef } from 'react'
import { FaPlus, FaTimes } from 'react-icons/fa'

export default function AddCustomItemModal({ isOpen = true, onClose, onAddToCart }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('Pcs')
  const [gstRate, setGstRate] = useState(18)
  
  const nameInputRef = useRef(null)

  // Focus input when modal mounts
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const numPrice = Number(price)
    const numQty = Number(quantity)

    if (!name.trim() || isNaN(numPrice) || numPrice <= 0 || isNaN(numQty) || numQty <= 0) {
      return
    }

    const isLoose = ['kg', 'g', 'ltr', 'meter'].includes(unit.toLowerCase())

    const customProduct = {
      id: `loose-${Date.now()}`,
      name: name.trim(),
      salePrice: numPrice,
      price: numPrice,
      quantity: numQty,
      unit: unit,
      isLoose: isLoose,
      gstRate: Number(gstRate) || 0,
      isCustomItem: true,
      cartId: `cart-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    }

    onAddToCart(customProduct)
    
    // Reset Form & Close
    setName('')
    setPrice('')
    setQuantity(1)
    setUnit('Pcs')
    setGstRate(18)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-300 flex items-center gap-2">
            <FaPlus className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm shrink-0" />
            <span className="truncate">Add Custom Item (मैन्युअल प्रोडक्ट)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all shrink-0"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Product Name / Description *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="e.g. Bearing 6204 Special / Loose Hardware"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Price per Unit (₹) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0.001"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Unit Type
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
              >
                <option value="Pcs">Pcs (नग)</option>
                <option value="kg">Kg (किलोग्राम)</option>
                <option value="g">Gram (ग्राम)</option>
                <option value="Meter">Meter (मीटर)</option>
                <option value="Ltr">Liter (लीटर)</option>
                <option value="Packet">Packet (पैकेट)</option>
                <option value="Box">Box (डिब्बा)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                GST Rate (%)
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
              >
                <option value={0}>0% (Exempted)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
            >
              Add to Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}