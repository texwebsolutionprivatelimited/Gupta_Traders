import { useState, useEffect, useRef } from 'react'
import {
  getCategoriesV2, addCategory, updateCategory, deleteCategory,
  getProductCountByCategory, iconPresets, colorPresets,
} from '../../hooks/categoryData'

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

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    const result = isEditing
      ? updateCategory(category.id, { name: name.trim(), description: description.trim(), icon, color, status, image })
      : addCategory({ name: name.trim(), description: description.trim(), icon, color, status, image })

    if (result.error) {
      setError(result.error)
      return
    }

    onSave(result.data, isEditing ? 'updated' : 'added')
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
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <WarningIcon />
              {error}
            </div>
          )}

          {/* Category Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Category Name <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="e.g. Grocery, Snacks, Beverages..."
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of what this category includes..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>

          {/* Cover Image — Drag & Drop / Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Cover Image
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">Upload an image that covers the category card. Max 2 MB.</p>

            {image ? (
              /* ── Preview ── */
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group/img">
                <img
                  src={image}
                  alt="Category cover preview"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-white font-bold text-sm drop-shadow-md">{name || 'Category Name'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-slate-950/70 backdrop-blur-sm border border-slate-700 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-slate-900 transition-all opacity-0 group-hover/img:opacity-100 cursor-pointer"
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
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/80'}
        `}
              >
                <div className={`transition-colors ${isDragging ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  <ImageUploadIcon />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-medium ${isDragging ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isDragging ? 'Drop image here' : 'Drag & drop an image'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    or <span className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2">click to browse</span>
                  </p>
                </div>
              </div>
            )}

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
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
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
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 scale-110'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'}
          `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
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
                      ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110'
                      : 'hover:scale-110'}
          `}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Status
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`
          flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
          ${status === 'active'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}
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
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}
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
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl px-5 py-4 flex items-center gap-4">
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


// ─── CATEGORY CARD (Grid view) ──────────────────────────────────

function CategoryCard({ category, productCount, onEdit, onDelete }) {
  const hasImage = !!category.image

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-slate-700/40 hover:border-slate-600/60 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1">

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
          <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(category)}
              className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-emerald-400 transition-all cursor-pointer"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-rose-400 transition-all cursor-pointer"
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
          <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(category)}
              className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
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

      {/* ── Bottom bar — product count ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80">
        <div className="flex items-center gap-1.5 text-slate-400">
          <PackageIcon />
          <span className="text-xs font-medium">{productCount} product{productCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
      </div>
    </div>
  )
}


// ─── CATEGORY ROW (List view) ───────────────────────────────────

function CategoryRow({ category, productCount, index, onEdit, onDelete }) {
  return (
    <div
      className={`
        group flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-slate-800/40
        ${index > 0 ? 'border-t border-slate-700/30' : ''}
      `}
    >
      {/* Index */}
      <span className="w-6 text-xs text-slate-600 font-mono text-center shrink-0">{index + 1}</span>

      {/* Icon / Thumbnail */}
      {category.image ? (
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-700/40">
          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: category.color + '20', border: `1px solid ${category.color}30` }}
        >
          {category.icon}
        </div>
      )}

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-100">{category.name}</h4>
        {category.description && (
          <p className="text-xs text-slate-500 truncate">{category.description}</p>
        )}
      </div>

      {/* Product Count */}
      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
        <PackageIcon />
        <span className="text-xs font-medium">{productCount}</span>
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
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />

      {/* Actions */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(category)}
          className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  )
}


// ─── EMPTY STATE ────────────────────────────────────────────────

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


// ═══════════════════════════════════════════════════════════════
// ─── MAIN PAGE COMPONENT ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive'

  // Modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  // Load data
  function loadData() {
    const cats = getCategoriesV2()
    setCategories(cats.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)))
    setProductCounts(getProductCountByCategory())
  }

  useEffect(() => {
    loadData()
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

  function confirmDelete(id) {
    deleteCategory(id)
    setDeleteTarget(null)
    loadData()
    setToast({ message: 'Category deleted successfully', type: 'success' })
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
              onChange={e => setSearch(e.target.value)}
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
    </div>
  )
}
