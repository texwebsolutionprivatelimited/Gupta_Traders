import { supabase } from './supabase'

const SYNC_QUEUE_KEY = 'gt_sync_queue'

// UUID generator
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// ─── Field Mappings (LocalStorage <-> Supabase) ───────────────

function mapProductToSupabase(p) {
  if (!p.supabase_id) p.supabase_id = generateUUID()
  return {
    id: p.supabase_id,
    name: p.name || '',
    barcode: p.barcode || '',
    sku: p.id || '', // Map local ID (PKG-0001) to sku
    unit: p.unit || 'Piece',
    purchase_price: Number(p.purchasePrice) || 0,
    selling_price: Number(p.sellingPrice) || 0,
    gst_rate: Number(p.gstRate) || 0,
    created_at: p.createdAt || new Date().toISOString()
  }
}

function mapProductFromSupabase(row) {
  const isLoose = (row.sku || '').startsWith('LOOSE')
  return {
    id: row.sku || (isLoose ? `LOOSE-${row.id.slice(-4).toUpperCase()}` : `PKG-${row.id.slice(-4).toUpperCase()}`),
    supabase_id: row.id,
    type: isLoose ? 'loose' : 'packaged',
    name: row.name,
    nameHi: '',
    barcode: row.barcode,
    sku: row.sku,
    brand: 'General',
    unit: row.unit,
    packSize: `1 ${row.unit}`,
    purchasePrice: Number(row.purchase_price) || 0,
    sellingPrice: Number(row.selling_price) || 0,
    gstRate: Number(row.gst_rate) || 0,
    currentStock: 0,
    minStock: 10,
    createdAt: row.created_at
  }
}

function mapCustomerToSupabase(c) {
  if (!c.supabase_id) c.supabase_id = generateUUID()
  return {
    id: c.supabase_id,
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    created_at: c.createdAt || new Date().toISOString()
  }
}

function mapCustomerFromSupabase(row) {
  return {
    id: `CUST-${row.id.slice(-4).toUpperCase()}`,
    supabase_id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    outstandingBalance: 0,
    createdAt: row.created_at
  }
}

function mapSupplierToSupabase(s) {
  if (!s.supabase_id) s.supabase_id = generateUUID()
  return {
    id: s.supabase_id,
    name: s.companyName || s.name || '',
    phone: s.phone || '',
    email: s.email || '',
    created_at: s.createdAt || new Date().toISOString()
  }
}

function mapSupplierFromSupabase(row) {
  return {
    id: `SUP-${row.id.slice(-4).toUpperCase()}`,
    supabase_id: row.id,
    companyName: row.name,
    contactPerson: 'General Contact',
    phone: row.phone,
    email: row.email,
    outstandingBalance: 0,
    createdAt: row.created_at
  }
}

function mapExpenseToSupabase(e) {
  if (!e.supabase_id) e.supabase_id = generateUUID()
  return {
    id: e.supabase_id,
    description: e.description || '',
    amount: Number(e.amount) || 0,
    created_at: e.createdAt || new Date().toISOString()
  }
}

function mapExpenseFromSupabase(row) {
  return {
    id: `EXP-${row.id.slice(-4).toUpperCase()}`,
    supabase_id: row.id,
    description: row.description,
    amount: Number(row.amount) || 0,
    category: 'others',
    date: row.created_at.split('T')[0],
    createdAt: row.created_at
  }
}

// Helper to get raw storage key
const getStorageKey = (table) => {
  const map = {
    products: 'gt_products',
    customers: 'gt_customers',
    suppliers: 'gt_suppliers',
    expenses: 'gt_expenses'
  }
  return map[table]
}

// ─── Queue Manager ─────────────────────────────────────────────

export function queueSync(table, action, data) {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
    
    // Ensure supabase_id exists on local object
    if (!data.supabase_id) {
      data.supabase_id = generateUUID()
      // Write back to LocalStorage immediately
      const storageKey = getStorageKey(table)
      if (storageKey) {
        const localItems = JSON.parse(localStorage.getItem(storageKey) || '[]')
        const idx = localItems.findIndex(x => x.id === data.id)
        if (idx !== -1) {
          localItems[idx].supabase_id = data.supabase_id
          localStorage.setItem(storageKey, JSON.stringify(localItems))
        }
      }
    }

    queue.push({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      table,
      action,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0
    })
    
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gt_sync_queue_changed'))
    }

    // Trigger background processing
    processSyncQueue()
  } catch (e) {
    console.error('Failed to queue sync change:', e)
  }
}

let isProcessing = false

export async function processSyncQueue() {
  if (isProcessing) return
  isProcessing = true

  try {
    let queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
    if (queue.length === 0) {
      isProcessing = false
      return
    }

    console.log(`[Supabase Sync] Processing queue of ${queue.length} items...`)

    // Loop through queue sequentially
    while (queue.length > 0) {
      const item = queue[0]
      item.attempts++

      let success = false
      let fatal = false // if true, item is discarded due to schema or static constraint issues

      try {
        const table = item.table
        const action = item.action
        const payload = item.data

        if (action === 'insert' || action === 'update') {
          let mappedRow
          if (table === 'products') mappedRow = mapProductToSupabase(payload)
          else if (table === 'customers') mappedRow = mapCustomerToSupabase(payload)
          else if (table === 'suppliers') mappedRow = mapSupplierToSupabase(payload)
          else if (table === 'expenses') mappedRow = mapExpenseToSupabase(payload)

          if (mappedRow) {
            // Upsert queries in postgREST can handle both insert & update using merge
            const { error } = await supabase.from(table).upsert([mappedRow])
            if (error) {
              console.warn(`[Supabase Sync] Error during upsert to ${table}:`, error.message)
              if (error.message.includes('RLS') || error.message.includes('violates row-level security')) {
                // Keep it in queue until user is logged in
                success = false
              } else if (error.message.includes('column') || error.message.includes('syntax')) {
                // Schema mismatch - fatal, discard to avoid stuck queue
                fatal = true
              }
            } else {
              success = true
            }
          } else {
            fatal = true // No mapper found
          }
        } else if (action === 'delete') {
          if (payload.supabase_id) {
            const { error } = await supabase.from(table).delete().eq('id', payload.supabase_id)
            if (error) {
              console.warn(`[Supabase Sync] Error deleting from ${table}:`, error.message)
              if (error.message.includes('RLS') || error.message.includes('row-level security')) {
                success = false
              } else {
                fatal = true
              }
            } else {
              success = true
            }
          } else {
            success = true // Omit if no remote id exists
          }
        }
      } catch (err) {
        console.error('[Supabase Sync] Error processing queue item:', err)
      }

      if (success || fatal) {
        // Remove item from queue
        queue.shift()
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gt_sync_queue_changed'))
        }
      } else {
        // Non-fatal error (network down or auth RLS block) - pause queue
        break
      }
    }
  } catch (e) {
    console.error('[Supabase Sync] Error in loop:', e)
  } finally {
    isProcessing = false
  }
}

// ─── Bidirectional Pull Sync (Supabase -> LocalStorage) ──────

export async function pullSupabaseData() {
  if (isPulling) return
  isPulling = true
  try {
    console.log('[Supabase Sync] Initializing pull sync...')
    const tables = ['products', 'customers', 'suppliers', 'expenses']
    let syncSuccessful = false
    
    for (const table of tables) {
      const storageKey = getStorageKey(table)
      if (!storageKey) continue

      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.log(`[Supabase Sync] Skipping pull for ${table} (RLS protected or offline):`, error.message)
        continue
      }

      syncSuccessful = true

      // Initialize local storage table keys to empty list if not already present
      // This signals that sync was successful and we pulled a clean database.
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, '[]')
      }

      if (!data || data.length === 0) continue

      const localItems = JSON.parse(localStorage.getItem(storageKey) || '[]')
      let updated = false

      data.forEach(row => {
        // Map from Supabase
        let remoteObj
        if (table === 'products') remoteObj = mapProductFromSupabase(row)
        else if (table === 'customers') remoteObj = mapCustomerFromSupabase(row)
        else if (table === 'suppliers') remoteObj = mapSupplierFromSupabase(row)
        else if (table === 'expenses') remoteObj = mapExpenseFromSupabase(row)

        if (!remoteObj) return

        const localIdx = localItems.findIndex(x => 
          (x.supabase_id === row.id) || 
          (table === 'products' && x.id === row.sku)
        )

        if (localIdx === -1) {
          // Add new record locally
          localItems.push(remoteObj)
          updated = true
        } else {
          // Merge remote update with local-only fields preserved
          const merged = {
            ...localItems[localIdx],
            ...remoteObj,
            // Preserve specific values if they are more detailed locally
            brand: localItems[localIdx].brand !== 'General' ? localItems[localIdx].brand : remoteObj.brand,
            nameHi: localItems[localIdx].nameHi || remoteObj.nameHi,
            currentStock: localItems[localIdx].currentStock !== undefined ? localItems[localIdx].currentStock : remoteObj.currentStock
          }
          localItems[localIdx] = merged
          updated = true
        }
      })

      if (updated) {
        localStorage.setItem(storageKey, JSON.stringify(localItems))
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(`gt_${table}_updated`))
        }
      }
    }
    
    if (syncSuccessful) {
      localStorage.setItem('gt_sync_initialized', 'true')
    }
    console.log('[Supabase Sync] Pull sync complete!')
  } catch (err) {
    console.error('[Supabase Sync] Pull sync failed:', err)
  } finally {
    isPulling = false
  }
}

// ─── Realtime Changes handler ────────────────────────────────
function handleRemoteChange(table, payload) {
  const storageKey = getStorageKey(table)
  if (!storageKey) return

  try {
    const localItems = JSON.parse(localStorage.getItem(storageKey) || '[]')
    let updated = false

    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const row = payload.new
      let remoteObj
      if (table === 'products') remoteObj = mapProductFromSupabase(row)
      else if (table === 'customers') remoteObj = mapCustomerFromSupabase(row)
      else if (table === 'suppliers') remoteObj = mapSupplierFromSupabase(row)
      else if (table === 'expenses') remoteObj = mapExpenseFromSupabase(row)

      if (!remoteObj) return

      const idx = localItems.findIndex(x => 
        (x.supabase_id === row.id) || 
        (table === 'products' && x.id === row.sku)
      )

      if (idx === -1) {
        localItems.push(remoteObj)
        updated = true
      } else {
        // Merge remote update with local-only fields preserved
        const merged = {
          ...localItems[idx],
          ...remoteObj,
        }
        if (table === 'products') {
          merged.brand = localItems[idx].brand !== 'General' ? localItems[idx].brand : remoteObj.brand
          merged.nameHi = localItems[idx].nameHi || remoteObj.nameHi
          merged.currentStock = localItems[idx].currentStock !== undefined ? localItems[idx].currentStock : remoteObj.currentStock
        }
        localItems[idx] = merged
        updated = true
      }
    } else if (payload.eventType === 'DELETE') {
      const row = payload.old
      const idx = localItems.findIndex(x => x.supabase_id === row.id)
      if (idx !== -1) {
        localItems.splice(idx, 1)
        updated = true
      }
    }

    if (updated) {
      localStorage.setItem(storageKey, JSON.stringify(localItems))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(`gt_${table}_updated`))
      }
    }
  } catch (err) {
    console.error(`[Supabase Realtime] Error handling remote change for ${table}:`, err)
  }
}

let activeChannels = []
let isSyncInitialized = false
let isPulling = false

export function initRealtimeSubscription() {
  console.log('[Supabase Realtime] Subscribing to postgres changes...')
  const tables = ['products', 'customers', 'suppliers', 'expenses']
  
  // Clean up any existing channels to prevent duplicate subscription errors during Hot Module Replacement (HMR)
  activeChannels.forEach(channel => {
    try {
      supabase.removeChannel(channel)
    } catch (err) {
      console.warn('[Supabase Realtime] Error cleaning up channel:', err)
    }
  })
  activeChannels = []
  
  tables.forEach(table => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          console.log(`[Supabase Realtime] Change received for ${table}:`, payload)
          handleRemoteChange(table, payload)
        }
      )
      
    channel.subscribe((status) => {
      console.log(`[Supabase Realtime] Subscription status for ${table}:`, status)
    })
    
    activeChannels.push(channel)
  })
}

// ─── Main Init Entrypoint ─────────────────────────────────────

export function initSyncManager() {
  if (isSyncInitialized) {
    console.log('[Supabase Sync] Sync Manager already initialized, skipping duplicate init.')
    return
  }
  isSyncInitialized = true

  console.log('[Supabase Sync] Sync Manager Initialized.')
  
  // 1. Trigger initial pull
  pullSupabaseData()

  // 2. Trigger background loop processing
  processSyncQueue()

  // 3. Start realtime subscription
  initRealtimeSubscription()

  // 4. Set interval for processing queue periodically (e.g. every 15s)
  setInterval(() => {
    processSyncQueue()
  }, 15000)
}
