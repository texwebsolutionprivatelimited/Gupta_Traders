export default function PurchaseSummary({
  subtotal,
  gstTotal,
  grandTotal,
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">
        Purchase Summary
      </h2>

      <div className="mt-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-slate-400">
            Subtotal
          </span>

          <span>
            ₹{subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">
            GST Total
          </span>

          <span>
            ₹{gstTotal.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-slate-700 pt-4 flex justify-between text-xl font-bold text-emerald-400">
          <span>Grand Total</span>

          <span>
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}