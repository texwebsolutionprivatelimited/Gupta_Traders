import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

// ─── Unit Display Mapping ───────────────────────────────────────
const UNIT_DISPLAY = {
  // Abbreviations
  kg: 'Kg', g: 'Gram', L: 'Litre', ml: 'ML',
  pcs: 'Piece', box: 'Box', packet: 'Packet', pack: 'Pack',
  dozen: 'Dozen', bottle: 'Bottle', meter: 'Meter', other: '',
  // Capitalized values
  Piece: 'Piece', Kg: 'Kg', Gram: 'Gram', Litre: 'Litre', ML: 'ML',
  Pack: 'Pack', Box: 'Box', Bottle: 'Bottle', Dozen: 'Dozen',
  Meter: 'Meter', Other: ''
}

export function getUnitDisplay(unitValue) {
  return UNIT_DISPLAY[unitValue] || unitValue || ''
}

// ─── Barcode Label Component ────────────────────────────────────
export default function BarcodeLabel({ label, size, forPrint = false }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (svgRef.current && label.barcode) {
      try {
        const height = forPrint 
          ? Math.max(16, Math.floor((size?.height || 40) * 0.8)) 
          : 28;
        const width = forPrint
          ? Math.max(1.0, Math.min(2.0, (size?.width || 60) / 38))
          : 1.4;
        JsBarcode(svgRef.current, label.barcode, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: false,
          margin: 0,
          background: 'transparent',
          lineColor: '#000000',
        })
      } catch (e) {
        console.error('Barcode render error:', e)
      }
    }
  }, [label.barcode, forPrint, size])

  const unitStr = getUnitDisplay(label.unit)

  // ─── Print Version ──────────────────────────────────────────
  if (forPrint) {
    return (
      <div
        className="barcode-label-print"
        style={{
          width: `${size?.width || 60}mm`,
          height: `${size?.height || 40}mm`,
          border: '0.3pt solid #ccc',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1mm 1.5mm',
          fontFamily: "'Arial', 'Noto Sans Devanagari', 'Mangal', sans-serif",
          color: '#000',
          textAlign: 'center',
          gap: '0.3mm',
          overflow: 'hidden',
          pageBreakInside: 'avoid',
        }}
      >
        {label.brand && (
          <div style={{ fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2 }}>
            {label.brand}
          </div>
        )}
        <div style={{ fontSize: '6.5pt', fontWeight: '600', lineHeight: 1.2 }}>
          {label.name}
        </div>
        {label.nameHi && (
          <div style={{ fontSize: '6.5pt', lineHeight: 1.2, fontFamily: "'Noto Sans Devanagari', 'Mangal', 'Devanagari MT', 'Arial Unicode MS', sans-serif" }}>
            {label.nameHi}
          </div>
        )}
        <div style={{ margin: '0.5mm 0', width: '92%', display: 'flex', justifyContent: 'center' }}>
          <svg ref={svgRef} style={{ maxWidth: '100%' }} />
        </div>
        <div style={{ fontSize: '5.5pt', fontFamily: "'Courier New', monospace", letterSpacing: '1px', lineHeight: 1 }}>
          {label.barcode}
        </div>
        <div style={{ fontSize: '7pt', fontWeight: 'bold', lineHeight: 1.2 }}>
          MRP ₹{label.price}
        </div>
        {label.quantity && (
          <div style={{ fontSize: '5.5pt', lineHeight: 1 }}>
            {label.quantity} {unitStr}
          </div>
        )}
      </div>
    )
  }

  // ─── Screen Preview Version ─────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/20 p-3 flex flex-col items-center justify-center gap-0.5 text-center transition-transform hover:scale-[1.02]" style={{ minHeight: '150px' }}>
      {label.brand && (
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider leading-tight">{label.brand}</p>
      )}
      <p className="text-[11px] font-semibold text-slate-900 leading-tight">{label.name}</p>
      {label.nameHi && (
        <p className="text-[11px] text-slate-700 leading-tight" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {label.nameHi}
        </p>
      )}
      <div className="my-1 w-[88%] flex justify-center">
        <svg ref={svgRef} className="max-w-full" />
      </div>
      <p className="text-[8px] text-slate-400 font-mono tracking-widest">{label.barcode}</p>
      <p className="text-[11px] font-bold text-slate-900">MRP ₹{label.price}</p>
      {label.quantity && (
        <p className="text-[9px] text-slate-500">{label.quantity} {unitStr}</p>
      )}
    </div>
  )
}
