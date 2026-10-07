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
        const labelHeight = size?.height || 40
        const labelWidth = size?.width || 60

        // Balanced barcode height leaving ample vertical space for Product Name and MRP
        const height = forPrint
          ? Math.max(12, Math.min(22, Math.floor(labelHeight * (labelHeight <= 26 ? 0.30 : 0.36))))
          : 26
        const width = forPrint
          ? Math.max(0.9, Math.min(1.8, (labelWidth - 12) / 40))
          : 1.3

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
  const mrpVal = Number(label.mrp || label.price || 0)
  const sellingVal = Number(label.sellingPrice || label.price || 0)
  const hasDiscount = mrpVal > 0 && sellingVal > 0 && mrpVal > sellingVal

  // ─── Print Version ──────────────────────────────────────────
  if (forPrint) {
    const labelHeight = size?.height || 40
    const isCompact = labelHeight <= 26
    const isMedium = labelHeight > 26 && labelHeight <= 35

    const nameFontSize = isCompact ? '8pt' : isMedium ? '9pt' : '10pt'
    const hindiFontSize = isCompact ? '7.5pt' : isMedium ? '8pt' : '9pt'
    const priceFontSize = isCompact ? '8pt' : isMedium ? '9pt' : '10.5pt'
    const brandFontSize = isCompact ? '6pt' : '7pt'

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
        {label.brand && label.brand !== 'General' && (
          <div style={{ fontSize: brandFontSize, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.1 }}>
            {label.brand}
          </div>
        )}

        {/* Product Name — High contrast & bold */}
        <div
          style={{
            fontSize: nameFontSize,
            fontWeight: '900',
            color: '#000',
            lineHeight: 1.15,
            maxWidth: '98%',
            wordBreak: 'break-word',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: label.nameHi ? 1 : 2,
            WebkitBoxOrient: 'vertical',
            letterSpacing: '-0.2px',
          }}
        >
          {label.name}
        </div>

        {label.nameHi && (
          <div
            style={{
              fontSize: hindiFontSize,
              fontWeight: '700',
              color: '#000',
              lineHeight: 1.3,
              maxWidth: '98%',
              wordBreak: 'break-word',
              fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Segoe UI', sans-serif",
            }}
          >
            {label.nameHi}
          </div>
        )}

        {/* Barcode SVG */}
        <div style={{ margin: '0.4mm 0', width: '94%', display: 'flex', justifyContent: 'center' }}>
          <svg ref={svgRef} style={{ maxWidth: '100%' }} />
        </div>

        <div style={{ fontSize: '6pt', fontFamily: "'Courier New', monospace", letterSpacing: '0.8px', lineHeight: 1, fontWeight: '700' }}>
          {label.barcode}
        </div>

        {/* Price Section — Prominently visible MRP and Sale Price */}
        {hasDiscount ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2mm', lineHeight: 1.1, margin: '0.3mm 0', width: '100%' }}>
            <span style={{ fontSize: priceFontSize, fontWeight: '800', color: '#000', textDecoration: 'line-through' }}>
              MRP: ₹{label.mrp}
            </span>
            <span style={{ fontSize: `${parseFloat(priceFontSize) * 1.05}pt`, fontWeight: '900', color: '#000', border: '0.8pt solid #000', padding: '0.2mm 1.2mm', borderRadius: '0.8mm' }}>
              ₹{label.sellingPrice || label.price}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', lineHeight: 1.1, margin: '0.3mm 0', width: '100%' }}>
            <span style={{ fontSize: `${parseFloat(priceFontSize) * 1.15}pt`, fontWeight: '900', color: '#000', letterSpacing: '0.3px' }}>
              MRP: ₹{label.mrp || label.price}
            </span>
          </div>
        )}

        {label.quantity && (
          <div style={{ fontSize: '6pt', fontWeight: '700', lineHeight: 1 }}>
            Net Qty: {label.quantity} {unitStr}
          </div>
        )}
      </div>
    )
  }

  // ─── Screen Preview Version ─────────────────────────────────
  return (
    <div
      className="bg-white rounded-xl shadow-md border border-slate-300 p-3.5 flex flex-col items-center justify-between text-center transition-all hover:shadow-lg hover:border-amber-500/60 group"
      style={{ minHeight: '190px' }}
    >
      {/* Top Section: Brand & Product Name */}
      <div className="w-full">
        {label.brand && label.brand !== 'General' && (
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none mb-1 truncate">
            {label.brand}
          </p>
        )}
        <p
          className="text-sm font-black text-slate-950 leading-snug line-clamp-2 px-0.5"
          title={label.name}
        >
          {label.name}
        </p>
        {label.nameHi && (
          <p
            className="text-[13px] font-bold text-slate-900 mt-0.5 leading-snug"
            style={{ fontFamily: "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Segoe UI', sans-serif" }}
          >
            {label.nameHi}
          </p>
        )}
      </div>

      {/* Barcode Section */}
      <div className="my-1.5 w-full flex flex-col items-center justify-center">
        <div className="w-[92%] flex justify-center overflow-hidden py-0.5">
          <svg ref={svgRef} className="max-w-full" />
        </div>
        <p className="text-[10px] text-slate-700 font-mono tracking-widest mt-0.5 font-bold">
          {label.barcode}
        </p>
      </div>

      {/* Bottom Section: MRP & Price Banner */}
      <div className="w-full border-t border-slate-200 pt-2 mt-auto">
        {hasDiscount ? (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800">
              MRP: <span className="line-through text-red-600 decoration-red-600 decoration-[1.5px] font-extrabold">₹{label.mrp}</span>
            </span>
            <span className="text-xs font-black text-emerald-950 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded-md shadow-xs">
              ₹{label.sellingPrice || label.price}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="text-sm font-black text-slate-950 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-md shadow-xs tracking-tight">
              MRP: ₹{label.mrp || label.price}
            </span>
          </div>
        )}

        {label.quantity && (
          <p className="text-[10px] font-bold text-slate-600 mt-1">
            Net Qty: {label.quantity} {unitStr}
          </p>
        )}
      </div>
    </div>
  )
}
