import { useState, useEffect } from 'react'
import {
  getTrashItems,
  restoreFromTrash,
  permanentlyDeleteFromTrash,
  emptyTrash
} from '../../hooks/trashData'

// ─── SVG Icons ──────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

// ─── CONFIRMATION MODALS ───────────────────────────────────────

function ConfirmRestoreModal({ item, onConfirm, onCancel }) {
  const name =
    item.type === 'product' ? item.data.name :
    item.type === 'category' ? item.data.name :
    item.type === 'supplier' ? item.data.companyName :
    item.data.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-100">Recover Item?</h3>
          <p className="text-sm text-slate-400">
            Are you sure you want to recover the {item.type} <strong>{name}</strong>? It will be restored to active status.
          </p>
          <div className="flex items-center gap-3 w-full mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl transition-colors cursor-pointer border border-slate-800 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(item.trashId)}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-50 font-semibold rounded-2xl transition-colors cursor-pointer text-sm shadow-lg shadow-emerald-600/20"
            >
              Yes, Recover
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ item, onConfirm, onCancel }) {
  const name =
    item.type === 'product' ? item.data.name :
    item.type === 'category' ? item.data.name :
    item.type === 'supplier' ? item.data.companyName :
    item.data.name

  const typeName = item.type.charAt(0).toUpperCase() + item.type.slice(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
        <div className="flex flex-col items-center text-center gap-4">
          <WarningIcon />
          <h3 className="text-lg font-bold text-slate-100">Delete Permanently?</h3>
          <p className="text-sm text-slate-400">
            Are you sure you want to permanently delete the {item.type} <strong>{name}</strong>?
            This action is irreversible.
          </p>
          <div className="flex items-center gap-3 w-full mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl transition-colors cursor-pointer border border-slate-800 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(item.trashId)}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-slate-50 font-semibold rounded-2xl transition-colors cursor-pointer text-sm shadow-lg shadow-rose-600/20"
            >
              Delete Forever
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmEmptyModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
        <div className="flex flex-col items-center text-center gap-4">
          <WarningIcon />
          <h3 className="text-lg font-bold text-slate-100">Empty Trash Bin?</h3>
          <p className="text-sm text-slate-400">
            Are you sure you want to permanently delete all items in the trash?
            This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 w-full mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl transition-colors cursor-pointer border border-slate-800 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-slate-50 font-semibold rounded-2xl transition-colors cursor-pointer text-sm shadow-lg shadow-rose-600/20"
            >
              Empty All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [toast, setToast] = useState(null)
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [emptyModalOpen, setEmptyModalOpen] = useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [itemToRestore, setItemToRestore] = useState(null)

  const loadTrash = () => {
    setTrashItems(getTrashItems())
  }

  useEffect(() => {
    loadTrash()
  }, [])

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleRestoreConfirm = (trashId) => {
    const res = restoreFromTrash(trashId)
    setRestoreModalOpen(false)
    setItemToRestore(null)
    if (res.error) {
      triggerToast(res.error, 'error')
    } else {
      const restored = res.restoredItem
      const name =
        restored.type === 'product' ? restored.name :
        restored.type === 'category' ? restored.name :
        restored.type === 'supplier' ? restored.companyName :
        restored.name

      let restoredMessage = `Restored "${name}" successfully`
      if (restored.id !== restored.originalId) {
        restoredMessage += ` (Assigned new ID: ${restored.id} due to collision)`
      }
      triggerToast(restoredMessage, 'success')
      loadTrash()
    }
  }

  const handlePermanentDeleteConfirm = (trashId) => {
    permanentlyDeleteFromTrash(trashId)
    setDeleteModalOpen(false)
    setItemToDelete(null)
    triggerToast('Item permanently deleted from trash', 'success')
    loadTrash()
  }

  const handleEmptyTrashConfirm = () => {
    emptyTrash()
    setEmptyModalOpen(false)
    triggerToast('Trash bin emptied successfully', 'success')
    loadTrash()
  }

  // Filtered trash items
  const filteredItems = trashItems.filter(item => {
    const name = (
      item.type === 'product' ? item.data.name :
      item.type === 'category' ? item.data.name :
      item.type === 'supplier' ? item.data.companyName :
      item.data.name
    ).toLowerCase()

    const matchesSearch = name.includes(searchQuery.toLowerCase()) || item.originalId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || item.type === selectedType

    return matchesSearch && matchesType
  })

  // Expiration calculation helper
  const getDaysLeft = (deletedAt) => {
    const now = new Date()
    const deletedTime = new Date(deletedAt).getTime()
    const limit = 30 * 24 * 60 * 60 * 1000
    const elapsed = now.getTime() - deletedTime
    const remainingMs = limit - elapsed
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
    return remainingDays > 0 ? remainingDays : 0
  }

  const getTypeBadgeStyles = (type) => {
    switch (type) {
      case 'product':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'category':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'supplier':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'customer':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in relative min-h-screen pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-xl transition-all duration-300 animate-slide-in-right ${
          toast.type === 'error' 
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-rose-950/20' 
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20'
        }`}>
          <span className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Trash Bin</h1>
          <p className="text-sm text-slate-400 mt-1">
            Recover or permanently delete deleted items. Items are kept for up to 30 days.
          </p>
        </div>
        {trashItems.length > 0 && (
          <button
            onClick={() => setEmptyModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:text-slate-50 hover:bg-rose-600 transition-all font-semibold text-sm cursor-pointer shadow-lg shadow-rose-950/10"
          >
            <TrashIcon />
            Empty Trash Bin
          </button>
        )}
      </div>

      {/* ─── CONTROLS ──────────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800/60 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          
          {/* Search bar */}
          <div className="relative w-full lg:flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-500">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search deleted items by name or ID..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 text-sm transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Type Filter Tab Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-850 w-full lg:w-auto overflow-x-auto whitespace-nowrap scrollbar-none">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'product', label: 'Products' },
              { id: 'category', label: 'Categories' },
              { id: 'supplier', label: 'Suppliers' },
              { id: 'customer', label: 'Customers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-slate-850 text-emerald-400 font-bold border border-slate-750/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong>{filteredItems.length}</strong> of <strong>{trashItems.length}</strong> trash items
          </span>
          {(searchQuery || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedType('all')
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ─── DATA TABLE ────────────────────────────────────────────── */}
      {filteredItems.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/20">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Original ID</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Deleted Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Expiry Remaining</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredItems.map(item => {
                  const name =
                    item.type === 'product' ? item.data.name :
                    item.type === 'category' ? item.data.name :
                    item.type === 'supplier' ? item.data.companyName :
                    item.data.name

                  const secondaryDetails =
                    item.type === 'product' ? (item.data.type === 'packaged' ? `Brand: ${item.data.brand || 'General'} | Category: ${item.data.category}` : `Unit: ${item.data.unit}`) :
                    item.type === 'supplier' ? `Contact: ${item.data.contactPerson || 'N/A'} | City: ${item.data.city || 'N/A'}` :
                    item.type === 'customer' ? `Phone: ${item.data.phone || 'N/A'} | City: ${item.data.city || 'N/A'}` :
                    item.data.description || 'No description'

                  const daysLeft = getDaysLeft(item.deletedAt)

                  return (
                    <tr key={item.trashId} className="hover:bg-slate-950/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {name}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {secondaryDetails}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${getTypeBadgeStyles(item.type)}`}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-medium font-mono">
                        {item.originalId}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {new Date(item.deletedAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-bold ${
                            daysLeft <= 5 ? 'text-rose-400' : daysLeft <= 15 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                          </span>
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                daysLeft <= 5 ? 'bg-rose-500' : daysLeft <= 15 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(daysLeft / 30) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setItemToRestore(item)
                              setRestoreModalOpen(true)
                            }}
                            title="Restore Item"
                            className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 hover:text-slate-100 hover:bg-emerald-500/80 transition-all cursor-pointer"
                          >
                            <RestoreIcon />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete(item)
                              setDeleteModalOpen(true)
                            }}
                            title="Delete Permanently"
                            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/10 text-rose-400 hover:text-slate-100 hover:bg-rose-500/80 transition-all cursor-pointer"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-16 rounded-3xl bg-slate-900 border border-slate-850 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-600 border border-slate-850">
            <TrashIcon />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">Trash Bin is Empty</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Any deleted products, categories, suppliers, or customers will appear here and can be recovered within 30 days.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {deleteModalOpen && itemToDelete && (
        <ConfirmDeleteModal
          item={itemToDelete}
          onConfirm={handlePermanentDeleteConfirm}
          onCancel={() => {
            setDeleteModalOpen(false)
            setItemToDelete(null)
          }}
        />
      )}

      {emptyModalOpen && (
        <ConfirmEmptyModal
          onConfirm={handleEmptyTrashConfirm}
          onCancel={() => setEmptyModalOpen(false)}
        />
      )}

      {restoreModalOpen && itemToRestore && (
        <ConfirmRestoreModal
          item={itemToRestore}
          onConfirm={handleRestoreConfirm}
          onCancel={() => {
            setRestoreModalOpen(false)
            setItemToRestore(null)
          }}
        />
      )}

    </div>
  )
}
