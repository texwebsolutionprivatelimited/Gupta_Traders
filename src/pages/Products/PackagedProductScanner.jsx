import { useState, useEffect, useRef, useTransition } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Scan,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Volume2,
  VolumeX,
  Camera,
  Layers,
  ArrowLeft,
  X,
  Tag,
  Boxes,
  HelpCircle,
} from 'lucide-react'
import { formatINR, unitOptions, gstOptions, generateNextSKU } from '../../utils/erp'
import {
  findProductByBarcode,
  createProduct,
  listCategories,
} from '../../services/erpService'
import { lookupBarcodeExternal, normalizeBarcode } from '../../services/productLookupService'

// Web Audio tone generator for rapid mart scanning audio feedback
function playAudioFeedback(type = 'success', enabled = true) {
  if (!enabled || typeof window === 'undefined') return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()

    if (type === 'scan') {
      // Crisp high beep for scanning
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1760, ctx.currentTime) // A6
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } else if (type === 'duplicate') {
      // Double low warning buzz
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(260, ctx.currentTime)
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.28)
    } else if (type === 'success') {
      // Two-tone rising chime for successful addition
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.type = 'sine'
      osc2.type = 'sine'
      osc1.frequency.setValueAtTime(659.25, now) // E5
      osc2.frequency.setValueAtTime(1046.5, now + 0.1) // C6
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.1)
      osc2.start(now + 0.1)
      osc2.stop(now + 0.35)
    }
  } catch (err) {
    // Audio contexts may require user gesture on first call
  }
}

export default function PackagedProductScanner() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBarcodeFromUrl = searchParams.get('barcode') || ''

  // Scanner Input & State
  const [barcodeInput, setBarcodeInput] = useState(initialBarcodeFromUrl)
  const [isVerifying, setIsVerifying] = useState(false)
  const [activeStep, setActiveStep] = useState('idle') // 'idle' | 'checking_db' | 'fetching_api' | 'duplicate_found' | 'ready_form'
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Hardware Scanner integration
  const [scannerSettings, setScannerSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('barcodeScannerSettings')
      return stored ? JSON.parse(stored) : { connected: false, scannerName: 'USB Barcode Scanner' }
    } catch {
      return { connected: false, scannerName: 'USB Barcode Scanner' }
    }
  })

  // Duplicate state
  const [existingProduct, setExistingProduct] = useState(null)

  // External API result state
  const [fetchedMetadata, setFetchedMetadata] = useState(null)

  // Form State
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    nameHi: '',
    brand: '',
    packSize: '',
    category: '',
    unit: 'pcs',
    purchasePrice: '',
    sellingPrice: '',
    gstRate: 0,
    currentStock: '0',
    minStock: '10',
    hsnCode: '',
    description: '',
    imageUrl: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null)

  // Session History (items added in current session)
  const [sessionItems, setSessionItems] = useState([])

  // Camera Barcode Scanner Modal State
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Input refs for auto-focus
  const barcodeInputRef = useRef(null)
  const purchasePriceInputRef = useRef(null)

  // Load existing categories on mount
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await listCategories()
        setCategories(cats || [])
      } catch (err) {
        console.error('Error loading categories:', err)
      }
    }
    loadCats()
  }, [])

  // Auto-focus barcode input on idle
  useEffect(() => {
    if (activeStep === 'idle' && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [activeStep])

  // Handle barcode from URL if provided (e.g. redirected from POS Billing)
  useEffect(() => {
    if (initialBarcodeFromUrl) {
      handleLookup(initialBarcodeFromUrl)
    }
  }, [initialBarcodeFromUrl])

  // ── Hardware Barcode Scanner Global Keystroke Listener ──
  useEffect(() => {
    let buffer = ''
    let lastKeyTime = Date.now()
    let timeoutId = null

    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in regular text fields in the form
      const target = e.target
      const isTypingInFormField =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') &&
        target !== barcodeInputRef.current

      if (isTypingInFormField) return

      const now = Date.now()
      const isRapid = now - lastKeyTime < 60
      lastKeyTime = now

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && isRapid) {
          e.preventDefault()
          e.stopPropagation()
          const scanned = buffer.trim()
          buffer = ''
          setBarcodeInput(scanned)
          handleLookup(scanned)
        }
        buffer = ''
        return
      }

      if (e.key.length === 1) {
        if (isRapid || buffer.length === 0) {
          buffer += e.key
        } else {
          buffer = e.key
        }
      }

      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        buffer = ''
      }, 120)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      clearTimeout(timeoutId)
    }
  }, [categories])

  // ── CORE FLOW: Barcode Lookup & Verification ──
  const handleLookup = async (codeToLookup) => {
    const clean = normalizeBarcode(codeToLookup || barcodeInput)
    if (!clean) return

    setBarcodeInput(clean)
    setIsVerifying(true)
    setActiveStep('checking_db')
    setExistingProduct(null)
    setFetchedMetadata(null)
    setSaveSuccessMsg(null)
    setFormErrors({})

    playAudioFeedback('scan', soundEnabled)

    try {
      // ─────────────────────────────────────────────────────────────
      // STEP 1: Check existing database FIRST
      // ─────────────────────────────────────────────────────────────
      const existing = await findProductByBarcode(clean)

      if (existing) {
        // STEP 2 & 3: Product already exists in database!
        // DO NOT create or overwrite. Show "Product already exists"
        setExistingProduct(existing)
        setActiveStep('duplicate_found')
        playAudioFeedback('duplicate', soundEnabled)
        setIsVerifying(false)
        return
      }

      // ─────────────────────────────────────────────────────────────
      // STEP 4: Barcode does NOT exist in DB → Query external product API
      // ─────────────────────────────────────────────────────────────
      setActiveStep('fetching_api')

      const extData = await lookupBarcodeExternal(clean)
      setFetchedMetadata(extData)

      // Resolve best matching category from existing categories
      let matchedCategorySlug = ''
      if (extData.category) {
        const extCatLower = extData.category.toLowerCase()
        const matched = categories.find(
          c => c.name?.toLowerCase().includes(extCatLower) || extCatLower.includes(c.name?.toLowerCase()) || c.slug?.toLowerCase().includes(extCatLower)
        )
        matchedCategorySlug = matched ? matched.slug : extData.category
      } else if (categories.length > 0) {
        matchedCategorySlug = categories[0].slug
      }

      // Auto-populate form
      setFormData({
        name: extData.name || '',
        nameHi: '',
        brand: extData.brand || '',
        packSize: extData.packSize || '',
        category: matchedCategorySlug || 'packaged',
        unit: 'pcs',
        purchasePrice: '', // MUST be entered manually by user
        sellingPrice: '', // MUST be entered manually by user
        gstRate: 0,
        currentStock: '0',
        minStock: '10',
        hsnCode: '',
        description: extData.description || '',
        imageUrl: extData.image || '',
      })

      // If name is available, translate to Hindi in background
      if (extData.name) {
        translateToHindi(extData.name)
      }

      setActiveStep('ready_form')
      setIsVerifying(false)

      // Auto-focus on Purchase Price or Selling Price after slight delay
      setTimeout(() => {
        if (purchasePriceInputRef.current) {
          purchasePriceInputRef.current.focus()
        }
      }, 100)
    } catch (err) {
      console.error('Lookup failed:', err)
      setActiveStep('idle')
      setIsVerifying(false)
    }
  }

  // Automatic translation to Hindi
  const translateToHindi = async (text) => {
    if (!text?.trim()) return
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(
          text.trim()
        )}`
      )
      if (res.ok) {
        const data = await res.json()
        if (data?.[0]?.[0]?.[0]) {
          setFormData(prev => ({ ...prev, nameHi: data[0][0][0] }))
        }
      }
    } catch {
      // Ignore translation failures
    }
  }

  // Reset scanner to idle for next continuous scan
  const resetScanner = () => {
    setBarcodeInput('')
    setExistingProduct(null)
    setFetchedMetadata(null)
    setActiveStep('idle')
    setFormErrors({})
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  // Form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validation before adding
  const validateForm = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Product name is required'
    if (!formData.brand.trim()) errs.brand = 'Brand is required'

    // Manual price validation (MANDATORY REQUIREMENT)
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      errs.purchasePrice = 'Enter valid purchase price (₹)'
    }
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      errs.sellingPrice = 'Enter valid selling price / MRP (₹)'
    } else if (Number(formData.sellingPrice) < Number(formData.purchasePrice)) {
      errs.sellingPrice = 'Selling price should be ≥ purchase price'
    }

    if (formData.currentStock === '' || Number(formData.currentStock) < 0) {
      errs.currentStock = 'Enter valid stock count (≥ 0)'
    }

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── SAVE NEW PRODUCT INTO EXISTING DATABASE ──
  const handleAddProduct = async (e) => {
    if (e) e.preventDefault()
    if (!validateForm()) return

    setIsSaving(true)

    try {
      // Structure payload matching existing database schema
      const payload = {
        name: formData.name.trim(),
        nameHi: formData.nameHi.trim(),
        brand: formData.brand.trim(),
        packSize: formData.packSize.trim(),
        category: formData.category,
        unit: formData.unit,
        type: 'packaged',
        barcode: barcodeInput.trim(),
        sku: generateNextSKU(),
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        gstRate: Number(formData.gstRate),
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock) || 10,
        image: formData.imageUrl || '',
        description: formData.description || '',
        hsnCode: formData.hsnCode || '',
        metadata: {
          scanned_entry: true,
          added_via: 'packaged_product_scanner',
          external_source: fetchedMetadata?.source || null,
        },
      }

      const saved = await createProduct(payload)

      // Audio success feedback
      playAudioFeedback('success', soundEnabled)

      // Track session history
      setSessionItems(prev => [
        {
          id: saved.id,
          name: payload.name,
          brand: payload.brand,
          barcode: payload.barcode,
          sellingPrice: payload.sellingPrice,
          purchasePrice: payload.purchasePrice,
          stock: payload.currentStock,
          image: payload.image,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev,
      ])

      setSaveSuccessMsg({
        name: payload.name,
        barcode: payload.barcode,
        price: payload.sellingPrice,
      })

      // Reset immediately for the next product! (Rapid continuous scanning)
      resetScanner()
    } catch (err) {
      console.error('Error creating product:', err)
      setFormErrors(prev => ({ ...prev, submit: err.message }))
    } finally {
      setIsSaving(false)
    }
  }

  // Calculations for profit & margin
  const purchaseNum = Number(formData.purchasePrice) || 0
  const sellingNum = Number(formData.sellingPrice) || 0
  const profitAmt = sellingNum > 0 ? sellingNum - purchaseNum : 0
  const marginPct = sellingNum > 0 && profitAmt > 0 ? ((profitAmt / sellingNum) * 100).toFixed(1) : '0'

  // Quick preset samples for demo / testing
  const sampleBarcodes = [
    { code: '8901491101837', label: "Lay's Salted", brand: "Lay's" },
    { code: '8901719134845', label: 'Parle-G Biscuit', brand: 'Parle' },
    { code: '8901063139329', label: 'Britannia Bourbon', brand: 'Britannia' },
    { code: '05507022650', label: 'Kurkure (Existing DB Check)', brand: 'Existing in DB' },
  ]

  // ── Camera Barcode Scanner ──
  const startCameraScanner = async () => {
    setShowCameraScanner(true)
    setCameraError(null)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // If BarcodeDetector API is supported natively (Chromium/Edge/Android)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        })

        const detectLoop = async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) {
            requestAnimationFrame(detectLoop)
            return
          }
          try {
            const detected = await barcodeDetector.detect(videoRef.current)
            if (detected && detected.length > 0) {
              const code = detected[0].rawValue
              stopCameraScanner()
              setBarcodeInput(code)
              handleLookup(code)
              return
            }
          } catch (e) {
            // Frame detection error, continue loop
          }
          requestAnimationFrame(detectLoop)
        }
        requestAnimationFrame(detectLoop)
      } else {
        setCameraError('Native BarcodeDetector not active. You can enter or scan with a USB/Bluetooth scanner.')
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please allow camera permissions.')
    }
  }

  const stopCameraScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowCameraScanner(false)
  }

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Packaged Product Scanner
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Quick Entry
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Rapidly catalog new packaged items (Kurkure, biscuits, chips, beverages) with automated barcode lookup
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              soundEnabled
                ? 'bg-slate-800/80 text-emerald-400 border-slate-700/60 hover:bg-slate-700'
                : 'bg-slate-800/40 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Beep sound enabled' : 'Muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Hardware Scanner Status Indicator */}
          <Link
            to="/hardware/barcode-scanner"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-all"
            title="Configure USB / Bluetooth Scanner"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden md:inline font-mono">Scanner Active</span>
            <Barcode className="w-4 h-4 text-emerald-400" />
          </Link>

          <Link
            to="/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Products Catalog
          </Link>
        </div>
      </div>

      {/* ── SUCCESS NOTIFICATION (POST ADDITION) ── */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                "{saveSuccessMsg.name}" added to product database!
              </p>
              <p className="text-xs text-emerald-400/80 font-mono">
                Barcode: {saveSuccessMsg.barcode} • Selling Price: {formatINR(saveSuccessMsg.price)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-400/60 hover:text-emerald-300 p-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── SCANNER COMMAND BAR ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-emerald-400" />
              Scan or Enter Packaged Product Barcode
            </label>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Hardware scanner listeners active (Auto-detects Enter key)
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLookup(barcodeInput)
            }}
            className="flex flex-col sm:flex-row items-stretch gap-3"
          >
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Barcode className="w-6 h-6 text-emerald-400/80" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode with gun or type e.g. 8901491101837..."
                disabled={isVerifying}
                className="w-full pl-13 pr-10 py-4 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-base sm:text-lg font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all tracking-wider shadow-inner"
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('')
                    if (activeStep !== 'idle') resetScanner()
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isVerifying || !barcodeInput.trim()}
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Lookup</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={startCameraScanner}
                className="px-4 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 font-semibold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Use Device Camera to Scan Barcode"
              >
                <Camera className="w-5 h-5 text-cyan-400" />
                <span className="hidden md:inline">Camera</span>
              </button>
            </div>
          </form>

          {/* Sample quick test chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-slate-400">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Samples:
            </span>
            {sampleBarcodes.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setBarcodeInput(item.code)
                  handleLookup(item.code)
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700 text-slate-300 font-mono hover:text-white transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP PROGRESS INDICATOR ── */}
      {isVerifying && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 flex items-center justify-center gap-4 animate-pulse">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {activeStep === 'checking_db'
                ? 'Step 1 of 2: Checking existing database for duplicate barcode...'
                : 'Step 2 of 2: Barcode not in database. Fetching product info from barcode API...'}
            </p>
            <p className="text-xs text-slate-400">Verifying code: {barcodeInput}</p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STATE 1: DUPLICATE FOUND (PRODUCT ALREADY EXISTS IN DATABASE)
          Enforces the strict requirement:
          "If the barcode already exists: do NOT create/add the product again. Show a message: 'Product already exists.'"
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'duplicate_found' && existingProduct && (
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Duplicate Prevented
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Product already exists.
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  This barcode is already registered in your product catalog. To avoid corrupting inventory, duplicate creation is prohibited.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetScanner}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Scan className="w-4 h-4" />
                Scan Next Product
              </button>
            </div>
          </div>

          {/* Existing Product Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Product Name
              </span>
              <p className="text-base font-bold text-white">{existingProduct.name}</p>
              {existingProduct.nameHi && (
                <p className="text-xs text-slate-400">{existingProduct.nameHi}</p>
              )}
              {existingProduct.brand && (
                <span className="inline-block px-2 py-0.5 mt-1 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                  {existingProduct.brand}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Registered Barcode
                </span>
                <p className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  <Barcode className="w-4 h-4" />
                  {existingProduct.barcode}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Category
                </span>
                <p className="text-xs font-medium text-slate-300">
                  {existingProduct.categoryName || existingProduct.category || 'General'}
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Selling Price:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatINR(existingProduct.sellingPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Purchase Price:</span>
                <span className="font-semibold text-slate-300">
                  {formatINR(existingProduct.purchasePrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">Current Stock:</span>
                <span className="font-bold text-cyan-400">
                  {existingProduct.currentStock} {existingProduct.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-2.5">
              <Link
                to={`/products?search=${existingProduct.barcode}`}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View in Products Catalog
              </Link>
              <Link
                to="/pos"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Open in POS Billing
              </Link>
            </div>

            <button
              type="button"
              onClick={resetScanner}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Scan another barcode (or press Space)
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STATE 2: NEW PRODUCT CONFIRMATION & EDIT FORM
          Auto-fills external API details + requires manual price
          ───────────────────────────────────────────────────────────── */}
      {activeStep === 'ready_form' && (
        <form
          onSubmit={handleAddProduct}
          className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7 animate-scaleIn"
        >
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ Verified New Barcode
                  </span>
                  {fetchedMetadata?.found && (
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-filled from Barcode API
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Confirm & Set Product Price
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Review the auto-filled details. Enter your purchase price & selling price, then click Add Product.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetScanner}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                Cancel / Scan Next
              </button>
            </div>
          </div>

          {formErrors.submit && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-sm font-medium">
              {formErrors.submit}
            </div>
          )}

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {/* Left Column: Image & Scanned Barcode Verification */}
            <div className="space-y-5">
              {/* Product Image Preview */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[220px]">
                {formData.imageUrl ? (
                  <div className="space-y-3 w-full">
                    <img
                      src={formData.imageUrl}
                      alt={formData.name || 'Product'}
                      className="w-36 h-36 object-contain mx-auto rounded-xl bg-white/5 p-2 border border-slate-800"
                      onError={() => handleInputChange('imageUrl', '')}
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleInputChange('imageUrl', '')}
                        className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-500">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <Package className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-medium">No photo available</p>
                  </div>
                )}
              </div>

              {/* Verified Barcode Info Card */}
              <div className="bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Scanned Barcode</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Unique in DB</span>
                </span>
                <p className="text-lg font-mono font-bold text-emerald-400 tracking-wider flex items-center gap-2">
                  <Barcode className="w-5 h-5" />
                  {barcodeInput}
                </p>
                <p className="text-[11px] text-slate-500">
                  This barcode will be permanently bound to this new product for POS rapid scanning.
                </p>
              </div>
            </div>

            {/* Middle & Right Column: Details & Mandatory Prices */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Product Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onBlur={() => translateToHindi(formData.name)}
                    placeholder="e.g. Kurkure Masala Munch, Parle-G Biscuits..."
                    className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all ${
                      formErrors.name ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-rose-400 font-medium">{formErrors.name}</p>
                  )}
                </div>

                {/* Hindi Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hindi Name (हिंदी नाम)
                  </label>
                  <input
                    type="text"
                    value={formData.nameHi}
                    onChange={(e) => handleInputChange('nameHi', e.target.value)}
                    placeholder="e.g. कुरकुरे मसाला मंच..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Brand <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="e.g. Kurkure, Parle, Britannia, Lay's..."
                    className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all ${
                      formErrors.brand ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {formErrors.brand && (
                    <p className="text-xs text-rose-400 font-medium">{formErrors.brand}</p>
                  )}
                </div>

                {/* Pack Size */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Pack Size / Weight
                  </label>
                  <input
                    type="text"
                    value={formData.packSize}
                    onChange={(e) => handleInputChange('packSize', e.target.value)}
                    placeholder="e.g. 50g, 100g, 250ml, 1 Pack..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="packaged">Packaged Goods (General)</option>
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug || c.name}>
                        {c.name}
                      </option>
                    ))}
                    {formData.category &&
                      !categories.some(c => (c.slug || c.name) === formData.category) && (
                        <option value={formData.category}>
                          {formData.category} (From API)
                        </option>
                      )}
                  </select>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────
                  PRICE SECTION — MANDATORY REQUIREMENT:
                  "Price/amount must always be entered manually by me."
                  ───────────────────────────────────────────────────────── */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/30 border-2 border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    Pricing Details (Manual Entry Required)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Always set manually
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Purchase Price */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Purchase Price (₹) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        ref={purchasePriceInputRef}
                        type="number"
                        step="0.01"
                        value={formData.purchasePrice}
                        onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-8 pr-4 py-3 rounded-xl bg-slate-900 border text-white text-base font-bold focus:outline-none focus:border-emerald-500 transition-all ${
                          formErrors.purchasePrice ? 'border-rose-500' : 'border-slate-700'
                        }`}
                      />
                    </div>
                    {formErrors.purchasePrice && (
                      <p className="text-xs text-rose-400 font-medium">
                        {formErrors.purchasePrice}
                      </p>
                    )}
                  </div>

                  {/* Selling Price / MRP */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Selling Price / MRP (₹) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-8 pr-4 py-3 rounded-xl bg-slate-900 border text-emerald-400 text-base font-bold focus:outline-none focus:border-emerald-500 transition-all ${
                          formErrors.sellingPrice ? 'border-rose-500' : 'border-slate-700'
                        }`}
                      />
                    </div>
                    {formErrors.sellingPrice && (
                      <p className="text-xs text-rose-400 font-medium">
                        {formErrors.sellingPrice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Profit & Margin Calculator Pill */}
                {sellingNum > 0 && (
                  <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Profit Per Unit:</span>
                      <span
                        className={`font-bold ${
                          profitAmt >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatINR(profitAmt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Margin:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          Number(marginPct) >= 15
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {marginPct}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock & Tax Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Initial Opening Stock */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Opening Stock ({formData.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => handleInputChange('currentStock', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Minimum Stock Alert Level */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange('minStock', e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* GST Rate */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    GST Rate (%)
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => handleInputChange('gstRate', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {gstOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button Action Row */}
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Saving into Database...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                      <span>Add Product (Enter)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetScanner}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all cursor-pointer"
                >
                  Discard & Reset
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── SESSION PROGRESS / RECENTLY ADDED TRAY ── */}
      {sessionItems.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" />
              Cataloged in This Session ({sessionItems.length})
            </h3>
            <span className="text-xs text-slate-400">
              Rapid entry log • Synced with database
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Barcode</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Initial Stock</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sessionItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{item.time}</td>
                    <td className="py-2.5 px-3 text-white font-semibold flex items-center gap-2">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-6 h-6 object-contain rounded bg-white/5 border border-slate-700/50"
                        />
                      )}
                      <span>{item.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{item.brand}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">{item.barcode}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {formatINR(item.sellingPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{item.stock} pcs</td>
                    <td className="py-2.5 px-3 text-center">
                      <Link
                        to={`/products?search=${item.barcode}`}
                        className="text-cyan-400 hover:text-cyan-300 underline text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CAMERA BARCODE SCANNER MODAL ── */}
      {showCameraScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                Camera Barcode Scanner
              </h3>
              <button
                type="button"
                onClick={stopCameraScanner}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs space-y-2">
                <p className="font-semibold">{cameraError}</p>
                <p className="text-slate-400">
                  Tip: A standard USB / Bluetooth barcode gun can be used directly without camera.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Scanner reticle overlay */}
                  <div className="absolute inset-0 border-2 border-emerald-400/50 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-24 border-2 border-emerald-400 rounded-lg shadow-lg shadow-emerald-500/20 animate-pulse" />
                  </div>
                </div>
                <p className="text-xs text-center text-slate-400">
                  Align product barcode inside the green target box to scan automatically.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={stopCameraScanner}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
