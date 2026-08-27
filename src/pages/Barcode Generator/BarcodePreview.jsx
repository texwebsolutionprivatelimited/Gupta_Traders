import BarcodeLabel from './BarcodeLabel'

// ─── Stat Card ──────────────────────────────────────────────────
function StatItem({ label, value, mono = false, accent = false }) {
  return (
    <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/30">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold truncate ${accent ? 'text-amber-400' : 'text-slate-200'} ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value}
      </p>
    </div>
  )
}

// ─── Barcode Preview Component ──────────────────────────────────
export default function BarcodePreview({
  labels,
  labelSize,
  columns,
  onEdit,
  onRegenerate,
  onPrint,
  generatedBarcode,
  productName,
  isPrinting,
}) {
  if (!labels || labels.length === 0) return null

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Dynamic print settings style block */}
      <style>{`
        @media print {
          /* Hide non-print structures */
          .no-print,
          header,
          footer,
          aside,
          nav,
          .sidebar,
          .navbar,
          #sidebar,
          #navbar {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
          }

          @page {
            size: ${columns === 1 ? `${labelSize.width}mm ${labelSize.height}mm` : 'A4'};
            margin: ${columns === 1 ? '0' : '5mm'} !important;
          }

          html, body {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${columns === 1 ? `${labelSize.width}mm` : 'auto'} !important;
            height: ${columns === 1 ? `${labelSize.height}mm` : 'auto'} !important;
            overflow: visible !important;
          }

          .barcode-print-area {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .barcode-print-area * {
            visibility: visible !important;
            color: #000 !important;
          }

          .barcode-label-grid {
            display: ${columns === 1 ? 'block' : 'grid'} !important;
            grid-template-columns: ${columns === 1 ? 'none' : `repeat(${columns}, ${labelSize.width}mm)`} !important;
            gap: ${columns === 1 ? '0' : '2mm'} !important;
            justify-content: ${columns === 1 ? 'stretch' : 'center'} !important;
            align-content: start !important;
            page-break-inside: auto !important;
          }

          .barcode-label-print {
            width: ${labelSize.width}mm !important;
            height: ${labelSize.height}mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
            padding: 1mm 1.5mm !important;
            background: #fff !important;
            border: ${columns === 1 ? 'none' : '0.3pt solid #ddd'} !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            ${columns === 1 ? 'page-break-after: always !important; break-after: page !important;' : ''}
          }
        }
      `}</style>

      {/* ─── Preview Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between no-print">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Barcode Preview
        </h3>
        <span className="text-xs text-slate-500">{labels.length} label{labels.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ─── Stats Grid ──────────────────────────────────────── */}
      <div className="bg-slate-900/70 border border-slate-800/60 rounded-2xl p-4 no-print">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatItem label="Total Labels" value={labels.length} accent />
          <StatItem label="Product" value={productName} />
          <StatItem label="Barcode" value={generatedBarcode} mono />
          <StatItem label="Label Size" value={`${labelSize.width} × ${labelSize.height} mm`} />
        </div>
      </div>

      {/* ─── Label Grid — Screen Preview ─────────────────────── */}
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 overflow-hidden no-print">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
        >
          {labels.map((label, i) => (
            <BarcodeLabel key={`screen-${i}`} label={label} forPrint={false} />
          ))}
        </div>
      </div>

      {/* ─── Action Buttons ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 no-print">
        <button
          onClick={onEdit}
          className="px-5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 text-sm font-semibold text-slate-300 transition-all cursor-pointer active:scale-[0.97]"
          id="barcode-edit-btn"
        >
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
            Edit
          </span>
        </button>

        <button
          onClick={onRegenerate}
          className="px-5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 text-sm font-semibold text-slate-300 transition-all cursor-pointer active:scale-[0.97]"
          id="barcode-regenerate-btn"
        >
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Generate Again
          </span>
        </button>

        <button
          onClick={onPrint}
          disabled={isPrinting}
          className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.97] ml-auto"
          id="barcode-print-btn"
        >
          {isPrinting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Preparing Print...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.394 48.394 0 0 1 12.5 0m-12.5 0V5.625c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v2.009" />
              </svg>
              Print Barcodes
            </span>
          )}
        </button>
      </div>

      {/* ─── Hidden Print Area ───────────────────────────────── */}
      <div className="barcode-print-area">
        <div
          className="barcode-label-grid"
          style={{ gridTemplateColumns: columns === 1 ? 'none' : `repeat(${columns}, auto)` }}
        >
          {labels.map((label, i) => (
            <BarcodeLabel key={`print-${i}`} label={label} size={labelSize} forPrint={true} />
          ))}
        </div>
      </div>
    </div>
  )
}
