// User-Agent required by Open Food Facts terms of service
const USER_AGENT = 'GuptaTradersERP/1.0 (contact@guptatraders.com)'

export function normalizeBarcode(raw) {
  if (!raw) return ''
  return String(raw).trim().replace(/[-\s]/g, '')
}

function cleanCategory(categories) {
  if (!categories) return ''
  if (Array.isArray(categories)) {
    return categories[0]?.replace(/^en:/, '').replace(/[-_]/g, ' ') || ''
  }
  // If comma-separated string, take the first or cleanest term
  const parts = String(categories)
    .split(',')
    .map(c => c.trim().replace(/^en:/, '').replace(/[-_]/g, ' '))
    .filter(Boolean)

  if (parts.length === 0) return ''
  // Capitalize nicely
  const cat = parts[0]
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

/**
 * Clean pack size / quantity string
 */
function cleanPackSize(rawQty, rawNetWeight) {
  if (rawQty && String(rawQty).trim()) {
    return String(rawQty).trim()
  }
  if (rawNetWeight) {
    return String(rawNetWeight).trim()
  }
  return ''
}

/**
 * Lookup barcode in Open Food Facts API
 */
async function fetchFromOpenFoodFacts(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6500)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return null
    const data = await res.json()
    if (data && data.status === 1 && data.product) {
      return { product: data.product, source: 'openfoodfacts' }
    }
    return null
  } catch (err) {
    clearTimeout(timer)
    console.warn(`[productLookup] OpenFoodFacts lookup error for ${barcode}:`, err.message)
    return null
  }
}

/**
 * Fallback to Open Products Facts (for non-food packaged items like toiletries, detergent, etc.)
 */
async function fetchFromOpenProductsFacts(barcode) {
  const url = `https://world.openproductsfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5500)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return null
    const data = await res.json()
    if (data && data.status === 1 && data.product) {
      return { product: data.product, source: 'openproductsfacts' }
    }
    return null
  } catch (err) {
    clearTimeout(timer)
    return null
  }
}

/**
 * Main external lookup function
 * @param {string} rawBarcode
 * @returns {Promise<{
 *   found: boolean,
 *   barcode: string,
 *   name: string,
 *   brand: string,
 *   packSize: string,
 *   category: string,
 *   image: string,
 *   description: string,
 *   source: string,
 *   raw: any
 * }>}
 */
export async function lookupBarcodeExternal(rawBarcode) {
  const barcode = normalizeBarcode(rawBarcode)
  if (!barcode) {
    throw new Error('Please provide a valid barcode.')
  }

  // 1. Try Open Food Facts first (best for snacks, chips, biscuits, drinks)
  let result = await fetchFromOpenFoodFacts(barcode)

  // 2. Try Open Products Facts if not found
  if (!result) {
    result = await fetchFromOpenProductsFacts(barcode)
  }

  if (result && result.product) {
    const p = result.product

    const name = (
      p.product_name ||
      p.product_name_en ||
      p.product_name_hi ||
      p.generic_name ||
      p.generic_name_en ||
      ''
    ).trim()

    const brand = (
      p.brands ||
      p.brand_owner ||
      p.brands_tags?.[0] ||
      ''
    ).split(',')[0].trim()

    const packSize = cleanPackSize(p.quantity, p.net_weight_value ? `${p.net_weight_value} ${p.net_weight_unit || 'g'}` : '')
    const category = cleanCategory(p.categories || p.categories_tags)
    const image = p.image_front_url || p.image_url || p.selected_images?.front?.display?.en || ''
    const description = (p.generic_name || p.ingredients_text || '').slice(0, 250).trim()

    return {
      found: Boolean(name || brand),
      barcode,
      name,
      brand,
      packSize,
      category,
      image,
      description,
      source: result.source,
      raw: {
        code: p.code,
        serving_size: p.serving_size,
        countries: p.countries,
      }
    }
  }

  // If not found in external databases, still return clean barcode object
  return {
    found: false,
    barcode,
    name: '',
    brand: '',
    packSize: '',
    category: '',
    image: '',
    description: '',
    source: null,
    raw: null,
  }
}
