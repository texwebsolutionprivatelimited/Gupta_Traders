import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  iconPresets, colorPresets,
} from '../../utils/erp'
import { createCategory, listCategories, listUIProducts, removeCategory, subscribeToTable, updateCategory } from '../../services/erpService'
import ProductDetailModal from '../Products/ProductDetailModal'

export function isProductInCategory(product, cat) {
  if (!cat) return false
  if (cat.id === 'all' || cat.slug === 'all') return true

  const pCatId = String(product.categoryId || product.category_id || '').toLowerCase().trim()
  const pCatSlug = String(product.category || '').toLowerCase().trim()
  const pCatName = String(product.categoryName || product.category_name || '').toLowerCase().trim()

  const targetUuid = String(cat.uuid || cat.categoryId || cat.id || '').toLowerCase().trim()
  const targetSlug = String(cat.slug || cat.id || '').toLowerCase().trim()
  const targetName = String(cat.name || '').toLowerCase().trim()

  const metaCatId = String(product.metadata?.category_id || '').toLowerCase().trim()
  const metaCat = String(product.metadata?.category || '').toLowerCase().trim()

  return (
    (targetUuid && (pCatId === targetUuid || metaCatId === targetUuid)) ||
    (targetSlug && (pCatSlug === targetSlug || pCatId === targetSlug || metaCat === targetSlug)) ||
    (targetName && (pCatName === targetName || pCatSlug === targetName || metaCat === targetName)) ||
    (targetSlug && pCatName === targetSlug) ||
    (targetName && pCatSlug === targetName)
  )
}

// ─── SVG Icons ──────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  )
}

function ImageUploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function TrashMiniIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}


// ─── TOAST ──────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bg = type === 'success'
    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
    : type === 'error'
      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slideIn ${bg}`}>
      {type === 'success' && <CheckIcon />}
      {type === 'error' && <CloseIcon />}
      {type === 'warning' && <WarningIcon />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
        <CloseIcon />
      </button>
    </div>
  )
}


// ─── DELETE CONFIRMATION MODAL ──────────────────────────────────

function DeleteConfirmModal({ category, productCount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        {/* Warning icon */}
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <WarningIcon />
        </div>

        <h3 className="text-xl font-bold text-slate-100 text-center mb-2">
          Delete Category?
        </h3>
        <p className="text-slate-400 text-center mb-1 text-sm">
          Are you sure you want to delete this category?
        </p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{category.icon}</span>
          <span className="text-slate-200 font-semibold text-lg">{category.name}</span>
        </div>
        {productCount > 0 && (
          <p className="text-amber-400/80 text-center text-xs mb-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            ⚠️ This category has <strong>{productCount}</strong> product{productCount !== 1 ? 's' : ''}. Products won't be deleted, but they will become uncategorized.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 font-medium hover:bg-slate-700 transition-all text-sm cursor-pointer"
          >
            No, Keep It
          </button>
          <button
            onClick={() => onConfirm(category.id)}
            className="flex-1 px-5 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/25 transition-all text-sm cursor-pointer"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── ADD / EDIT MODAL ───────────────────────────────────────────

function CategoryFormModal({ category, onSave, onCancel }) {
  const isEditing = !!category
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [icon, setIcon] = useState(category?.icon || '📦')
  const [color, setColor] = useState(category?.color || colorPresets[0])
  const [status, setStatus] = useState(category?.status || 'active')
  const [image, setImage] = useState(category?.image || '')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  // ─── Image handling ───────────────────────────────────────
  function processFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, etc.)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    processFile(file)
  }

  function removeImage() {
    setImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    try { const result=isEditing ? await updateCategory(category.uuid||category.id,{name:name.trim(),description:description.trim(),icon,color,status,image}) : await createCategory({name:name.trim(),description:description.trim(),icon,color,status,image}); onSave(result,isEditing?'updated':'added') } catch(error){setError(error.message)}
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-0 max-w-lg w-full mx-4 shadow-2xl animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header with preview */}
        <div className="px-8 pt-8 pb-5 border-b border-slate-700/40">
          <div className="flex items-center gap-4">
            {/* Live icon preview */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all duration-300"
              style={{ backgroundColor: color + '20', border: `1px solid ${color}40` }}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {isEditing ? 'Update category details' : 'Add a new product category'}
              </p>
            </div>
            <button onClick={onCancel} className="ml-auto text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <WarningIcon />
              {error}
            </div>
          )}

          {/* Category Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-300">
              Category Name <span className="text-rose-400 ml-0.5">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="e.g. Grocery, Snacks, Beverages..."
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of what this category includes..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>

          {/* Cover Image — Drag & Drop / Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-300">
              Cover Image
            </label>
            <p className="text-xs text-slate-500">Upload an image that covers the category card. Max 2 MB.</p>

            {image ? (
              /* ── Preview ── */
              <div className="relative rounded-xl overflow-hidden border border-slate-700/60 group/img">
                <img
                  src={image}
                  alt="Category cover preview"
                  className="w-full h-40 object-cover"
                />
                {/* Overlay with name preview */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-white font-bold text-sm drop-shadow-lg">{name || 'Category Name'}</span>
                  </div>
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-rose-400 hover:bg-black/80 transition-all opacity-0 group-hover/img:opacity-100 cursor-pointer"
                >
                  <TrashMiniIcon />
                </button>
              </div>
            ) : (
              /* ── Drop zone ── */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200
                  ${isDragging
                    ? 'border-emerald-500/60 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/60'}
                `}
              >
                <div className={`transition-colors ${isDragging ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <ImageUploadIcon />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${isDragging ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {isDragging ? 'Drop image here' : 'Drag & drop an image'}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    or <span className="text-emerald-400/80 underline underline-offset-2">click to browse</span>
                  </p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-300">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-1.5">
              {iconPresets.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`
                    w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer
                    ${icon === emoji
                      ? 'bg-emerald-500/20 border-2 border-emerald-500/50 scale-110'
                      : 'bg-slate-800/60 border border-slate-700/40 hover:bg-slate-700/60 hover:scale-105'}
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-300">
              Color
            </label>
            <div className="grid grid-cols-10 gap-1.5">
              {colorPresets.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`
                    w-9 h-9 rounded-lg transition-all cursor-pointer
                    ${color === c
                      ? 'ring-2 ring-white/60 scale-110'
                      : 'hover:scale-110'}
                  `}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-300">
              Status
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`
                  flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                  ${status === 'active'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-300'}
                `}
              >
                ● Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`
                  flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                  ${status === 'inactive'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                    : 'bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-300'}
                `}
              >
                ○ Inactive
              </button>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-8 py-5 border-t border-slate-700/40 flex gap-3 bg-slate-900/80">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 font-medium hover:bg-slate-700 transition-all text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-5 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/25 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {isEditing ? (
              <><EditIcon /> Update Category</>
            ) : (
              <><PlusIcon /> Create Category</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── STAT CARD ──────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl px-3 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3 sm:gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
        style={{ backgroundColor: color + '20', color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  )
}


// ─── CENTERED CATEGORY PRODUCTS PANEL / MODAL ──────────────────

function CategoryProductsModal({ category, products, isOpen, onClose, onSelectProduct, isChildModalOpen }) {
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [sortBy, setSortBy] = useState('name_asc') // 'name_asc' | 'price_asc' | 'price_desc' | 'stock_desc'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  useEffect(() => {
    setSearch('')
    setStockFilter('all')
    setSortBy('name_asc')
  }, [category])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      // When product detail modal is open on top, don't close this panel on Escape
      if (e.key === 'Escape' && !isChildModalOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isChildModalOpen, onClose])

  if (!isOpen || !category) return null

  const categoryProducts = products.filter(p => isProductInCategory(p, category))

  // Calculate stock counts for filter pills
  const inStockCount = categoryProducts.filter(p => {
    const stock = Number(p.currentStock ?? p.stock ?? 0)
    const minStock = Number(p.minStock || 5)
    return stock > minStock
  }).length

  const lowStockCount = categoryProducts.filter(p => {
    const stock = Number(p.currentStock ?? p.stock ?? 0)
    const minStock = Number(p.minStock || 5)
    return stock > 0 && stock <= minStock
  }).length

  const outOfStockCount = categoryProducts.filter(p => {
    const stock = Number(p.currentStock ?? p.stock ?? 0)
    return stock <= 0
  }).length

  // Filter products
  const filtered = categoryProducts.filter(p => {
    const q = search.toLowerCase().trim()
    const matchesSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.nameHi?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)

    const stock = Number(p.currentStock ?? p.stock ?? 0)
    const minStock = Number(p.minStock || 5)
    let matchesStock = true
    if (stockFilter === 'in_stock') matchesStock = stock > minStock
    else if (stockFilter === 'low_stock') matchesStock = stock > 0 && stock <= minStock
    else if (stockFilter === 'out_of_stock') matchesStock = stock <= 0

    return matchesSearch && matchesStock
  })

  // Sort products
  const sortedProducts = [...filtered].sort((a, b) => {
    if (sortBy === 'name_asc') {
      return (a.name || '').localeCompare(b.name || '')
    }
    if (sortBy === 'price_asc') {
      const priceA = Number(a.rate ?? a.price ?? a.sellingPrice ?? 0)
      const priceB = Number(b.rate ?? b.price ?? b.sellingPrice ?? 0)
      return priceA - priceB
    }
    if (sortBy === 'price_desc') {
      const priceA = Number(a.rate ?? a.price ?? a.sellingPrice ?? 0)
      const priceB = Number(b.rate ?? b.price ?? b.sellingPrice ?? 0)
      return priceB - priceA
    }
    if (sortBy === 'stock_desc') {
      const stockA = Number(a.currentStock ?? a.stock ?? 0)
      const stockB = Number(b.currentStock ?? b.stock ?? 0)
      return stockB - stockA
    }
    return 0
  })

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[88vh] max-h-[850px] flex flex-col shadow-2xl shadow-black/90 overflow-hidden animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-700/80 shrink-0 shadow-md"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner"
                style={{
                  backgroundColor: (category.color || '#10b981') + '25',
                  border: '1px solid ' + (category.color || '#10b981') + '45',
                }}
              >
                {category.icon || '🏷️'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category Products
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  category.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                }`}>
                  {category.status}
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {categoryProducts.length} Product{categoryProducts.length !== 1 ? 's' : ''} Total
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 truncate leading-snug">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all cursor-pointer shrink-0"
            title="Close Panel (Esc)"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Toolbar: Search, Stock Pills, Sorting & View Toggle */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${category.name} products by name, brand, barcode, SKU...`}
                className="w-full pl-11 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-800/90 border border-slate-700/70 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/90 border border-slate-700/70 text-slate-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer"
                title="Sort Products"
              >
                <option value="name_asc">Name: A to Z</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_desc">Stock: High to Low</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-800/90 border border-slate-700/70 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Grid View"
                >
                  <GridIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="List View"
                >
                  <ListIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Stock Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: `All (${categoryProducts.length})` },
              { id: 'in_stock', label: `In Stock (${inStockCount})` },
              { id: 'low_stock', label: `Low Stock (${lowStockCount})` },
              { id: 'out_of_stock', label: `Out of Stock (${outOfStockCount})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStockFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  stockFilter === f.id
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
          {categoryProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-center text-3xl mb-4">
                📦
              </div>
              <h4 className="text-base font-bold text-slate-200">No products found in this category</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Products assigned to "{category.name}" in Products or Inventory will show up here automatically from your live database.
              </p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-slate-300 text-sm font-semibold">No products match your current search or filter</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search keyword or switching stock filter tabs.</p>
              <button
                onClick={() => { setSearch(''); setStockFilter('all'); }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ─── Grid View ─── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {sortedProducts.map(product => {
                const stock = Number(product.currentStock ?? product.stock ?? 0)
                const minStock = Number(product.minStock || 5)
                const isOut = stock <= 0
                const isLow = !isOut && stock <= minStock
                const unit = product.unit || (product.type === 'loose' ? (product.looseUnit || 'kg') : 'pcs')
                const brand = product.brand?.trim() || 'Generic'
                const sellingPrice = Number(product.rate ?? product.price ?? product.sellingPrice ?? 0)
                const mrp = Number(product.mrp ?? sellingPrice)
                const savings = mrp > sellingPrice ? mrp - sellingPrice : 0

                return (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="group p-4 rounded-2xl bg-slate-850/90 border border-slate-700/60 hover:border-emerald-500/60 hover:bg-slate-800 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5"
                    title="Click to view complete ERP product details"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30 truncate max-w-[130px]">
                          {brand}
                        </span>
                        {product.barcode ? (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 truncate max-w-[120px]">
                            #{product.barcode}
                          </span>
                        ) : product.sku ? (
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">
                            {product.sku}
                          </span>
                        ) : null}
                      </div>

                      {/* Product Name */}
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      {product.nameHi && (
                        <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">{product.nameHi}</p>
                      )}

                      {/* Stock Status Badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isOut
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : isLow
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? `⚠ ${stock} ${unit} left` : `Stock: ${stock} ${unit}`}
                        </span>
                        {product.packSize && (
                          <span className="text-[11px] text-slate-400 font-medium bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40">
                            {product.packSize}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Commercial Pricing Block & View CTA */}
                    <div className="pt-3 mt-3 border-t border-slate-700/50 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Rate (Our Price):</span>
                        <div className="text-lg font-black text-emerald-400 tabular-nums">
                          ₹{sellingPrice.toFixed(2)}
                          <span className="text-xs font-normal text-slate-400 ml-0.5">/{unit}</span>
                        </div>
                        {mrp > sellingPrice && (
                          <div className="text-[11px] text-slate-400 line-through tabular-nums">
                            MRP: ₹{mrp.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 group-hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 transition-all">
                        <span>Details</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ─── List View ─── */
            <div className="bg-slate-850/80 border border-slate-700/60 rounded-2xl overflow-hidden divide-y divide-slate-700/40">
              {sortedProducts.map((product, idx) => {
                const stock = Number(product.currentStock ?? product.stock ?? 0)
                const minStock = Number(product.minStock || 5)
                const isOut = stock <= 0
                const isLow = !isOut && stock <= minStock
                const unit = product.unit || (product.type === 'loose' ? (product.looseUnit || 'kg') : 'pcs')
                const brand = product.brand?.trim() || 'Generic'
                const sellingPrice = Number(product.rate ?? product.price ?? product.sellingPrice ?? 0)
                const mrp = Number(product.mrp ?? sellingPrice)

                return (
                  <div
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="p-3.5 sm:p-4 hover:bg-slate-800/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    title="Click to view complete ERP product details"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 text-xs text-slate-600 font-mono text-center shrink-0 hidden sm:block">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 truncate max-w-[120px]">
                            {brand}
                          </span>
                          {product.barcode && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              #{product.barcode}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                          {product.name}
                        </h4>
                        {product.nameHi && (
                          <p className="text-xs text-slate-400 truncate">{product.nameHi}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isOut
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : isLow
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isOut ? 'Out of Stock' : `${stock} ${unit}`}
                        </span>
                        {product.packSize && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">{product.packSize}</span>
                        )}
                      </div>

                      <div className="text-right min-w-[90px]">
                        <div className="text-sm sm:text-base font-black text-emerald-400 tabular-nums">
                          ₹{sellingPrice.toFixed(2)}
                        </div>
                        {mrp > sellingPrice && (
                          <div className="text-[10px] text-slate-400 line-through tabular-nums">
                            MRP ₹{mrp.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-300 border border-slate-700 group-hover:border-emerald-500/40 text-xs font-semibold transition-all shrink-0 cursor-pointer"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-slate-400 text-center sm:text-left">
            Showing <strong className="text-slate-200">{sortedProducts.length}</strong> of{' '}
            <strong className="text-slate-200">{categoryProducts.length}</strong> products in{' '}
            <span className="text-emerald-400 font-semibold">{category.name}</span> • Click any product to inspect details
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-all cursor-pointer border border-slate-700"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── CATEGORY CARD (Grid view) ──────────────────────────────────

function CategoryCard({ category, productCount, onSelectCategory, onEdit, onDelete }) {
  const hasImage = !!category.image

  return (
    <div
      onClick={() => onSelectCategory(category)}
      className="group relative rounded-2xl overflow-hidden border border-slate-700/40 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 hover:-translate-y-1 cursor-pointer flex flex-col justify-between bg-slate-900/60"
      title={`Click to view all products in ${category.name}`}
    >
      {/* ── Cover image or fallback colour block ── */}
      {hasImage ? (
        <div className="relative h-44 overflow-hidden">
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Action buttons — top right */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(category); }}
              className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-emerald-400 transition-all cursor-pointer"
              title="Edit Category"
            >
              <EditIcon />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(category); }}
              className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-rose-400 transition-all cursor-pointer"
              title="Delete Category"
            >
              <DeleteIcon />
            </button>
          </div>

          {/* Status badge — top left */}
          <span className={`
            absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md
            ${category.status === 'active'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/20'
              : 'bg-amber-500/25 text-amber-300 border border-amber-400/20'}
          `}>
            {category.status}
          </span>

          {/* Text overlay — bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xl drop-shadow-lg">{category.icon}</span>
              <h3 className="text-base font-bold text-white drop-shadow-lg">{category.name}</h3>
            </div>
            {category.description && (
              <p className="text-[11px] text-white/70 line-clamp-1 drop-shadow">{category.description}</p>
            )}
          </div>
        </div>
      ) : (
        /* ── No-image fallback (coloured header) ── */
        <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${category.color}30, ${category.color}10)` }}>
          {/* Large faded icon background */}
          <span className="absolute -right-2 -bottom-2 text-6xl opacity-15 select-none">{category.icon}</span>

          {/* Action buttons */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(category); }}
              className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
              title="Edit Category"
            >
              <EditIcon />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(category); }}
              className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
              title="Delete Category"
            >
              <DeleteIcon />
            </button>
          </div>

          {/* Status badge */}
          <span className={`
            absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
            ${category.status === 'active'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'}
          `}>
            {category.status}
          </span>

          {/* Icon + Name over colour block */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xl">{category.icon}</span>
              <h3 className="text-base font-bold text-slate-100">{category.name}</h3>
            </div>
            {category.description && (
              <p className="text-[11px] text-slate-400 line-clamp-1">{category.description}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom bar — product count & click CTA ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5 text-slate-400">
          <PackageIcon />
          <span className="text-xs font-semibold">{productCount} product{productCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
            View Products →
          </span>
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
        </div>
      </div>
    </div>
  )
}

// ─── CATEGORY ROW (List view) ───────────────────────────────────

function CategoryRow({ category, productCount, index, onSelectCategory, onEdit, onDelete }) {
  return (
    <div
      onClick={() => onSelectCategory(category)}
      className={`
        group flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 transition-all duration-200 hover:bg-slate-800/50 cursor-pointer
        ${index > 0 ? 'border-t border-slate-700/30' : ''}
      `}
      title={`Click to view all products in ${category.name}`}
    >
      {/* Index */}
      <span className="w-6 text-xs text-slate-600 font-mono text-center shrink-0 hidden sm:block">{index + 1}</span>

      {/* Icon / Thumbnail */}
      {category.image ? (
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-700/40">
          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: category.color + '20', border: '1px solid ' + category.color + '30' }}
        >
          {category.icon}
        </div>
      )}

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">{category.name}</h4>
        {category.description && (
          <p className="text-xs text-slate-500 truncate">{category.description}</p>
        )}
      </div>

      {/* Product Count & CTA */}
      <div className="flex items-center gap-2 text-slate-400 shrink-0">
        <PackageIcon />
        <span className="text-xs font-semibold">{productCount}</span>
        <span className="hidden sm:inline text-[11px] font-bold text-emerald-400 group-hover:underline ml-1">
          View Products →
        </span>
      </div>

      {/* Status */}
      <span className={`
        text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0
        ${category.status === 'active'
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-amber-500/15 text-amber-400'}
      `}>
        {category.status}
      </span>

      {/* Color dot */}
      <div className="w-3 h-3 rounded-full shrink-0 hidden sm:block" style={{ backgroundColor: category.color }} />

      {/* Actions */}
      <div className="flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(category); }}
          className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
          title="Edit Category"
        >
          <EditIcon />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(category); }}
          className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
          title="Delete Category"
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  )
}
function EmptyState({ isSearch, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-4xl mb-6">
        {isSearch ? '🔍' : '🏷️'}
      </div>
      <h3 className="text-lg font-bold text-slate-200 mb-2">
        {isSearch ? 'No categories found' : 'No categories yet'}
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-md mb-6">
        {isSearch
          ? 'Try adjusting your search query to find what you\'re looking for.'
          : 'Start organizing your products by creating your first category. Categories help you group and manage products efficiently.'}
      </p>
      {!isSearch && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/25 transition-all cursor-pointer"
        >
          <PlusIcon />
          Create First Category
        </button>
      )}
    </div>
  )
}
// ─── MAIN PAGE COMPONENT ──────────────────────────────────────
export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') || ''

  const [categories, setCategories] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [search, setSearch] = useState(urlSearch)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'

  // Sync state if URL params change
  useEffect(() => {
    setSearch(urlSearch)
  }, [urlSearch])

  const handleSearchChange = (val) => {
    setSearch(val)
    if (val) {
      setSearchParams({ search: val })
    } else {
      setSearchParams({})
    }
  }

  // Modals & Selection State
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState(null)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null)

  // Load data
  async function loadData() {
    try {
      const [cats, prods] = await Promise.all([
        listCategories(),
        listUIProducts({ status: null })
      ])
      const mappedCats = cats.map(c => ({
        ...c,
        uuid: c.id,
        id: c.slug || c.id,
        slug: c.slug || c.id,
        image: c.image_url,
        sortOrder: c.sort_order,
      }))
      setCategories(mappedCats)
      setProducts(prods)
      const counts = {}
      mappedCats.forEach(cat => {
        counts[cat.id] = prods.filter(p => isProductInCategory(p, cat)).length
      })
      setProductCounts(counts)
    } catch (error) {
      setToast({ message: error.message, type: 'error' })
    }
  }

  useEffect(() => {
    let refreshTimer = null
    const debouncedLoad = () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        loadData()
      }, 500)
    }

    loadData()
    const offCategories = subscribeToTable('categories', debouncedLoad)
    const offProducts = subscribeToTable('products', debouncedLoad)
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer)
      offCategories();
      offProducts();
    }
  }, [])

  // Filter categories
  const filtered = categories.filter(cat => {
    const matchSearch = !search ||
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || cat.status === statusFilter
    return matchSearch && matchStatus
  })

  // Stats
  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0)
  const activeCount = categories.filter(c => c.status === 'active').length
  const inactiveCount = categories.filter(c => c.status === 'inactive').length

  // Handlers
  function handleAdd() {
    setEditingCategory(null)
    setShowFormModal(true)
  }

  function handleEdit(cat) {
    setEditingCategory(cat)
    setShowFormModal(true)
  }

  function handleDelete(cat) {
    setDeleteTarget(cat)
  }

  async function confirmDelete(id) {
    const category=categories.find(c=>c.id===id||c.uuid===id)
    try{await removeCategory(category?.uuid||id);setDeleteTarget(null);await loadData();setToast({ message: 'Category deleted successfully', type: 'success' })}catch(error){setToast({message:error.message,type:'error'})}
  }

  function handleSave(data, action) {
    setShowFormModal(false)
    setEditingCategory(null)
    loadData()
    setToast({
      message: action === 'updated' ? 'Category updated successfully' : 'Category created successfully',
      type: 'success',
    })
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          category={deleteTarget}
          productCount={productCounts[deleteTarget.id] || 0}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Add / Edit Modal */}
      {showFormModal && (
        <CategoryFormModal
          category={editingCategory}
          onSave={handleSave}
          onCancel={() => { setShowFormModal(false); setEditingCategory(null) }}
        />
      )}

      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <TagIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Categories</h1>
            <p className="text-sm text-slate-500">Organize your products into groups</p>
          </div>
        </div>

        <button
          id="add-category-btn"
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/25 transition-all cursor-pointer"
        >
          <PlusIcon />
          Add Category
        </button>
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<TagIcon />} label="Total Categories" value={categories.length} color="#8b5cf6" />
        <StatCard icon="✅" label="Active" value={activeCount} color="#10b981" />
        <StatCard icon="⏸️" label="Inactive" value={inactiveCount} color="#f59e0b" />
        <StatCard icon={<PackageIcon />} label="Total Products" value={totalProducts} color="#3b82f6" />
      </div>

      {/* ─── Toolbar: Search + Filters + View Toggle ─────────────── */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl px-5 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon />
            </div>
            <input
              id="search-categories"
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {['all', 'active', 'inactive'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`
                  px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer
                  ${statusFilter === s
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-300'}
                `}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-7 bg-slate-700/40" />

          {/* View toggle */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer
                ${viewMode === 'grid'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800/60 border border-slate-700/40 text-slate-500 hover:text-slate-300'}
              `}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer
                ${viewMode === 'list'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800/60 border border-slate-700/40 text-slate-500 hover:text-slate-300'}
              `}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Categories Grid / List ──────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState isSearch={!!search || statusFilter !== 'all'} onAdd={handleAdd} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              productCount={productCounts[cat.id] || 0}
              onSelectCategory={(category) => setSelectedCategoryForProducts(category)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden">
          {filtered.map((cat, idx) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              productCount={productCounts[cat.id] || 0}
              index={idx}
              onSelectCategory={(category) => setSelectedCategoryForProducts(category)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ─── Quick-Add Guide ─────────────────────────────────────── */}
      <div className="bg-slate-900/40 border border-slate-700/30 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Quick Guide — How to Create a Category
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">1</span>
            <div>
              <p className="text-xs font-semibold text-slate-300">Click "Add Category"</p>
              <p className="text-xs text-slate-500">Use the button at the top right corner</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">2</span>
            <div>
              <p className="text-xs font-semibold text-slate-300">Fill in the details</p>
              <p className="text-xs text-slate-500">Name, icon, color & description</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">3</span>
            <div>
              <p className="text-xs font-semibold text-slate-300">Save & Assign</p>
              <p className="text-xs text-slate-500">Then assign products to this category</p>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Category Products Panel */}
      <CategoryProductsModal
        category={selectedCategoryForProducts}
        products={products}
        isOpen={Boolean(selectedCategoryForProducts)}
        onClose={() => setSelectedCategoryForProducts(null)}
        onSelectProduct={(prod) => setSelectedProductForDetail(prod)}
        isChildModalOpen={Boolean(selectedProductForDetail)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
      />
    </div>
  )
}
