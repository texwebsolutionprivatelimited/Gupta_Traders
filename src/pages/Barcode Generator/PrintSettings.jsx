// ─── Label Size Presets ─────────────────────────────────────────
export const LABEL_SIZES = [
  { id: '50x25', label: '50 × 25 mm', width: 50, height: 25 },
  { id: '50x30', label: '50 × 30 mm', width: 50, height: 30 },
  { id: '60x40', label: '60 × 40 mm', width: 60, height: 40 },
  { id: '100x50', label: '100 × 50 mm', width: 100, height: 50 },
  { id: 'custom', label: 'Custom Size', width: 60, height: 40 },
]

export default function PrintSettings({
  labelSize,
  onLabelSizeChange,
  columns,
  onColumnsChange,
  customSize,
  onCustomSizeChange,
}) {
  const handleSizeChange = (e) => {
    const selected = LABEL_SIZES.find((s) => s.id === e.target.value)
    if (selected) {
      onLabelSizeChange(selected)
    }
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800/60 rounded-2xl p-5 space-y-4 mt-5">
      {/* Section Header */}
      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.394 48.394 0 0 1 12.5 0m-12.5 0V5.625c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v2.009" />
        </svg>
        Print Settings
      </h3>

      {/* Label Size */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Label Size</label>
        <select
          value={labelSize.id}
          onChange={handleSizeChange}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
          id="barcode-label-size"
        >
          {LABEL_SIZES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Custom Dimensions */}
      {labelSize.id === 'custom' && (
        <div className="grid grid-cols-2 gap-3 animate-fadeIn">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Width (mm)</label>
            <input
              type="number"
              min="20"
              max="200"
              value={customSize.width}
              onChange={(e) => onCustomSizeChange({ ...customSize, width: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              id="barcode-custom-width"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Height (mm)</label>
            <input
              type="number"
              min="15"
              max="150"
              value={customSize.height}
              onChange={(e) => onCustomSizeChange({ ...customSize, height: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              id="barcode-custom-height"
            />
          </div>
        </div>
      )}

      {/* Columns per Row */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">
          Columns per Row
          <span className="text-slate-600 ml-1">({columns} columns)</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => onColumnsChange(n)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                columns === n
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600/60'
              }`}
              id={`barcode-col-${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
