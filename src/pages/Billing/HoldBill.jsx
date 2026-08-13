import { formatINR } from '../../hooks/posData'
import { FaClipboard as ClipboardIcon, FaPause as PauseIcon, FaInbox as InboxIcon, FaTrash as TrashIcon } from 'react-icons/fa'

// ─── Hold Bill Drawer ────────────────────────────────────────────
export default function HoldBill({ heldBills, onRecall, onDelete, onClose }) {
  if (heldBills.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="text-slate-500 mb-4 flex justify-center">
            <ClipboardIcon className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-2">No Held Bills</h3>
          <p className="text-slate-400 text-sm mb-1">No bills are currently on hold.</p>
          <p className="text-slate-500 text-xs">कोई बिल होल्ड नहीं है</p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl max-w-lg w-full mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <PauseIcon className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-slate-100">Held Bills (होल्ड बिल)</h3>
              <p className="text-xs text-slate-500">{heldBills.length} bill{heldBills.length > 1 ? 's' : ''} on hold</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Held Bills List */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {heldBills.map((bill, index) => (
            <div
              key={bill.id}
              className="px-6 py-4 border-b border-slate-800/30 hover:bg-slate-800/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-indigo-400">#{index + 1}</span>
                    {bill.customerName && (
                      <span className="text-sm font-medium text-slate-200">{bill.customerName}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(bill.timestamp).toLocaleString('en-IN', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
                    })}
                    {' • '}{bill.items.length} item{bill.items.length > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-lg font-bold text-emerald-400">{formatINR(bill.total)}</span>
              </div>

              {/* Items preview */}
              <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                {bill.items.map(item => `${item.name} ×${item.quantity}`).join(', ')}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onRecall(bill.id)}
                  className="flex-1 py-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 text-xs font-semibold hover:bg-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <InboxIcon className="w-4 h-4" /> Recall Bill
                </button>
                <button
                  onClick={() => onDelete(bill.id)}
                  className="py-2 px-4 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <TrashIcon className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
