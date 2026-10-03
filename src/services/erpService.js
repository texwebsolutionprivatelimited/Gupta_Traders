import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase/supabase.js'

function fail(error, operation) {
  if (!error) return
  const message = error.message || String(error)
  throw new Error(`${operation}: ${message}`)
}

export async function requireSession() {
  const { data, error } = await supabase.auth.getSession()
  fail(error, 'Unable to verify session')
  if (!data.session?.user) throw new Error('Your session has expired. Please sign in again.')
  return data.session.user
}

export async function getCurrentProfile() {
  const user = await requireSession()
  const { data, error } = await supabase.from('profiles').select('id, full_name, role_id, is_active, phone, created_at, role:roles(id, name, description)').eq('id', user.id).single()
  fail(error, 'Unable to load user profile')
  if (!data?.role_id || !data?.role) throw new Error('This account has no ERP role. Ask an administrator to assign one.')
  if (!data.is_active) throw new Error('This ERP account is inactive.')
  return { ...data, name: data.full_name, status: data.is_active ? 'active' : 'inactive', role: data.role.name.toLowerCase(), email: user.email }
}

// ─── High Performance In-Memory Caching & Request Deduplication ───
const cacheStore = {
  products: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 },
  categories: { data: null, timestamp: 0, ttl: 10 * 60 * 1000 },
  sales: { data: null, timestamp: 0, ttl: 2 * 60 * 1000 },
  purchases: { data: null, timestamp: 0, ttl: 2 * 60 * 1000 },
  purchaseReturns: { data: null, timestamp: 0, ttl: 3 * 60 * 1000 },
  salesReturns: { data: null, timestamp: 0, ttl: 3 * 60 * 1000 },
  customers: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 },
  suppliers: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 },
  expenses: { data: null, timestamp: 0, ttl: 3 * 60 * 1000 },
  movements: { data: null, timestamp: 0, ttl: 2 * 60 * 1000 },
  heldBills: { data: null, timestamp: 0, ttl: 60 * 1000 },
  recentLedger: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 },
  recentActivities: { data: null, timestamp: 0, ttl: 5 * 60 * 1000 },
}

const inFlightRequests = new Map()

export function getCachedOrFetch(key, fetcher, ttlMs, forceRefresh = false) {
  const now = Date.now()
  const entry = cacheStore[key]
  const targetTtl = (ttlMs && entry ? Math.max(ttlMs, entry.ttl) : (ttlMs || (entry ? entry.ttl : 60000)))

  // 1. Check in-memory cache
  if (!forceRefresh && entry && entry.data && (now - entry.timestamp < targetTtl)) {
    return Promise.resolve(entry.data)
  }

  // 2. Check persistent browser storage (localStorage preferred, fallback to sessionStorage)
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const persisted = localStorage.getItem(`erp_cache_${key}`) || sessionStorage.getItem(`erp_cache_${key}`)
      if (persisted) {
        const parsed = JSON.parse(persisted)
        if (parsed && parsed.data && (now - parsed.timestamp < targetTtl)) {
          if (entry) {
            entry.data = parsed.data
            entry.timestamp = parsed.timestamp
          }
          return Promise.resolve(parsed.data)
        }
      }
    } catch (_) { }
  }

  // 3. Request deduplication (if already in-flight)
  if (!forceRefresh && inFlightRequests.has(key)) {
    return inFlightRequests.get(key)
  }

  const promise = (async () => {
    try {
      const data = await fetcher()
      if (entry) {
        entry.data = data
        entry.timestamp = Date.now()
      }
      if (typeof window !== 'undefined') {
        try {
          const payload = JSON.stringify({ data, timestamp: Date.now() })
          try {
            localStorage.setItem(`erp_cache_${key}`, payload)
          } catch (_) {
            sessionStorage.setItem(`erp_cache_${key}`, payload)
          }
        } catch (_) { }
      }
      return data
    } finally {
      inFlightRequests.delete(key)
    }
  })()
  inFlightRequests.set(key, promise)
  return promise
}

export function invalidateCache(scope = 'all') {
  const clearKeys = (keys) => {
    keys.forEach(k => {
      if (cacheStore[k]) cacheStore[k].data = null
      if (typeof window !== 'undefined') {
        try { localStorage.removeItem(`erp_cache_${k}`) } catch (_) { }
        try { sessionStorage.removeItem(`erp_cache_${k}`) } catch (_) { }
      }
    })
  }

  if (scope === 'all') {
    clearKeys(Object.keys(cacheStore))
  } else if (scope === 'products' || scope === 'inventory') {
    clearKeys(['products', 'movements', 'recentActivities'])
  } else if (scope === 'categories') {
    clearKeys(['categories'])
  } else if (scope === 'sales') {
    clearKeys(['sales', 'recentActivities', 'recentLedger'])
  } else if (scope === 'purchases') {
    clearKeys(['purchases', 'recentActivities', 'recentLedger'])
  } else if (scope === 'customers') {
    clearKeys(['customers', 'recentLedger'])
  } else if (scope === 'suppliers') {
    clearKeys(['suppliers', 'recentLedger'])
  } else if (scope === 'expenses') {
    clearKeys(['expenses', 'recentActivities'])
  } else if (scope === 'held_bills') {
    clearKeys(['heldBills'])
  }
}

export async function listCategories({ forceRefresh = false } = {}) {
  return getCachedOrFetch('categories', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,slug,description,icon,color,image_url,status,sort_order')
      .is('deleted_at', null)
      .order('sort_order')
      .order('name')
    fail(error, 'Unable to load categories')
    return data
  }, 5 * 60 * 1000, forceRefresh)
}

export async function createCategory(values) {
  const row = { slug: values.slug || values.id || values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), name: values.name.trim(), description: values.description || '', icon: values.icon || null, color: values.color || null, image_url: values.image || values.image_url || null, status: values.status || 'active', sort_order: values.sortOrder || 0 }
  const { data, error } = await supabase.from('categories').insert(row).select().single()
  fail(error, 'Unable to create category')
  invalidateCache('categories')
  return data
}

export async function updateCategory(id, values) {
  const row = { ...values }
  if ('image' in row) { row.image_url = row.image; delete row.image }
  if (row.sortOrder !== undefined) { row.sort_order = row.sortOrder; delete row.sortOrder }
  const { data, error } = await supabase.from('categories').update(row).eq('id', id).select().single()
  fail(error, 'Unable to update category')
  invalidateCache('categories')
  return data
}

export async function removeCategory(id) {
  const res = await softDeleteEntity('category', id)
  invalidateCache('categories')
  return res
}

const productSelect = 'id,product_code,sku,barcode,name,hindi_name,category_id,brand,pack_size,unit,purchase_price,selling_price,gst_rate,product_type,minimum_stock,image_url,loose_unit,loose_conversion_factor,hsn_code,description,status,metadata,created_at,updated_at,deleted_at,category:categories(id,name,slug),inventory(quantity,reserved_quantity,updated_at)'

export async function listProducts({ search = '', categoryId, status = 'active', forceRefresh = false } = {}) {
  // If we are looking for a standard list or can serve from the cached all-products list
  const hasSpecificQuery = Boolean(search.trim() || categoryId)

  // Load the master active products list with deduplication & caching
  const allActiveProducts = await getCachedOrFetch('products', async () => {
    const { data, error } = await supabase
      .from('products')
      .select(productSelect)
      .is('deleted_at', null)
      .order('name')
    fail(error, 'Unable to load products')
    return data
  }, 10 * 60 * 1000, forceRefresh)

  // Serve queries from master in-memory cache to save egress whenever possible
  if (allActiveProducts && Array.isArray(allActiveProducts)) {
    let filtered = allActiveProducts
    if (status) {
      filtered = filtered.filter(p => p.status === status)
    }
    if (categoryId) {
      filtered = filtered.filter(p => p.category_id === categoryId || p.category?.slug === categoryId)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.hindi_name && p.hindi_name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      )
    }
    return filtered
  }

  // Fallback direct query if cache missed unexpectedly
  let query = supabase.from('products').select(productSelect).is('deleted_at', null).order('name')
  if (status) query = query.eq('status', status)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (search.trim()) {
    const q = search.trim().replace(/[,%()]/g, ' ')
    query = query.or(`name.ilike.%${q}%,hindi_name.ilike.%${q}%,barcode.ilike.%${q}%,sku.ilike.%${q}%,brand.ilike.%${q}%`)
  }
  const { data, error } = await query
  fail(error, 'Unable to load products')
  return data
}

export function productToUI(row) {
  const inv = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
  const rawRate = row.rate !== undefined && row.rate !== null ? row.rate : (row.selling_price !== undefined ? row.selling_price : 0);
  const rate = Number(rawRate || 0);
  const rawMrp = (row.mrp !== undefined && row.mrp !== null && row.mrp !== '')
    ? row.mrp
    : (row.metadata?.mrp !== undefined && row.metadata?.mrp !== null && row.metadata?.mrp !== '' ? row.metadata.mrp : null);
  const parsedMrp = rawMrp !== null && !isNaN(Number(rawMrp)) && Number(rawMrp) > 0 ? Number(rawMrp) : null;
  const mrp = parsedMrp; // null if not manually specified

  const purchasePrice = Number(row.purchase_price || 0);

  return {
    id: row.id,
    supabase_id: row.id,
    productCode: row.product_code || '',
    sku: row.sku || '',
    barcode: row.barcode || '',
    name: row.name,
    nameHi: row.hindi_name || '',
    categoryId: row.category_id,
    category: row.category?.slug || '',
    categoryName: row.category?.name || '',
    brand: row.brand || '',
    packSize: row.pack_size || '',
    unit: row.unit,
    purchasePrice,
    mrp: mrp, // null/blank by default, never 0 or fake rate
    rate,
    sellingPrice: rate, // backward compatibility
    gstRate: Number(row.gst_rate || 0),
    type: row.product_type,
    minStock: Number(row.minimum_stock || 0),
    currentStock: Number(inv?.quantity || 0),
    stock: Number(inv?.quantity || 0),
    image: row.image_url || '',
    looseUnit: row.loose_unit,
    looseConversionFactor: row.loose_conversion_factor,
    hsnCode: row.hsn_code,
    description: row.description || '',
    status: row.status,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listUIProducts(filters = {}) {
  return (await listProducts(filters)).map(productToUI)
}

export async function findProductByBarcode(barcode) {
  if (!barcode) return null
  const clean = String(barcode).trim()
  if (!clean) return null

  // Fast-path: Check in-memory products cache first
  if (Array.isArray(cacheStore.products.data)) {
    const found = cacheStore.products.data.find(p => p.barcode && String(p.barcode).trim() === clean && !p.deleted_at)
    if (found) return productToUI(found)
  }

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('barcode', clean)
    .is('deleted_at', null)
    .maybeSingle()
  fail(error, 'Unable to query product by barcode')
  return data ? productToUI(data) : null
}

export async function createProduct(values) {
  const cleanBarcode = values.barcode ? String(values.barcode).trim() : ''
  if (cleanBarcode) {
    const existing = await findProductByBarcode(cleanBarcode)
    if (existing) {
      throw new Error(`Product already exists with barcode "${cleanBarcode}". Duplicates are not allowed.`)
    }
  }

  const stock = Number(values.currentStock ?? values.stock ?? 0)
  const row = mapProduct(values)

  if (!row.category_id && values.category) {
    const catSearch = values.category.trim()
    const slug = catSearch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .or(`slug.eq.${slug},name.ilike.${catSearch}`)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle()

    if (cat?.id) {
      row.category_id = cat.id
    } else {
      try {
        const createdCat = await createCategory({ name: catSearch, slug })
        if (createdCat?.id) row.category_id = createdCat.id
      } catch (catErr) {
        console.warn('Category auto-creation skipped:', catErr.message)
      }
    }
  }

  const { data, error } = await supabase.from('products').insert(row).select().single()
  fail(error, 'Unable to create product')
  if (stock > 0) {
    const { error: stockError } = await supabase.rpc('change_stock', { p_product_id: data.id, p_delta: stock, p_type: 'opening', p_reason: 'Opening stock' })
    fail(stockError, 'Product created but opening stock failed')
  }
  invalidateCache('products')
  try {
    const { addNotification, buildNewProductNotification } = await import('./notificationService.js');
    addNotification(buildNewProductNotification({
      id: data.id,
      productName: data.name,
      stock: stock,
      unit: values.unit || 'pcs',
      date: new Date().toISOString()
    }));
  } catch (notifErr) {
    console.warn('Could not post new product notification:', notifErr);
  }
  return data
}
export async function updateProduct(id, values) {
  const row = mapProduct(values, true)
  if (!row.category_id && values.category) {
    const { data: category, error: categoryError } = await supabase.from('categories').select('id').eq('slug', values.category).single()
    fail(categoryError, 'Unable to resolve product category')
    row.category_id = category.id
  }
  const { error } = await supabase.from('products').update(row).eq('id', id).select(productSelect).single()
  fail(error, 'Unable to update product')

  const targetStock = values.currentStock ?? values.stock
  if (targetStock !== undefined && targetStock !== null) {
    const targetVal = Number(targetStock)
    const { data: inv, error: invError } = await supabase.from('inventory').select('quantity').eq('product_id', id).maybeSingle()
    fail(invError, 'Unable to fetch current inventory')
    const currentVal = Number(inv?.quantity || 0)
    const delta = targetVal - currentVal
    if (delta !== 0) {
      const { error: stockError } = await supabase.rpc('change_stock', {
        p_product_id: id,
        p_delta: delta,
        p_type: 'adjustment',
        p_reason: 'Manual stock adjustment from product edit'
      })
      fail(stockError, 'Product updated but stock adjustment failed')
    }
  }

  invalidateCache('products')
  const { data: refetched, error: refetchError } = await supabase.from('products').select(productSelect).eq('id', id).single()
  fail(refetchError, 'Unable to reload updated product details')
  return productToUI(refetched)
}
export async function removeProduct(id) {
  const res = await softDeleteEntity('product', id)
  invalidateCache('products')
  return res
}
function mapProduct(v, partial = false) {
  const rateVal = v.rate !== undefined && v.rate !== '' ? v.rate : (v.sellingPrice !== undefined && v.sellingPrice !== '' ? v.sellingPrice : v.selling_price);
  const cleanRate = rateVal !== undefined ? Number(rateVal ?? 0) : undefined;

  // Manual MRP: Only present if explicitly set and > 0.
  // If blank or not provided, remove it from metadata so it stays null/blank!
  const hasManualMrp = v.mrp !== undefined && v.mrp !== null && v.mrp !== '' && !isNaN(Number(v.mrp)) && Number(v.mrp) > 0;
  const cleanMrp = hasManualMrp ? Number(v.mrp) : null;

  const existingMeta = (v.metadata && typeof v.metadata === 'object') ? { ...v.metadata } : {};
  if (cleanMrp !== null) {
    existingMeta.mrp = cleanMrp;
  } else {
    delete existingMeta.mrp;
  }
  if (cleanRate !== undefined) {
    existingMeta.rate = cleanRate;
  }

  const row = {
    product_code: v.productCode === undefined ? undefined : (v.productCode ? v.productCode : null),
    sku: v.sku === undefined ? undefined : (v.sku ? v.sku : null),
    barcode: v.barcode === undefined ? undefined : (v.barcode ? v.barcode : null),
    name: v.name,
    hindi_name: v.nameHi,
    category_id: v.categoryId === undefined && v.category_id === undefined ? undefined : (v.categoryId || v.category_id || null),
    brand: v.brand,
    pack_size: v.packSize,
    unit: v.unit,
    purchase_price: v.purchasePrice === undefined && v.purchase_price === undefined ? undefined : Number(v.purchasePrice ?? v.purchase_price ?? 0),
    selling_price: cleanRate,
    gst_rate: v.gstRate === undefined && v.gst_rate === undefined ? undefined : Number(v.gstRate ?? v.gst_rate ?? 0),
    product_type: v.type === undefined && v.product_type === undefined ? undefined : (v.type || v.product_type || 'packaged'),
    minimum_stock: v.minStock === undefined && v.minimum_stock === undefined ? undefined : Number(v.minStock ?? v.minimum_stock ?? 0),
    image_url: v.image === undefined && v.image_url === undefined ? undefined : (v.image || v.image_url),
    loose_unit: v.looseUnit,
    loose_conversion_factor: v.looseConversionFactor,
    hsn_code: v.hsnCode,
    description: v.description,
    status: v.status === undefined ? undefined : (v.status || 'active'),
    metadata: existingMeta
  }
  if (partial) Object.keys(row).forEach(k => row[k] === undefined && delete row[k]); return row
}

export async function adjustStock(productId, delta, type = 'adjustment', reason = '') {
  const { data, error } = await supabase.rpc('change_stock', { p_product_id: productId, p_delta: Number(delta), p_type: type, p_reason: reason });
  fail(error, 'Unable to update stock');
  invalidateCache('products');
  return data
}

export function isProductMissingMrp(product) {
  if (!product) return false;
  const raw = product.mrp !== undefined && product.mrp !== null && product.mrp !== ''
    ? product.mrp
    : (product.metadata?.mrp !== undefined && product.metadata?.mrp !== null ? product.metadata.mrp : null);
  if (raw === undefined || raw === null || raw === '') return true;
  const num = Number(raw);
  return isNaN(num) || num <= 0;
}

export async function updateProductMRP(productId, mrp) {
  const cleanMrp = mrp !== null && mrp !== undefined && mrp !== '' && !isNaN(Number(mrp)) && Number(mrp) > 0 ? Number(mrp) : null;
  // Fetch existing product to preserve existing metadata
  const { data: current, error: getErr } = await supabase.from('products').select('metadata').eq('id', productId).single();
  fail(getErr, 'Product not found');
  const existingMeta = (current?.metadata && typeof current.metadata === 'object') ? { ...current.metadata } : {};
  if (cleanMrp !== null) {
    existingMeta.mrp = cleanMrp;
  } else {
    delete existingMeta.mrp;
  }

  // Update metadata.mrp and optionally column mrp if it exists in DB schema
  let updateData = { metadata: existingMeta, mrp: cleanMrp };
  let { data: refetched, error } = await supabase.from('products').update(updateData).eq('id', productId).select(productSelect).single();
  if (error && (error.message?.includes('column "mrp"') || error.code === '42703')) {
    delete updateData.mrp;
    const retry = await supabase.from('products').update(updateData).eq('id', productId).select(productSelect).single();
    fail(retry.error, 'Unable to update MRP');
    refetched = retry.data;
  } else if (error) {
    fail(error, 'Unable to update MRP');
  }

  invalidateCache('products');
  const uiProduct = productToUI(refetched);
  window.dispatchEvent(new CustomEvent('erp:mrp_updated', { detail: { productId, mrp: cleanMrp, product: uiProduct } }));
  window.dispatchEvent(new CustomEvent('erp:inventory_change', { detail: { productId } }));
  return uiProduct;
}
export async function listInventoryMovements({ forceRefresh = false } = {}) {
  return getCachedOrFetch('movements', async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('id,product_id,movement_type,quantity,reference_type,reference_id,notes,reason,created_at,created_by,product:products(id,name,sku,barcode,unit)')
      .order('created_at', { ascending: false })
      .limit(75);
    fail(error, 'Unable to load inventory ledger');
    return data || [];
  }, 5 * 60 * 1000, forceRefresh);
}
export async function setMinimumStock(productId, minimum) { const { data, error } = await supabase.from('products').update({ minimum_stock: Number(minimum) }).eq('id', productId).select().single(); fail(error, 'Unable to update minimum stock'); invalidateCache('products'); return data }
export async function completeSale(sale, items) {
  await requireSession();
  const paidVal = sale.paid_amount ?? sale.amount_paid ?? sale.total_amount;
  const splitData = sale.splitDetails || sale.metadata?.splitDetails;
  const cashVal = sale.cashAmount ?? sale.metadata?.cashAmount ?? splitData?.cashAmount;
  const upiVal = sale.upiAmount ?? sale.metadata?.upiAmount ?? splitData?.upiAmount;

  const salePayload = {
    ...sale,
    paid_amount: paidVal,
    amount_paid: paidVal,
    payment_reference: sale.payment_reference || (sale.payment_method === 'cash_upi' && (cashVal !== undefined || upiVal !== undefined)
      ? `Cash: ₹${cashVal || 0} + UPI: ₹${upiVal || 0}`
      : sale.payment_reference),
    notes: sale.notes || (sale.payment_method === 'cash_upi'
      ? JSON.stringify({ cashAmount: cashVal, upiAmount: upiVal, splitDetails: splitData })
      : sale.notes),
  };

  const { data, error } = await supabase.rpc('complete_sale', { p_sale: salePayload, p_items: items });
  fail(error, 'Unable to complete sale');
  invalidateCache('products');
  invalidateCache('sales');

  try {
    const metaToSave = {
      ...(sale.metadata || {}),
      splitDetails: splitData || (cashVal !== undefined ? { cashAmount: cashVal, upiAmount: upiVal } : undefined),
      cashAmount: cashVal,
      upiAmount: upiVal,
    };
    const { data: updatedSale, error: updateErr } = await supabase
      .from('sales')
      .update({
        metadata: metaToSave,
        paid_amount: Number(paidVal || 0),
        payment_reference: salePayload.payment_reference || null,
        notes: salePayload.notes || null,
      })
      .eq('id', data.id)
      .select('id,invoice_number,subtotal,tax_amount,total_amount,paid_amount,due_amount,payment_method,payment_reference,notes,metadata')
      .single();

    if (!updateErr && updatedSale) {
      return updatedSale;
    }
    if (updateErr) {
      console.warn('Could not update metadata on sales row:', updateErr);
    }
  } catch (updateErr) {
    console.warn('Could not update metadata on sales row:', updateErr);
  }

  const { data: saved, error: loadError } = await supabase
    .from('sales')
    .select('id,invoice_number,subtotal,tax_amount,total_amount,paid_amount,due_amount,payment_method,payment_reference,notes,metadata')
    .eq('id', data.id)
    .single();
  fail(loadError, 'Sale completed but its totals could not be loaded');
  return saved;
}
export async function completePurchase(purchase, items) { await requireSession(); const { data, error } = await supabase.rpc('complete_purchase', { p_purchase: purchase, p_items: items }); fail(error, 'Unable to complete purchase'); invalidateCache('products'); invalidateCache('purchases'); return data }

export async function savePurchaseBill(billData, items = [], existingId = null) {
  const {
    supplierName = '',
    supplierContact = '',
    supplierAddress = '',
    purchaseDate,
    billNo,
    notes = '',
    paymentMode = 'Cash',
    subtotal,
    taxAmount,
    total
  } = billData;

  let supplierId = null;
  if (supplierName && supplierName.trim()) {
    try {
      const { data: sups } = await supabase.from('suppliers').select('id, company_name, phone, address').is('deleted_at', null);
      let matchedSup = (sups || []).find(
        s => (s.company_name || '').trim().toLowerCase() === supplierName.trim().toLowerCase()
      );
      if (!matchedSup) {
        const newSup = await saveSupplier({
          companyName: supplierName.trim(),
          phone: supplierContact?.trim() || null,
          address: supplierAddress?.trim() || null,
          status: 'active'
        });
        supplierId = newSup?.id || null;
      } else {
        supplierId = matchedSup.id;
        if (supplierContact || supplierAddress) {
          await supabase.from('suppliers').update({
            phone: supplierContact?.trim() || matchedSup.phone,
            address: supplierAddress?.trim() || matchedSup.address
          }).eq('id', matchedSup.id);
        }
      }
    } catch (e) {
      console.warn('Supplier auto-link notice:', e);
    }
  }

  const invoiceNumber = billNo?.trim() || `PUR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const formattedItems = (items || []).map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.purchasePrice) || 0;
    const gstRate = Number(item.gst) || 0;
    const lineTotal = Number((qty * price).toFixed(2));
    const lineTax = Number(((lineTotal * gstRate) / 100).toFixed(2));
    const lineTotalWithTax = Number((lineTotal + lineTax).toFixed(2));

    return {
      id: item.id || `item-${idx + 1}`,
      product_name: (item.product || '').trim() || 'Product',
      product: (item.product || '').trim() || 'Product',
      quantity: qty,
      purchase_price: price,
      unit_price: price,
      tax_rate: gstRate,
      tax: gstRate,
      tax_amount: lineTax,
      line_total: lineTotal,
      total: lineTotalWithTax,
      isManual: !!item.isManual
    };
  });

  const calcSubtotal = subtotal !== undefined ? Number(subtotal) : formattedItems.reduce((sum, it) => sum + it.line_total, 0);
  const calcTax = taxAmount !== undefined ? Number(taxAmount) : formattedItems.reduce((sum, it) => sum + it.tax_amount, 0);
  const calcTotal = total !== undefined ? Number(total) : (calcSubtotal + calcTax);

  const purchaseRow = {
    supplier_id: supplierId,
    supplier_name: supplierName?.trim() || 'Unknown Supplier',
    supplier_invoice_number: billNo?.trim() || null,
    invoice_number: invoiceNumber,
    purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
    subtotal: Number(calcSubtotal.toFixed(2)),
    tax: Number(calcTax.toFixed(2)),
    tax_amount: Number(calcTax.toFixed(2)),
    total_amount: Number(calcTotal.toFixed(2)),
    paid_amount: 0,
    due_amount: 0,
    payment_status: 'Paid',
    payment_method: paymentMode || 'Cash',
    notes: notes?.trim() || null,
    status: 'completed',
    metadata: {
      hard_copy_record: true,
      supplier_name: supplierName?.trim(),
      supplier_contact: supplierContact?.trim(),
      supplier_phone: supplierContact?.trim(),
      supplier_address: supplierAddress?.trim(),
      items: formattedItems
    }
  };

  let savedPurchase = null;

  if (existingId) {
    const { data, error } = await supabase
      .from('purchases')
      .update(purchaseRow)
      .eq('id', existingId)
      .select('id, supplier_id, invoice_number, supplier_invoice_number, purchase_date, subtotal, discount, tax, tax_amount, total_amount, paid_amount, due_amount, payment_status, payment_method, notes, status, metadata, created_at, supplier:suppliers(id, company_name, name, phone, address)')
      .single();
    fail(error, 'Unable to update purchase bill');
    savedPurchase = data;

    try {
      await supabase.from('purchase_items').delete().eq('purchase_id', existingId);
      const itemsToInsert = formattedItems.map(it => ({
        purchase_id: existingId,
        product_name: it.product_name,
        quantity: it.quantity,
        purchase_price: it.purchase_price,
        unit_price: it.unit_price,
        tax_rate: it.tax_rate,
        tax_amount: it.tax_amount,
        line_total: it.line_total,
        total: it.total
      }));
      await supabase.from('purchase_items').insert(itemsToInsert);
    } catch (e) {
      console.warn('Items preserved in purchase record metadata:', e);
    }
  } else {
    const { data, error } = await supabase
      .from('purchases')
      .insert(purchaseRow)
      .select('id, supplier_id, invoice_number, supplier_invoice_number, purchase_date, subtotal, discount, tax, tax_amount, total_amount, paid_amount, due_amount, payment_status, payment_method, notes, status, metadata, created_at, supplier:suppliers(id, company_name, name, phone, address)')
      .single();
    fail(error, 'Unable to save purchase bill');
    savedPurchase = data;

    try {
      const itemsToInsert = formattedItems.map(it => ({
        purchase_id: savedPurchase.id,
        product_name: it.product_name,
        quantity: it.quantity,
        purchase_price: it.purchase_price,
        unit_price: it.unit_price,
        tax_rate: it.tax_rate,
        tax_amount: it.tax_amount,
        line_total: it.line_total,
        total: it.total
      }));
      await supabase.from('purchase_items').insert(itemsToInsert);
    } catch (e) {
      console.warn('Items preserved in purchase record metadata:', e);
    }
  }

  invalidateCache('products');
  invalidateCache('purchases');
  return savedPurchase;
}

export async function deletePurchaseBill(id) {
  try {
    await supabase.from('payments').delete().eq('purchase_id', id);
  } catch (e) { }
  try {
    await supabase.from('purchase_items').delete().eq('purchase_id', id);
  } catch (e) { }
  const { error } = await supabase.from('purchases').delete().eq('id', id);
  if (error) {
    await supabase.from('purchases').update({ status: 'deleted', notes: 'Deleted purchase bill' }).eq('id', id);
  }
  invalidateCache('products');
  invalidateCache('purchases');
  return true;
}
export async function completeSalesReturn(ret, items) {
  await requireSession();
  const { data, error } = await supabase.rpc('complete_sales_return', { p_return: ret, p_items: items });
  fail(error, 'Unable to complete sales return');
  invalidateCache('products');
  invalidateCache('inventory');
  invalidateCache('sales');
  invalidateCache('salesReturns');
  try {
    window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { returnData: data, items } }));
    window.dispatchEvent(new CustomEvent('erp:inventory_change', { detail: { type: 'sales_return', items } }));
  } catch (e) { }
  return data;
}
export async function completePurchaseReturn(ret, items) {
  const { data, error } = await supabase.rpc('complete_purchase_return', { p_return: ret, p_items: items });
  fail(error, 'Unable to complete purchase return');
  invalidateCache('products');
  invalidateCache('purchases');
  invalidateCache('purchaseReturns');
  return data;
}

export async function listPurchaseReturns({ forceRefresh = false } = {}) {
  return getCachedOrFetch('purchaseReturns', async () => {
    const { data, error } = await supabase
      .from('purchase_returns')
      .select('id, return_number, return_date, subtotal, tax_amount, total_amount, reason, notes, status, created_at, purchase_id, supplier_id, purchase:purchases(supplier_invoice_number, invoice_number), supplier:suppliers(company_name, name), items:purchase_return_items(id, purchase_return_id, purchase_item_id, product_id, product_name, quantity, unit_price, price, tax_rate, total, line_total)')
      .order('created_at', { ascending: false })
      .limit(60);
    fail(error, 'Unable to load purchase returns');
    return (data || []).map(r => {
      let items = r.items || [];
      if ((!items || items.length === 0) && r.notes && r.notes.includes('--- RETURN ITEMS ---')) {
        try {
          const jsonPart = r.notes.split('--- RETURN ITEMS ---')[1];
          items = JSON.parse(jsonPart.trim());
        } catch (e) { }
      }
      return {
        ...r,
        id: r.id,
        returnNo: r.return_no || r.return_number || 'PR-000',
        invoiceNo: r.invoice_no || r.purchase?.supplier_invoice_number || r.purchase?.invoice_number || '',
        supplierName: r.supplier_name || r.supplier?.company_name || r.supplier?.name || 'Supplier',
        date: r.return_date || r.created_at,
        subtotal: Number(r.subtotal || 0),
        taxAmount: Number(r.tax_amount || 0),
        totalAmount: Number(r.total_amount || 0),
        reason: r.reason || 'Other',
        notes: r.notes || '',
        status: r.status || 'Completed',
        items: (items || []).map((it, idx) => ({
          ...it,
          id: it.id || `pr-item-${idx}`,
          product: it.product_name || it.product || it.name || 'Product',
          quantity: Number(it.quantity || 1),
          purchasePrice: Number(it.price ?? it.unit_price ?? it.purchasePrice ?? 0),
          gst: Number(it.gst ?? it.tax_rate ?? 0),
          total: Number(it.total ?? it.line_total ?? (Number(it.quantity || 1) * Number(it.price ?? it.unit_price ?? 0)))
        }))
      };
    });
  }, 3 * 60 * 1000, forceRefresh);
}

export async function savePurchaseReturn(returnData, returnItems) {
  let savedResult = null;
  const validRpcItems = (returnItems || []).filter(it => it.purchase_item_id && it.product_id);

  if (validRpcItems.length > 0 && validRpcItems.length === (returnItems || []).length && returnData.purchase_id) {
    try {
      const rpcPayload = validRpcItems.map(it => ({
        purchase_item_id: it.purchase_item_id,
        quantity: Number(it.quantity)
      }));
      const res = await completePurchaseReturn({
        purchase_id: returnData.purchase_id,
        supplier_id: returnData.supplier_id || null,
        return_number: returnData.return_no || returnData.return_number || null,
        return_date: returnData.return_date,
        reason: returnData.reason,
        notes: returnData.notes,
        refund_method: returnData.refund_method || 'Refund'
      }, rpcPayload);
      savedResult = res;
    } catch (rpcErr) {
      console.warn('RPC complete_purchase_return fallback to direct record:', rpcErr);
    }
  }

  if (!savedResult) {
    const returnNumber = returnData.return_no || returnData.return_number || `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsJson = JSON.stringify(returnItems || []);
    const fullNotes = returnData.notes
      ? `${returnData.notes}\n\n--- RETURN ITEMS ---\n${itemsJson}`
      : `--- RETURN ITEMS ---\n${itemsJson}`;

    const returnRow = {
      return_no: returnNumber,
      return_number: returnNumber,
      purchase_id: returnData.purchase_id || null,
      supplier_id: returnData.supplier_id || null,
      supplier_name: returnData.supplier_name || null,
      invoice_no: returnData.invoice_no || null,
      return_date: returnData.return_date ? new Date(returnData.return_date).toISOString() : new Date().toISOString(),
      reason: returnData.reason || 'Other',
      notes: fullNotes,
      subtotal: Number(returnData.subtotal || 0),
      tax_amount: Number(returnData.tax_amount || 0),
      total_amount: Number(returnData.total_amount || 0),
      status: 'Completed',
      payment_status: 'Refund Pending',
      refund_method: returnData.refund_method || 'Refund'
    };

    const { data: prData, error: prErr } = await supabase
      .from('purchase_returns')
      .insert(returnRow)
      .select('id, return_number, return_date, total_amount, status')
      .single();

    fail(prErr, 'Unable to save purchase return record');
    savedResult = prData;

    if (returnItems && returnItems.length > 0 && prData?.id) {
      const itemsToInsert = returnItems.map(it => ({
        purchase_return_id: prData.id,
        purchase_item_id: it.purchase_item_id && String(it.purchase_item_id).includes('-') ? it.purchase_item_id : null,
        product_id: it.product_id && String(it.product_id).includes('-') ? it.product_id : null,
        product_name: it.product || it.name || it.product_name || 'Item',
        quantity: Number(it.quantity || 1),
        price: Number(it.purchasePrice ?? it.unit_price ?? 0),
        unit_price: Number(it.purchasePrice ?? it.unit_price ?? 0),
        gst: Number(it.gst ?? it.tax_rate ?? 0),
        tax_rate: Number(it.gst ?? it.tax_rate ?? 0),
        tax_amount: Number(it.gstAmount ?? it.tax_amount ?? 0),
        line_total: Number(it.amount ?? it.line_total ?? 0),
        total: Number(it.total ?? 0)
      }));

      try {
        await supabase.from('purchase_return_items').insert(itemsToInsert);
      } catch (itemErr) {
        console.warn('Purchase return items table insert notice:', itemErr);
      }
    }
  }

  invalidateCache('products');
  invalidateCache('purchases');
  invalidateCache('purchaseReturns');
  return savedResult;
}

export async function deletePurchaseReturn(id) {
  if (!id) return false;
  try {
    await supabase.from('purchase_return_items').delete().eq('purchase_return_id', id);
  } catch (e) { }
  const { error } = await supabase.from('purchase_returns').delete().eq('id', id);
  fail(error, 'Unable to delete purchase return record');
  invalidateCache('products');
  invalidateCache('purchases');
  invalidateCache('purchaseReturns');
  return true;
}

export async function listSalesReturns({ forceRefresh = false } = {}) {
  return getCachedOrFetch('salesReturns', async () => {
    const { data, error } = await supabase
      .from('sales_returns')
      .select('id,return_number,sale_id,customer_id,return_date,subtotal,tax_amount,total_amount,reason,refund_method,notes,created_at,sale:sales(id,invoice_number,sale_date,total_amount,payment_method),customer:customers(id,name,phone),items:sale_return_items(id,sales_return_id,sale_item_id,product_id,quantity,unit_price,line_total,price,total,product:products(id,name,unit,sku,pack_size))')
      .order('created_at', { ascending: false })
      .limit(50);
    fail(error, 'Unable to load sales returns');
    return data || [];
  }, 3 * 60 * 1000, forceRefresh);
}

export async function listSales({ forceRefresh = false } = {}) {
  return getCachedOrFetch('sales', async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('id,customer_id,invoice_number,sale_date,subtotal,discount,tax,tax_amount,total_amount,paid_amount,due_amount,payment_status,payment_method,payment_reference,notes,metadata,status,created_at,customer:customers(id,name,phone),items:sale_items(id,sale_id,product_id,product_name,sku,unit,quantity,unit_price,selling_price,unit_cost,discount,tax_rate,tax_amount,line_total,total,metadata,returns:sale_return_items(quantity,total,price),product:products(id,name,unit,selling_price,purchase_price,pack_size)),returns:sales_returns(id,return_number,total_amount,return_date,refund_method,items:sale_return_items(quantity,line_total,product_id,product:products(id,name,unit,sku,pack_size)))')
      .order('sale_date', { ascending: false })
      .limit(75);
    fail(error, 'Unable to load sales');
    return data || [];
  }, 2 * 60 * 1000, forceRefresh);
}

export async function listPurchases({ forceRefresh = false } = {}) {
  return getCachedOrFetch('purchases', async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select('id,supplier_id,invoice_number,supplier_invoice_number,purchase_date,subtotal,discount,tax,tax_amount,total_amount,paid_amount,due_amount,payment_status,payment_method,payment_reference,notes,status,metadata,created_at,supplier:suppliers(id,company_name,name,phone,address),items:purchase_items(id,product_id,product_name,sku,unit,quantity,unit_price,purchase_price,tax_rate,tax_amount,line_total,total,discount,metadata)')
      .order('purchase_date', { ascending: false })
      .limit(75);
    fail(error, 'Unable to load purchases');
    return data || [];
  }, 2 * 60 * 1000, forceRefresh);
}
export async function listUISales() {
  return (await listSales()).map(s => {
    const saleDateStr = s.sale_date || s.created_at;
    const saleDate = saleDateStr ? new Date(saleDateStr) : new Date();
    const now = new Date();
    const diffMs = now.getTime() - saleDate.getTime();
    const daysSinceSale = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const isWithinReturnWindow = daysSinceSale <= 7;
    const daysRemaining = Math.max(0, 7 - daysSinceSale);

    const saleReturns = s.returns || [];
    const totalRefunded = saleReturns.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    const mappedItems = (s.items || []).map((i, idx) => {
      const originalQty = Number(i.quantity || 1);
      const retItems = i.returns || [];
      const returnedQty = retItems.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
      const returnableQty = Math.max(0, originalQty - returnedQty);
      const isReturned = returnableQty === 0 && originalQty > 0;
      const isPartiallyReturned = returnedQty > 0 && returnableQty > 0;

      const rawLineTotal = Number(i.line_total ?? i.total ?? 0);
      const rawLineTax = Number(i.tax_amount ?? i.tax ?? 0);
      const grossLineTotal = rawLineTotal + (rawLineTax > 0 ? rawLineTax : 0);
      const computedUnitGross = originalQty > 0 && grossLineTotal > 0 ? (grossLineTotal / originalQty) : 0;
      const computedUnitNet = originalQty > 0 && rawLineTotal > 0 ? (rawLineTotal / originalQty) : 0;

      const explicitPrice = Number(i.metadata?.display_price ?? i.display_price ?? 0);
      const price = explicitPrice > 0
        ? explicitPrice
        : (computedUnitGross > 0
          ? computedUnitGross
          : Number(i.selling_price ?? i.unit_price ?? computedUnitNet ?? i.product?.selling_price ?? 0));

      const itemDiscount = Number(i.metadata?.item_discount_percent || i.discount || 0);
      const gst = Number(i.tax_rate || i.tax || 0);
      const cost = Number(i.unit_cost || i.product?.purchase_price || 0);
      const rawMrp = i.metadata?.mrp ?? i.mrp ?? i.product?.mrp ?? (i.product?.metadata?.mrp || null);
      const mrp = (rawMrp !== null && rawMrp !== undefined && rawMrp !== '' && !isNaN(Number(rawMrp)) && Number(rawMrp) > 0)
        ? Number(rawMrp)
        : null;

      const itemId = i.id || i.sale_item_id || `${s.id}_item_${idx}`;

      return {
        ...i,
        id: itemId,
        product: i.product_name || i.product?.name || i.product || 'Item',
        name: i.product_name || i.product?.name || i.product || 'Item',
        packSize: i.packSize || i.pack_size || i.metadata?.packSize || i.metadata?.pack_size || i.product?.pack_size || '',
        unit: i.unit || i.product?.unit || '',
        salesPrice: price,
        price,
        mrp,
        itemDiscount,
        gst,
        purchasePrice: cost,
        unit_cost: cost,
        quantity: originalQty,
        originalQuantity: originalQty,
        returnedQuantity: returnedQty,
        returnableQuantity: returnableQty,
        lineTotal: grossLineTotal > 0 ? grossLineTotal : (price * originalQty),
        originalLineTotal: grossLineTotal > 0 ? grossLineTotal : (price * originalQty),
        isReturned,
        isPartiallyReturned,
      };
    });

    const totalSoldQty = mappedItems.reduce((sum, it) => sum + it.originalQuantity, 0);
    const totalReturnedQty = mappedItems.reduce((sum, it) => sum + it.returnedQuantity, 0);
    const isFullyReturned = totalReturnedQty >= totalSoldQty && totalSoldQty > 0;
    const isPartiallyReturned = totalReturnedQty > 0 && !isFullyReturned;

    let computedStatus = s.status === 'completed' ? 'Completed' : s.status;
    if (isFullyReturned || s.status === 'returned') computedStatus = 'Returned';
    else if (isPartiallyReturned || s.status === 'partially_returned') computedStatus = 'Partially Returned';

    const rawMeta = (typeof s.metadata === 'object' && s.metadata !== null)
      ? s.metadata
      : (typeof s.metadata === 'string' ? (() => { try { return JSON.parse(s.metadata); } catch { return {}; } })() : {});

    let parsedNotes = {};
    if (typeof s.notes === 'string' && s.notes.trim().startsWith('{')) {
      try { parsedNotes = JSON.parse(s.notes); } catch { }
    }
    if (typeof s.payment_reference === 'string' && s.payment_reference.trim().startsWith('{')) {
      try { parsedNotes = { ...parsedNotes, ...JSON.parse(s.payment_reference) }; } catch { }
    }

    const meta = { ...parsedNotes, ...rawMeta };
    let cashAmount = meta.cashAmount ?? meta.splitDetails?.cashAmount;
    let upiAmount = meta.upiAmount ?? meta.splitDetails?.upiAmount;

    if ((cashAmount === undefined || upiAmount === undefined) && s.payment_reference) {
      const cashM = String(s.payment_reference).match(/Cash[:\s]*₹?\s*([\d.]+)/i);
      const upiM = String(s.payment_reference).match(/UPI[:\s]*₹?\s*([\d.]+)/i);
      if (cashM) cashAmount = parseFloat(cashM[1]);
      if (upiM) upiAmount = parseFloat(upiM[1]);
    }

    return {
      id: s.id,
      date: s.sale_date,
      customer: s.customer?.name || 'Walk-in Customer',
      customerId: s.customer_id,
      customerObj: s.customer,
      invoice: s.invoice_number,
      invoice_number: s.invoice_number,
      items: mappedItems,
      itemCount: mappedItems.length,
      subtotal: Number(s.subtotal),
      gst: Number(s.tax_amount ?? s.tax),
      discount: Number(s.discount),
      total: Number(s.total_amount),
      status: computedStatus,
      rawStatus: s.status,
      payment: totalRefunded >= Number(s.total_amount) ? 'Refunded' : s.payment_status === 'paid' ? 'Paid' : 'Pending',
      paymentMode: s.payment_method,
      amountPaid: Number(s.paid_amount ?? s.amount_paid ?? s.total_amount),
      paid_amount: Number(s.paid_amount ?? s.amount_paid ?? s.total_amount),
      metadata: meta,
      splitDetails: (cashAmount !== undefined && upiAmount !== undefined) ? { cashAmount, upiAmount } : meta.splitDetails,
      cashAmount,
      upiAmount,
      paymentReference: s.payment_reference,
      payment_reference: s.payment_reference,
      notes: s.notes,
      createdAt: s.created_at,
      returns: saleReturns,
      totalRefunded,
      hasReturns: saleReturns.length > 0,
      totalSoldQty,
      totalReturnedQty,
      isFullyReturned,
      isPartiallyReturned,
      daysSinceSale,
      daysRemaining,
      isWithinReturnWindow,
    };
  });
}
export async function listUIPurchases() {
  return (await listPurchases())
    .filter(p => p.status !== 'deleted')
    .map(p => {
      const rawItems = (p.items && p.items.length > 0) ? p.items : (p.metadata?.items || []);
      return {
        id: p.id,
        supplierId: p.supplier_id || p.supplier?.id || null,
        date: p.purchase_date,
        supplier: p.supplier?.company_name || p.supplier?.name || p.metadata?.supplier_name || p.supplier_name || 'Unknown Supplier',
        supplierContact: p.supplier?.phone || p.metadata?.supplier_contact || p.metadata?.supplier_phone || '',
        supplierAddress: p.supplier?.address || p.metadata?.supplier_address || '',
        invoice: p.invoice_number || p.supplier_invoice_number || (p.id ? String(p.id).slice(0, 8) : 'INV-000'),
        billNo: p.supplier_invoice_number || p.invoice_number,
        items: rawItems.map((i, idx) => ({
          ...i,
          id: i.id || `item-${idx}`,
          product: i.product_name || i.product || i.name || 'Product',
          purchasePrice: Number(i.unit_price ?? i.purchase_price ?? 0),
          gst: Number(i.tax_rate ?? i.tax ?? 0),
          quantity: Number(i.quantity || 1),
          amount: Number(i.line_total ?? (Number(i.quantity || 1) * Number(i.unit_price ?? i.purchase_price ?? 0))),
          total: Number(i.total ?? ((Number(i.quantity || 1) * Number(i.unit_price ?? i.purchase_price ?? 0)) + Number(i.tax_amount ?? 0))),
          isManual: i.isManual ?? false
        })),
        itemCount: rawItems.length,
        subtotal: Number(p.subtotal || 0),
        gst: Number(p.tax_amount ?? p.tax ?? 0),
        discount: Number(p.discount || 0),
        total: Number(p.total_amount || 0),
        status: p.status === 'completed' ? 'Completed' : (p.status || 'Completed'),
        payment: p.payment_status === 'paid' ? 'Paid' : (p.payment_status || 'Paid'),
        paymentMode: p.payment_method || 'Cash',
        notes: p.notes || '',
        metadata: p.metadata || {},
        createdAt: p.created_at
      };
    });
}
export async function listCustomers({ forceRefresh = false } = {}) {
  return getCachedOrFetch('customers', async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id,name,phone,email,address,city,state,postal_code,gstin,customer_type,credit_limit,balance,opening_balance,status,profile_image_url,notes,metadata,created_at,updated_at')
      .is('deleted_at', null)
      .order('name');
    fail(error, 'Unable to load customers');
    return data || [];
  }, 10 * 60 * 1000, forceRefresh);
}
export function customerToUI(c) { return { id: c.id, name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', city: c.city || '', gstin: c.gstin || c.gst_number || '', customerType: c.customer_type || 'retail', creditLimit: Number(c.credit_limit || 0), outstandingBalance: Number(c.balance ?? c.opening_balance ?? 0), status: c.status || 'active', profilePic: c.profile_image_url || '', createdAt: c.created_at, updatedAt: c.updated_at, metadata: c.metadata || {} } }

async function getRecentTransactionsLedger(forceRefresh = false) {
  return getCachedOrFetch('recentLedger', async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('id,reference_id,transaction_date,type,description,amount')
      .order('transaction_date', { ascending: false })
      .limit(60);
    fail(error, 'Unable to load ledgers');
    return data || [];
  }, 5 * 60 * 1000, forceRefresh);
}

export async function listUICustomers({ forceRefresh = false } = {}) {
  const customers = (await listCustomers({ forceRefresh })).map(customerToUI);
  const ledger = await getRecentTransactionsLedger(forceRefresh);
  return customers.map(c => ({
    ...c,
    ledger: ledger.filter(x => x.reference_id === c.id).map(x => ({
      id: x.id,
      date: x.transaction_date || x.date,
      type: x.type,
      description: x.description,
      amount: Number(x.amount || 0),
      balanceAfter: null
    }))
  }));
}
function customerRow(v) { return { name: v.name?.trim(), phone: v.phone?.trim() || null, email: v.email?.trim() || null, address: v.address?.trim() || null, city: v.city?.trim() || null, state: v.state || null, postal_code: v.postalCode || null, gstin: v.gstin?.trim().toUpperCase() || null, customer_type: v.customerType || 'retail', credit_limit: Number(v.creditLimit || 0), status: v.status || 'active', profile_image_url: v.profilePic || null, notes: v.notes || null, metadata: v.metadata || {} } }
export async function saveCustomer(values, id) {
  const row = customerRow(values);
  if (!id) row.balance = 0;
  const query = id ? supabase.from('customers').update(row).eq('id', id) : supabase.from('customers').insert(row);
  const { data, error } = await query.select().single();
  fail(error, id ? 'Unable to update customer' : 'Unable to create customer');
  invalidateCache('customers');
  if (!id && Number(values.openingBalance)) {
    await recordPartyTransaction('customer', data.id, { type: 'adjustment', amount: Number(values.openingBalance), description: 'Opening Balance' });
  }
  if (!id && data) {
    try {
      const { addNotification, buildNewCustomerNotification } = await import('./notificationService.js');
      addNotification(buildNewCustomerNotification({
        id: data.id,
        customerName: data.name,
        phone: data.phone,
        date: data.created_at
      }));
    } catch (notifErr) {
      console.warn('Could not post customer notification:', notifErr);
    }
  }
  return customerToUI({ ...data, balance: id ? data.balance : Number(values.openingBalance || 0) });
}
export async function deleteCustomer(id) {
  const res = await softDeleteEntity('customer', id);
  invalidateCache('customers');
  return res;
}
export async function listSuppliers({ forceRefresh = false } = {}) {
  return getCachedOrFetch('suppliers', async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id,company_name,contact_person,phone,email,address,city,state,postal_code,gstin,status,credit_limit,balance,opening_balance,notes,metadata,created_at,updated_at')
      .is('deleted_at', null)
      .order('company_name');
    fail(error, 'Unable to load suppliers');
    return data || [];
  }, 10 * 60 * 1000, forceRefresh);
}
export function supplierToUI(s) { const given = Number(s.opening_balance ?? s.openingBalance ?? 0); return { id: s.id, companyName: s.company_name, contactPerson: s.contact_person || '', phone: s.phone || '', email: s.email || '', address: s.address || '', city: s.city || '', gstin: s.gstin || '', outstandingBalance: Number(s.balance || 0), givenAmount: given, openingBalance: given, creditLimit: Number(s.credit_limit || 0), status: s.status, productsSupplied: s.metadata?.productsSupplied || [], createdAt: s.created_at, updatedAt: s.updated_at, metadata: s.metadata || {} } }
export async function listUISuppliers({ forceRefresh = false } = {}) {
  const suppliers = (await listSuppliers({ forceRefresh })).map(supplierToUI);
  const ledger = await getRecentTransactionsLedger(forceRefresh);
  return suppliers.map(s => ({
    ...s,
    ledger: ledger.filter(x => x.reference_id === s.id).map(x => ({
      id: x.id,
      date: x.transaction_date || x.date,
      type: x.type,
      description: x.description,
      amount: Number(x.amount || 0),
      balanceAfter: null
    }))
  }));
}
function supplierRow(v) { const company = v.companyName?.trim() || v.name?.trim(); const given = Number(v.givenAmount ?? v.openingBalance ?? 0); return { name: company, company_name: company, contact_person: v.contactPerson?.trim() || null, phone: v.phone?.trim() || null, email: v.email?.trim() || null, address: v.address?.trim() || null, city: v.city?.trim() || null, state: v.state || null, postal_code: v.postalCode || null, gstin: v.gstin?.trim().toUpperCase() || null, status: v.status || 'active', credit_limit: Number(v.creditLimit || 0), opening_balance: given, notes: v.notes || null, metadata: { ...(v.metadata || {}), productsSupplied: v.productsSupplied || v.metadata?.productsSupplied || [] } } }
export async function saveSupplier(values, id) {
  const row = supplierRow(values);
  const totalReceived = Number(values.totalProductReceived || 0);
  const paid = Number(values.paidAmount ?? values.givenAmount ?? values.openingBalance ?? 0);
  const rest = totalReceived - paid;
  const recordDate = values.recordDateTime ? new Date(values.recordDateTime).toISOString() : new Date().toISOString();

  row.opening_balance = paid;
  if (!id) row.balance = rest;
  row.metadata = {
    ...(row.metadata || {}),
    totalProductReceived: totalReceived,
    paidAmount: paid,
    restAmount: rest,
    recordDateTime: recordDate
  };

  const query = id ? supabase.from('suppliers').update(row).eq('id', id) : supabase.from('suppliers').insert(row);
  const { data, error } = await query.select().single();
  fail(error, id ? 'Unable to update supplier' : 'Unable to create supplier');

  // Record payment transaction if paid amount is entered
  if (paid > 0) {
    try {
      await recordPartyTransaction('supplier', data.id, {
        type: 'payment',
        amount: paid,
        description: 'Given / Paid Amount',
        date: recordDate
      });
    } catch (_) { }
  }

  // If totalProductReceived is entered, sync purchase record for accurate ledger and totals
  if (totalReceived > 0) {
    try {
      const { data: existingPurchases } = await supabase
        .from('purchases')
        .select('id')
        .eq('supplier_id', data.id)
        .neq('status', 'deleted')
        .limit(1);

      if (existingPurchases && existingPurchases.length > 0) {
        await supabase
          .from('purchases')
          .update({
            total_amount: totalReceived,
            subtotal: totalReceived,
            purchase_date: recordDate,
            paid_amount: paid,
            due_amount: Math.max(0, rest),
            payment_status: paid >= totalReceived ? 'paid' : (paid > 0 ? 'partially_paid' : 'pending'),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPurchases[0].id);
      } else {
        await supabase
          .from('purchases')
          .insert({
            supplier_id: data.id,
            supplier_name: data.company_name || data.name,
            invoice_number: `REC-${Date.now().toString().slice(-6)}`,
            purchase_date: recordDate,
            subtotal: totalReceived,
            total_amount: totalReceived,
            paid_amount: paid,
            due_amount: Math.max(0, rest),
            payment_status: paid >= totalReceived ? 'paid' : (paid > 0 ? 'partially_paid' : 'pending'),
            status: 'completed',
            notes: 'Supplier product record',
            metadata: {
              isSupplierRecord: true,
              items: [{ product: values.productsSupplied?.[0] || 'Product Supply', quantity: 1, unit_price: totalReceived, total: totalReceived }]
            }
          });
      }
    } catch (_) { }
  }

  if (!id && data) {
    try {
      const { addNotification, buildNewSupplierNotification } = await import('./notificationService.js');
      addNotification(buildNewSupplierNotification({
        id: data.id,
        supplierName: data.company_name || data.name,
        contact: data.phone || data.contact_person,
        date: recordDate
      }));
    } catch (notifErr) {
      console.warn('Could not post supplier notification:', notifErr);
    }
  }
  invalidateCache('suppliers');
  return supplierToUI({ ...data, balance: rest, opening_balance: paid, metadata: row.metadata });
}
export async function deleteSupplier(id) {
  const res = await softDeleteEntity('supplier', id);
  invalidateCache('suppliers');
  return res;
}
export async function listLedger(partyType, partyId) { const { data, error } = await supabase.from('transactions').select('id, transaction_date, type, amount, description, bill_no, payment_mode, status, reference_id, supplier, utr_no, created_at').eq('reference_id', partyId).order('transaction_date', { ascending: false }).limit(100); fail(error, 'Unable to load ledger'); return data || [] }
export async function recordPartyTransaction(partyType, partyId, transaction) { const { data, error } = await supabase.rpc('record_party_transaction', { p_party_type: partyType, p_party_id: partyId, p_entry_type: transaction.type, p_amount: Number(transaction.amount), p_description: transaction.description, p_entry_date: transaction.date || new Date().toISOString() }); fail(error, 'Unable to record ledger transaction'); return data }
export async function deletePartyTransaction(transactionId, partyId, partyType = 'supplier') {
  const { data: txn } = await supabase
    .from('transactions')
    .select('id, amount, type')
    .eq('id', transactionId)
    .maybeSingle();

  const { error: delErr } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);
  fail(delErr, 'Unable to delete ledger entry');

  if (partyId) {
    try {
      const { data: remainingTxns } = await supabase
        .from('transactions')
        .select('id, amount, type, description')
        .eq('reference_id', partyId);

      const txns = remainingTxns || [];
      const paymentSum = txns
        .filter(t => t.type === 'payment' || (t.description || '').toLowerCase().includes('given') || (t.description || '').toLowerCase().includes('opening'))
        .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

      if (partyType === 'supplier') {
        const { data: supRow } = await supabase
          .from('suppliers')
          .select('id, balance, opening_balance, metadata')
          .eq('id', partyId)
          .maybeSingle();

        if (supRow) {
          const totalReceived = Number(supRow.metadata?.totalProductReceived || 0);
          const newRest = totalReceived - paymentSum;
          const updatedMeta = {
            ...(supRow.metadata || {}),
            paidAmount: paymentSum,
            restAmount: newRest
          };

          await supabase
            .from('suppliers')
            .update({
              balance: newRest,
              opening_balance: paymentSum,
              metadata: updatedMeta,
              updated_at: new Date().toISOString()
            })
            .eq('id', partyId);
        }

        const { data: supPurchases } = await supabase
          .from('purchases')
          .select('id, total_amount')
          .eq('supplier_id', partyId)
          .neq('status', 'deleted');
        if (supPurchases && supPurchases.length > 0) {
          for (const p of supPurchases) {
            const pTotal = Number(p.total_amount || 0);
            await supabase
              .from('purchases')
              .update({
                paid_amount: paymentSum,
                due_amount: Math.max(0, pTotal - paymentSum),
                payment_status: paymentSum >= pTotal ? 'paid' : (paymentSum > 0 ? 'partially_paid' : 'pending'),
                updated_at: new Date().toISOString()
              })
              .eq('id', p.id);
          }
        }
      } else if (partyType === 'customer') {
        const netCustBal = txns.reduce((sum, t) => {
          const amt = Number(t.amount || 0);
          return t.type === 'payment' ? sum - Math.abs(amt) : sum + Math.abs(amt);
        }, 0);
        await supabase
          .from('customers')
          .update({
            balance: netCustBal,
            updated_at: new Date().toISOString()
          })
          .eq('id', partyId);
      }
    } catch (balErr) {
      console.warn('Could not update party totals after transaction deletion:', balErr);
    }
  }

  return true;
}
export async function listExpenses({ forceRefresh = false } = {}) {
  return getCachedOrFetch('expenses', async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('id, expense_type, category, amount, description, payee, expense_date, payment_method, bill_number, metadata, created_at')
      .order('expense_date', { ascending: false })
      .limit(60);
    fail(error, 'Unable to load expenses');
    return data || [];
  }, 5 * 60 * 1000, forceRefresh);
}
export async function saveExpense(values, id) {
  const query = id ? supabase.from('expenses').update(values).eq('id', id) : supabase.from('expenses').insert(values);
  const { data, error } = await query.select().single();
  fail(error, 'Unable to save expense');
  invalidateCache('expenses');
  if (!id && data) {
    try {
      const { addNotification, buildExpenseNotification } = await import('./notificationService.js');
      addNotification(buildExpenseNotification({
        id: data.id,
        category: data.expense_type || data.category,
        amount: data.amount,
        description: data.description,
        date: data.expense_date || data.created_at
      }));
    } catch (notifErr) {
      console.warn('Could not post expense notification:', notifErr);
    }
  }
  return data;
}
export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  fail(error, 'Unable to delete expense');
  invalidateCache('expenses');
}
export async function listHeldBills({ forceRefresh = false } = {}) {
  return getCachedOrFetch('heldBills', async () => {
    const { data, error } = await supabase
      .from('held_bills')
      .select('id, label, totals, customer_id, held_by, held_at')
      .order('held_at', { ascending: false })
      .limit(50);
    fail(error, 'Unable to load held bills');
    return (data || []).map(row => ({
      ...row,
      cart: row.totals?.cart || row.cart || []
    }));
  }, 60 * 1000, forceRefresh);
}
export async function saveHeldBill(values) {
  const user = await requireSession();
  const totalsWithCart = {
    ...(values.totals || {}),
    cart: values.cart || values.totals?.cart || []
  };
  const { data, error } = await supabase.from('held_bills').insert({
    label: values.label || 'Walk-in',
    customer_id: values.customer_id || null,
    totals: totalsWithCart,
    held_by: user.id
  }).select('id, label, totals, customer_id, held_by, held_at').single();
  fail(error, 'Unable to hold bill');
  invalidateCache('heldBills');
  return {
    ...data,
    cart: totalsWithCart.cart
  };
}
export async function deleteHeldBill(id) {
  const { error } = await supabase.from('held_bills').delete().eq('id', id);
  fail(error, 'Unable to remove held bill');
  invalidateCache('heldBills');
}
export function getStoredBusinessSettings() {
  try {
    const raw = localStorage.getItem('businessSettings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const addr = parsed.shop?.address || '';
        // If address was missing or set to Lucknow, restore authentic Balaji Nagar address
        if (!addr || addr.toLowerCase().includes('lucknow')) {
          parsed.shop = {
            ...parsed.shop,
            shopName: 'GUPTA TRADERS & SUPERSTORE',
            address: 'Plot no. 12 Balaji Nagar, Narela Shankari, Near khedapati Mandir, Bhopal MP(462022)',
            city: 'Bhopal',
            state: 'Madhya Pradesh',
            pincode: '462022'
          };
          localStorage.setItem('businessSettings', JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) { }
  return {
    shop: {
      shopName: 'GUPTA TRADERS & SUPERSTORE',
      address: 'Plot no. 12 Balaji Nagar, Narela Shankari, Near khedapati Mandir, Bhopal MP(462022)',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462022',
      phone: '',
      email: ''
    },
    gst: {
      gstin: '09XXXXXXXXXXXXXXX'
    },
    invoice: {
      prefix: 'INV-',
      footer: 'Items sold after 10 days will not be returned',
      currency: 'INR'
    },
    printer: {}
  };
}

export async function getBusinessSettings() {
  const { data, error } = await supabase.from('settings').select('*').order('created_at').limit(1).single();
  fail(error, 'Unable to load settings');
  const rawAddress = data.shop_address || data.address;
  const safeAddress = (!rawAddress || rawAddress.toLowerCase().includes('lucknow'))
    ? 'Plot no. 12 Balaji Nagar, Narela Shankari, Near khedapati Mandir, Bhopal MP(462022)'
    : rawAddress;

  const res = {
    ...data,
    shop: {
      shopName: data.shop_name || 'GUPTA TRADERS & SUPERSTORE',
      address: safeAddress,
      city: data.city || 'Bhopal',
      state: data.state || 'Madhya Pradesh',
      pincode: data.pincode || '462022',
      phone: data.phone || '',
      email: data.email || ''
    },
    gst: {
      gstin: data.gst_number || '09XXXXXXXXXXXXXXX'
    },
    invoice: {
      prefix: data.invoice_prefix || 'INV-',
      footer: data.invoice_footer || 'Items sold after 10 days will not be returned',
      currency: data.currency || 'INR'
    },
    printer: data.printer_config || {}
  };
  try {
    localStorage.setItem('businessSettings', JSON.stringify(res));
  } catch (e) { }
  return res;
}

export async function saveBusinessSettings(values) {
  await requireSession();
  const current = await supabase.from('settings').select('id').order('created_at').limit(1).single();
  fail(current.error, 'Unable to load settings');
  const shop = values.shop || {}, gst = values.gst || {}, invoice = values.invoice || {};
  const row = {
    shop_name: shop.shopName,
    address: shop.address,
    shop_address: shop.address,
    phone: shop.phone,
    email: shop.email,
    gst_number: gst.gstin || gst.gstNumber,
    invoice_prefix: invoice.prefix,
    invoice_footer: invoice.footer,
    currency: invoice.currency,
    printer_config: values.printer
  };
  delete row.address;
  const { data, error } = await supabase.from('settings').update(row).eq('id', current.data.id).select().single();
  fail(error, 'Unable to save settings');
  try {
    const cached = getStoredBusinessSettings();
    const updated = {
      ...cached,
      shop: { ...cached.shop, ...shop },
      gst: { ...cached.gst, ...gst },
      invoice: { ...cached.invoice, ...invoice },
      printer: values.printer || cached.printer
    };
    localStorage.setItem('businessSettings', JSON.stringify(updated));
  } catch (e) { }
  return data;
}

// ─── Singleton Multiplexed Realtime Table Channel Registry ───
const activeTableChannels = new Map(); // table -> { channel, listeners: Set, debounceTimer, teardownTimer }

export function subscribeToTable(table, onChange) {
  if (!table || typeof onChange !== 'function') return () => { };

  let record = activeTableChannels.get(table);
  if (!record) {
    const listeners = new Set();
    let debounceTimer = null;
    let teardownTimer = null;

    const channel = supabase.channel(`erp:shared:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (table === 'products') {
          invalidateCache('products');
        } else if (table === 'inventory') {
          invalidateCache('inventory');
        } else if (table === 'stock_movements') {
          invalidateCache('movements');
        } else if (table === 'categories') {
          invalidateCache('categories');
        } else if (table === 'sales' || table === 'sale_items') {
          invalidateCache('sales');
        } else if (table === 'sales_returns') {
          invalidateCache('salesReturns');
          invalidateCache('sales');
        } else if (table === 'purchases' || table === 'purchase_items') {
          invalidateCache('purchases');
        } else if (table === 'purchase_returns') {
          invalidateCache('purchaseReturns');
          invalidateCache('purchases');
        } else if (table === 'customers') {
          invalidateCache('customers');
        } else if (table === 'suppliers') {
          invalidateCache('suppliers');
        } else if (table === 'expenses') {
          invalidateCache('expenses');
        } else if (table === 'held_bills') {
          invalidateCache('heldBills');
        }

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          listeners.forEach((listener) => {
            try {
              listener(payload);
            } catch (err) {
              console.error(`Error in realtime listener for ${table}:`, err);
            }
          });
        }, 800);
      })
      .subscribe();

    record = { channel, listeners, debounceTimer, teardownTimer };
    activeTableChannels.set(table, record);
  } else if (record.teardownTimer) {
    clearTimeout(record.teardownTimer);
    record.teardownTimer = null;
  }

  record.listeners.add(onChange);

  return () => {
    const current = activeTableChannels.get(table);
    if (!current) return;
    current.listeners.delete(onChange);
    if (current.listeners.size === 0) {
      if (current.teardownTimer) clearTimeout(current.teardownTimer);
      // Linger for 10s to avoid reconnect cycling on quick route changes
      current.teardownTimer = setTimeout(() => {
        if (current.listeners.size === 0) {
          if (current.debounceTimer) clearTimeout(current.debounceTimer);
          supabase.removeChannel(current.channel);
          activeTableChannels.delete(table);
        }
      }, 10000);
    }
  };
}

export async function listRecentNotificationActivities({ forceRefresh = false } = {}) {
  return getCachedOrFetch('recentActivities', async () => {
    const [purchases, purchaseReturns, sales, salesReturns, suppliers, lowStockProducts, newProducts, expenses, movements] = await Promise.all([
      supabase.from('purchases').select('id, supplier_invoice_number, invoice_number, total_amount, purchase_date, created_at, supplier:suppliers(company_name)').neq('status', 'deleted').order('created_at', { ascending: false }).limit(5),
      supabase.from('purchase_returns').select('id, return_number, total_amount, return_date, created_at, supplier:suppliers(company_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('sales').select('id, invoice_number, total_amount, sale_date, created_at, payment_method, customer:customers(name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('sales_returns').select('id, return_number, total_amount, return_date, created_at, sale:sales(invoice_number)').order('created_at', { ascending: false }).limit(5),
      supabase.from('suppliers').select('id, company_name, phone, contact_person, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id, name, unit, minimum_stock, inventory(quantity)').is('deleted_at', null).gt('minimum_stock', 0).limit(20),
      supabase.from('products').select('id, name, unit, created_at, inventory(quantity)').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      supabase.from('expenses').select('id, expense_type, amount, description, expense_date, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('stock_movements').select('id, product_id, quantity, reason, movement_type, product:products(name,unit)').in('movement_type', ['adjustment', 'reconciliation']).order('created_at', { ascending: false }).limit(5)
    ]);
    return {
      purchases: purchases.data || [],
      purchaseReturns: purchaseReturns.data || [],
      sales: sales.data || [],
      salesReturns: salesReturns.data || [],
      suppliers: suppliers.data || [],
      lowStockProducts: lowStockProducts.data || [],
      newProducts: newProducts.data || [],
      expenses: expenses.data || [],
      movements: movements.data || []
    };
  }, 5 * 60 * 1000, forceRefresh);
}
export async function softDeleteEntity(entityType, id) { const { error } = await supabase.rpc('soft_delete_entity', { p_entity_type: entityType, p_id: id }); fail(error, `Unable to move ${entityType} to trash`) }
export async function listTrash() {
  const { data, error } = await supabase
    .from('trash_items')
    .select('id, entity_type, entity_name, deleted_at, deleted_by, data')
    .order('deleted_at', { ascending: false })
    .limit(50);
  fail(error, 'Unable to load trash');
  return data || [];
}
export async function restoreTrashItem(entityType, id) { const { error } = await supabase.rpc('restore_entity', { p_entity_type: entityType, p_id: id }); fail(error, 'Unable to restore item') }
export async function permanentlyDeleteTrashItem(entityType, id) { const { error } = await supabase.rpc('permanently_delete_entity', { p_entity_type: entityType, p_id: id }); fail(error, 'Unable to permanently delete item') }
export async function emptyDatabaseTrash() { const { error } = await supabase.rpc('empty_trash'); fail(error, 'Unable to empty trash') }
export async function saveBarcodePrintJob(values) { const user = await requireSession(); const { data, error } = await supabase.from('barcode_print_jobs').insert({ ...values, printed_by: user.id }).select().single(); fail(error, 'Unable to save barcode print history'); return data }
export async function adminUsers(action, payload = {}) {
  // Direct Supabase Database and Auth operations
  if (action === 'list') {
    const { data: profiles, error: pe } = await supabase
      .from('profiles')
      .select('id, full_name, role_id, phone, status, is_active, created_at, updated_at, role:roles(name)')
      .order('created_at', { ascending: false });

    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    if (pe) {
      if (currentUser) {
        return [{
          id: currentUser.id,
          name: currentUser.user_metadata?.name || 'Admin User',
          email: currentUser.email || '',
          mobile: currentUser.phone || '',
          created_at: currentUser.created_at || new Date().toISOString(),
          role: 'admin',
          status: 'active'
        }];
      }
      fail(pe, 'Unable to load users');
    }

    if ((!profiles || profiles.length === 0) && currentUser) {
      return [{
        id: currentUser.id,
        name: currentUser.user_metadata?.name || 'Admin User',
        email: currentUser.email || '',
        mobile: currentUser.phone || '',
        created_at: currentUser.created_at || new Date().toISOString(),
        role: 'admin',
        status: 'active'
      }];
    }

    return (profiles || []).map((p) => {
      const isCurrent = currentUser && currentUser.id === p.id;
      let email = '';
      try {
        email = (isCurrent && currentUser.email) || localStorage.getItem(`user_email_${p.id}`) || '';
      } catch (_) { }

      if (!email) {
        if (p.phone && p.phone.includes('@')) {
          email = p.phone;
        } else if (p.phone) {
          email = `${p.phone}@guptatraders.local`;
        } else {
          email = `${(p.full_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@guptatraders.local`;
        }
      }

      return {
        ...p,
        id: p.id,
        name: p.full_name || 'Staff User',
        email,
        mobile: p.phone || '',
        created_at: p.created_at || new Date().toISOString(),
        role: p.role?.name?.toLowerCase() || 'cashier',
        status: p.is_active ? 'active' : 'inactive'
      };
    });
  }

  if (action === 'create') {
    const roleName = payload.role === 'admin' ? 'Admin' : 'Cashier';
    const { data: role, error: re } = await supabase
      .from('roles')
      .select('id')
      .ilike('name', roleName)
      .single();
    fail(re, 'Unable to resolve user role');

    let newUserId = null;
    if (payload.email && payload.password) {
      try {
        const anonClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
        );
        const { data: authData, error: authError } = await anonClient.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              name: payload.name,
              full_name: payload.name,
              phone: payload.mobile
            }
          }
        });
        if (!authError && authData?.user?.id) {
          newUserId = authData.user.id;
        }
      } catch (authErr) {
        console.warn('Auth user registration skipped/failed, creating profile directly:', authErr);
      }
    }

    if (!newUserId) {
      newUserId = crypto.randomUUID();
    }

    const { error: pe } = await supabase.from('profiles').upsert({
      id: newUserId,
      full_name: payload.name,
      phone: payload.mobile,
      role_id: role.id,
      is_active: (payload.status || 'active') === 'active'
    });
    fail(pe, 'Unable to create user profile');

    if (payload.email) {
      try {
        localStorage.setItem(`user_email_${newUserId}`, payload.email);
      } catch (_) { }
    }

    return { id: newUserId };
  }

  if (action === 'update') {
    const roleName = payload.role === 'admin' ? 'Admin' : 'Cashier';
    const { data: role, error: re } = await supabase
      .from('roles')
      .select('id')
      .ilike('name', roleName)
      .single();
    fail(re, 'Unable to resolve user role');

    const updateObj = {
      full_name: payload.name,
      phone: payload.mobile,
      role_id: role.id,
      is_active: payload.status === 'active'
    };

    const { error: pe } = await supabase
      .from('profiles')
      .update(updateObj)
      .eq('id', payload.id);
    fail(pe, 'Unable to update user profile');

    if (payload.email) {
      try {
        localStorage.setItem(`user_email_${payload.id}`, payload.email);
      } catch (_) { }
    }

    return { id: payload.id };
  }

  if (action === 'delete') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === payload.id) {
      throw new Error('You cannot delete your own account');
    }

    const { error: de } = await supabase.from('profiles').delete().eq('id', payload.id);
    if (de) {
      const { error: ue } = await supabase.from('profiles').update({ is_active: false }).eq('id', payload.id);
      fail(ue, 'Unable to delete or deactivate user');
    }

    try {
      localStorage.removeItem(`user_email_${payload.id}`);
    } catch (_) { }

    return { id: payload.id };
  }

  throw new Error(`Unknown user action: ${action}`);
}
export async function listRoles() { const { data, error } = await supabase.from('roles').select('*, role_permissions(*)').order('name'); fail(error, 'Unable to load roles'); return data.map(r => ({ ...r, role: r.name.toLowerCase(), permissions: { modules: (r.role_permissions || []).map(p => p.permission) } })) }
export async function updateRolePermissions(roleId, permissions) { if (typeof roleId === 'string' && !/^[0-9a-f-]{36}$/i.test(roleId)) { const { data, error } = await supabase.from('roles').select('id').ilike('name', roleId).single(); fail(error, 'Unable to resolve role'); roleId = data.id } const { error: de } = await supabase.from('role_permissions').delete().eq('role_id', roleId); fail(de, 'Unable to clear role permissions'); const rows = (permissions?.modules || permissions || []).map(permission => ({ role_id: roleId, permission })); if (rows.length) { const { error } = await supabase.from('role_permissions').insert(rows); fail(error, 'Unable to update role permissions') } return listRoles() }
export async function exportDatabaseBackup() { const tables = ['roles', 'role_permissions', 'profiles', 'categories', 'products', 'inventory', 'stock_movements', 'customers', 'suppliers', 'sales', 'sale_items', 'purchases', 'purchase_items', 'sales_returns', 'sale_return_items', 'purchase_returns', 'purchase_return_items', 'transactions', 'expenses', 'held_bills', 'held_bill_items', 'payments', 'settings']; const entries = await Promise.all(tables.map(async table => { const { data, error } = await supabase.from(table).select('*'); fail(error, `Unable to export ${table}`); return [table, data] })); return { app: 'Gupta Traders', format: 'supabase-existing-v1', createdAt: new Date().toISOString(), data: Object.fromEntries(entries) } }