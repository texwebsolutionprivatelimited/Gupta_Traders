import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { listUIProducts, subscribeToTable, isProductMissingMrp } from '../services/erpService'
import { addNotification, buildMissingMrpNotification } from '../services/notificationService'
import MissingMrpAlertModal from './MissingMrpAlertModal'

const ACKNOWLEDGED_STORAGE_KEY = 'erp_acknowledged_missing_mrp_ids'

export function getAcknowledgedMissingMrpIds() {
  try {
    const raw = sessionStorage.getItem(ACKNOWLEDGED_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAcknowledgedMissingMrpIds(ids) {
  try {
    sessionStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, JSON.stringify(ids))
  } catch { }
}

export default function MissingMrpAlertManager() {
  const location = useLocation()
  const [allProducts, setAllProducts] = useState([])
  const [missingProducts, setMissingProducts] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [customContext, setCustomContext] = useState({
    isBillingContext: false,
    onProceedAnyway: null,
  })

  // Prevent multiple rapid popups on initial mount
  const hasCheckedInitialRef = useRef(false)

  // Load and detect missing products
  const checkMissingProducts = useCallback(async () => {
    try {
      const prods = await listUIProducts({ status: 'active' })
      setAllProducts(prods)
      const missing = prods.filter(isProductMissingMrp)
      setMissingProducts(missing)

      // Broadcast missing count for header & banners
      window.dispatchEvent(
        new CustomEvent('erp:missing_mrp_count_changed', {
          detail: { count: missing.length, missingProducts: missing },
        })
      )

      const currentPath = typeof window !== 'undefined' ? window.location.pathname : location.pathname;
      if (currentPath === '/login') return

      if (missing.length > 0) {
        const ackIds = new Set(getAcknowledgedMissingMrpIds().map(String))
        const hasUnacknowledged = missing.some(p => !ackIds.has(String(p.id)))

        if (hasUnacknowledged && !hasCheckedInitialRef.current) {
          hasCheckedInitialRef.current = true
          try {
            addNotification(
              buildMissingMrpNotification({
                count: missing.length,
                productNames: missing.map(p => p.name),
                firstProductId: missing[0]?.id,
              })
            )
          } catch { }
          // Short delay to allow page UI to settle
          setTimeout(() => {
            setIsOpen(true)
          }, 600)
        }
      }
    } catch (err) {
      console.warn('Failed to check products for missing MRP:', err)
    }
  }, [location.pathname])

  useEffect(() => {
    checkMissingProducts()
  }, [])

  // Real-time synchronization
  useEffect(() => {
    let timer = null
    const debouncedCheck = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        checkMissingProducts()
      }, 500)
    }

    const unsubProducts = subscribeToTable('products', debouncedCheck)
    const handleUpdate = () => debouncedCheck()

    window.addEventListener('erp:inventory_change', handleUpdate)
    window.addEventListener('erp:mrp_updated', (e) => {
      const { productId, mrp } = e.detail || {}
      if (productId && mrp && Number(mrp) > 0) {
        // Automatically remove this product from missing list
        setMissingProducts(prev => {
          const next = prev.filter(p => String(p.id) !== String(productId))
          if (next.length === 0) {
            setIsOpen(false)
          }
          return next
        })
      }
      debouncedCheck()
    })

    // Listen for manual trigger anywhere in the app
    const handleManualOpen = (e) => {
      const detail = e.detail || {}
      if (detail.products && detail.products.length > 0) {
        setMissingProducts(detail.products)
      } else if (detail.product) {
        setMissingProducts([detail.product])
      }
      setCustomContext({
        isBillingContext: Boolean(detail.isBillingContext || detail.source === 'billing'),
        onProceedAnyway: detail.onProceedAnyway || null,
      })
      setIsOpen(true)
    }
    window.addEventListener('erp:open_missing_mrp_modal', handleManualOpen)

    return () => {
      unsubProducts()
      window.removeEventListener('erp:inventory_change', handleUpdate)
      window.removeEventListener('erp:open_missing_mrp_modal', handleManualOpen)
    }
  }, [checkMissingProducts])

  const handleAcknowledge = () => {
    const currentMissingIds = missingProducts.map(p => String(p.id))
    const existing = getAcknowledgedMissingMrpIds().map(String)
    const combined = Array.from(new Set([...existing, ...currentMissingIds]))
    saveAcknowledgedMissingMrpIds(combined)
    setIsOpen(false)
    setCustomContext({ isBillingContext: false, onProceedAnyway: null })
  }

  const handleProductUpdated = (updatedProd) => {
    setMissingProducts(prev => {
      const next = prev.filter(p => String(p.id) !== String(updatedProd.id))
      if (next.length === 0) {
        setIsOpen(false)
      }
      return next
    })
  }

  const handleProceedAnyway = () => {
    handleAcknowledge()
    if (customContext.onProceedAnyway) {
      customContext.onProceedAnyway()
    }
  }

  return (
    <MissingMrpAlertModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      products={missingProducts}
      onAcknowledge={handleAcknowledge}
      onProductUpdated={handleProductUpdated}
      isBillingContext={customContext.isBillingContext}
      onProceedAnyway={handleProceedAnyway}
    />
  )
}
