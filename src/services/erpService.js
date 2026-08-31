import { supabase } from '../supabase/supabase'

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
  const { data, error } = await supabase.from('profiles').select('*, role:roles(*)').eq('id', user.id).single()
  fail(error, 'Unable to load user profile')
  if (!data?.role_id || !data?.role) throw new Error('This account has no ERP role. Ask an administrator to assign one.')
  if (!data.is_active) throw new Error('This ERP account is inactive.')
  return { ...data, name: data.full_name, status: data.is_active ? 'active' : 'inactive', role: data.role.name.toLowerCase(), email: user.email }
}

export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').is('deleted_at',null).order('sort_order').order('name')
  fail(error, 'Unable to load categories'); return data
}
export async function createCategory(values) {
  const row = { slug: values.slug || values.id || values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), name: values.name.trim(), description: values.description || '', icon: values.icon || null, color: values.color || null, image_url: values.image || values.image_url || null, status: values.status || 'active', sort_order: values.sortOrder || 0 }
  const { data, error } = await supabase.from('categories').insert(row).select().single(); fail(error, 'Unable to create category'); return data
}
export async function updateCategory(id, values) { const row={...values}; if('image' in row){row.image_url=row.image;delete row.image} if(row.sortOrder!==undefined){row.sort_order=row.sortOrder;delete row.sortOrder} const { data, error } = await supabase.from('categories').update(row).eq('id', id).select().single(); fail(error, 'Unable to update category'); return data }
export async function removeCategory(id) { return softDeleteEntity('category',id) }

const productSelect = '*, category:categories(*), inventory(quantity,reserved_quantity,updated_at)'
export async function listProducts({ search = '', categoryId, status = 'active' } = {}) {
  let query = supabase.from('products').select(productSelect).is('deleted_at',null).order('name')
  if (status) query = query.eq('status', status)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (search.trim()) { const q = search.trim().replace(/[,%()]/g, ' '); query = query.or(`name.ilike.%${q}%,hindi_name.ilike.%${q}%,barcode.ilike.%${q}%,sku.ilike.%${q}%,brand.ilike.%${q}%`) }
  const { data, error } = await query; fail(error, 'Unable to load products'); return data
}
export function productToUI(row) { const inv=Array.isArray(row.inventory)?row.inventory[0]:row.inventory; return { id:row.id, supabase_id:row.id, productCode:row.product_code||'', sku:row.sku||'', barcode:row.barcode||'', name:row.name, nameHi:row.hindi_name||'', categoryId:row.category_id, category:row.category?.slug||'', categoryName:row.category?.name||'', brand:row.brand||'', packSize:row.pack_size||'', unit:row.unit, purchasePrice:Number(row.purchase_price), sellingPrice:Number(row.selling_price), gstRate:Number(row.gst_rate), type:row.product_type, minStock:Number(row.minimum_stock), currentStock:Number(inv?.quantity||0), stock:Number(inv?.quantity||0), image:row.image_url||'', looseUnit:row.loose_unit, looseConversionFactor:row.loose_conversion_factor, hsnCode:row.hsn_code, description:row.description||'', status:row.status, metadata:row.metadata||{}, createdAt:row.created_at, updatedAt:row.updated_at } }
export async function listUIProducts(filters={}) { return (await listProducts(filters)).map(productToUI) }
export async function createProduct(values) {
  const stock = Number(values.currentStock ?? values.stock ?? 0)
  const row = mapProduct(values); if(!row.category_id && values.category){const {data:category,error:categoryError}=await supabase.from('categories').select('id').eq('slug',values.category).single();fail(categoryError,'Unable to resolve product category');row.category_id=category.id} const { data, error } = await supabase.from('products').insert(row).select().single(); fail(error, 'Unable to create product')
  if (stock > 0) { const { error: stockError } = await supabase.rpc('change_stock', { p_product_id: data.id, p_delta: stock, p_type: 'opening', p_reason: 'Opening stock' }); fail(stockError, 'Product created but opening stock failed') }
  return data
}
export async function updateProduct(id, values) {
  const row = mapProduct(values, true)
  if (!row.category_id && values.category) {
    const { data: category, error: categoryError } = await supabase.from('categories').select('id').eq('slug', values.category).single()
    fail(categoryError, 'Unable to resolve product category')
    row.category_id = category.id
  }
  const { data, error } = await supabase.from('products').update(row).eq('id', id).select(productSelect).single()
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

  const { data: refetched, error: refetchError } = await supabase.from('products').select(productSelect).eq('id', id).single()
  fail(refetchError, 'Unable to reload updated product details')
  return refetched
}
export async function removeProduct(id) { return softDeleteEntity('product',id) }
function mapProduct(v, partial = false) {
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
    selling_price: v.sellingPrice === undefined && v.selling_price === undefined ? undefined : Number(v.sellingPrice ?? v.selling_price ?? 0),
    gst_rate: v.gstRate === undefined && v.gst_rate === undefined ? undefined : Number(v.gstRate ?? v.gst_rate ?? 0),
    product_type: v.type === undefined && v.product_type === undefined ? undefined : (v.type || v.product_type || 'packaged'),
    minimum_stock: v.minStock === undefined && v.minimum_stock === undefined ? undefined : Number(v.minStock ?? v.minimum_stock ?? 0),
    image_url: v.image === undefined && v.image_url === undefined ? undefined : (v.image || v.image_url),
    loose_unit: v.looseUnit,
    loose_conversion_factor: v.looseConversionFactor,
    hsn_code: v.hsnCode,
    description: v.description,
    status: v.status === undefined ? undefined : (v.status || 'active'),
    metadata: v.metadata === undefined ? undefined : (v.metadata || {})
  }
  if (partial) Object.keys(row).forEach(k => row[k] === undefined && delete row[k]); return row
}

export async function adjustStock(productId, delta, type = 'adjustment', reason = '') { const { data, error } = await supabase.rpc('change_stock', { p_product_id:productId, p_delta:Number(delta), p_type:type, p_reason:reason }); fail(error, 'Unable to update stock'); return data }
export async function listInventoryMovements() { const {data,error}=await supabase.from('stock_movements').select('*, product:products(name,sku,barcode)').order('created_at',{ascending:false}).limit(1000); fail(error,'Unable to load inventory ledger'); return data }
export async function setMinimumStock(productId, minimum) { const {data,error}=await supabase.from('products').update({minimum_stock:Number(minimum)}).eq('id',productId).select().single(); fail(error,'Unable to update minimum stock'); return data }
export async function completeSale(sale, items) { await requireSession(); const { data, error } = await supabase.rpc('complete_sale', { p_sale:sale, p_items:items }); fail(error, 'Unable to complete sale'); return data }
export async function completePurchase(purchase, items) { await requireSession(); const { data, error } = await supabase.rpc('complete_purchase', { p_purchase:purchase, p_items:items }); fail(error, 'Unable to complete purchase'); return data }
export async function completeSalesReturn(ret, items) { const { data, error } = await supabase.rpc('complete_sales_return', { p_return:ret, p_items:items }); fail(error, 'Unable to complete sales return'); return data }
export async function completePurchaseReturn(ret, items) { const { data, error } = await supabase.rpc('complete_purchase_return', { p_return:ret, p_items:items }); fail(error, 'Unable to complete purchase return'); return data }

export async function listSales() { const { data,error }=await supabase.from('sales').select('*, customer:customers(*), items:sale_items(*)').order('sale_date',{ascending:false}); fail(error,'Unable to load sales'); return data }
export async function listPurchases() { const { data,error }=await supabase.from('purchases').select('*, supplier:suppliers(*), items:purchase_items(*)').order('purchase_date',{ascending:false}); fail(error,'Unable to load purchases'); return data }
export async function listUISales(){return(await listSales()).map(s=>({id:s.id,date:s.sale_date,customer:s.customer?.name||'Walk-in Customer',invoice:s.invoice_number,items:(s.items||[]).map(i=>({...i,product:i.product_name||i.product,salesPrice:Number(i.unit_price||i.selling_price),gst:Number(i.tax_rate||i.tax),quantity:Number(i.quantity)})),itemCount:s.items?.length||0,subtotal:Number(s.subtotal),gst:Number(s.tax_amount??s.tax),discount:Number(s.discount),total:Number(s.total_amount),status:s.status==='completed'?'Completed':s.status,payment:s.payment_status==='paid'?'Paid':'Pending',paymentMode:s.payment_method,notes:s.notes,createdAt:s.created_at}))}
export async function listUIPurchases(){return(await listPurchases()).map(p=>({id:p.id,date:p.purchase_date,supplier:p.supplier?.company_name||p.supplier?.name||'Unknown Supplier',invoice:p.invoice_number,billNo:p.supplier_invoice_number||p.invoice_number,items:(p.items||[]).map(i=>({...i,product:i.product_name||i.product,purchasePrice:Number(i.unit_price||i.purchase_price),gst:Number(i.tax_rate||i.tax),quantity:Number(i.quantity)})),itemCount:p.items?.length||0,subtotal:Number(p.subtotal),gst:Number(p.tax_amount??p.tax),discount:Number(p.discount),total:Number(p.total_amount),status:p.status==='completed'?'Completed':p.status,payment:p.payment_status==='paid'?'Paid':'Pending',paymentMode:p.payment_method,notes:p.notes,createdAt:p.created_at}))}
export async function listCustomers() { const { data,error }=await supabase.from('customers').select('*').is('deleted_at',null).order('name'); fail(error,'Unable to load customers'); return data }
export function customerToUI(c){return{id:c.id,name:c.name,phone:c.phone||'',email:c.email||'',address:c.address||'',city:c.city||'',gstin:c.gstin||c.gst_number||'',customerType:c.customer_type||'retail',creditLimit:Number(c.credit_limit||0),outstandingBalance:Number(c.balance??c.opening_balance??0),status:c.status||'active',profilePic:c.profile_image_url||'',createdAt:c.created_at,updatedAt:c.updated_at,metadata:c.metadata||{}}}
export async function listUICustomers(){const customers=(await listCustomers()).map(customerToUI);const {data:ledger,error}=await supabase.from('transactions').select('*').order('transaction_date',{ascending:false});fail(error,'Unable to load customer ledgers');return customers.map(c=>({...c,ledger:ledger.filter(x=>x.reference_id===c.id).map(x=>({id:x.id,date:x.transaction_date||x.date,type:x.type,description:x.description,amount:Number(x.amount||0),balanceAfter:null}))}))}
function customerRow(v){return{name:v.name?.trim(),phone:v.phone?.trim()||null,email:v.email?.trim()||null,address:v.address?.trim()||null,city:v.city?.trim()||null,state:v.state||null,postal_code:v.postalCode||null,gstin:v.gstin?.trim().toUpperCase()||null,customer_type:v.customerType||'retail',credit_limit:Number(v.creditLimit||0),status:v.status||'active',profile_image_url:v.profilePic||null,notes:v.notes||null,metadata:v.metadata||{}}}
export async function saveCustomer(values,id) { const row=customerRow(values);if(!id)row.balance=0;const query=id?supabase.from('customers').update(row).eq('id',id):supabase.from('customers').insert(row); const {data,error}=await query.select().single(); fail(error,id?'Unable to update customer':'Unable to create customer');if(!id&&Number(values.openingBalance)){await recordPartyTransaction('customer',data.id,{type:'adjustment',amount:Number(values.openingBalance),description:'Opening Balance'})} return customerToUI({...data,balance:id?data.balance:Number(values.openingBalance||0)}) }
export async function deleteCustomer(id) { return softDeleteEntity('customer',id) }
export async function listSuppliers() { const { data,error }=await supabase.from('suppliers').select('*').is('deleted_at',null).order('company_name'); fail(error,'Unable to load suppliers'); return data }
export function supplierToUI(s){return{id:s.id,companyName:s.company_name,contactPerson:s.contact_person||'',phone:s.phone||'',email:s.email||'',address:s.address||'',city:s.city||'',gstin:s.gstin||'',outstandingBalance:Number(s.balance),creditLimit:Number(s.credit_limit),status:s.status,productsSupplied:s.metadata?.productsSupplied||[],createdAt:s.created_at,updatedAt:s.updated_at,metadata:s.metadata||{}}}
export async function listUISuppliers(){const suppliers=(await listSuppliers()).map(supplierToUI);const {data:ledger,error}=await supabase.from('transactions').select('*').order('transaction_date',{ascending:false});fail(error,'Unable to load supplier ledgers');return suppliers.map(s=>({...s,ledger:ledger.filter(x=>x.reference_id===s.id).map(x=>({id:x.id,date:x.transaction_date||x.date,type:x.type,description:x.description,amount:Number(x.amount||0),balanceAfter:null}))}))}
function supplierRow(v){const company=v.companyName?.trim()||v.name?.trim();return{name:company,company_name:company,contact_person:v.contactPerson?.trim()||null,phone:v.phone?.trim()||null,email:v.email?.trim()||null,address:v.address?.trim()||null,city:v.city?.trim()||null,state:v.state||null,postal_code:v.postalCode||null,gstin:v.gstin?.trim().toUpperCase()||null,status:v.status||'active',credit_limit:Number(v.creditLimit||0),notes:v.notes||null,metadata:{...(v.metadata||{}),productsSupplied:v.productsSupplied||v.metadata?.productsSupplied||[]}}}
export async function saveSupplier(values,id) { const row=supplierRow(values);if(!id)row.balance=0;const query=id?supabase.from('suppliers').update(row).eq('id',id):supabase.from('suppliers').insert(row); const {data,error}=await query.select().single(); fail(error,id?'Unable to update supplier':'Unable to create supplier');if(!id&&Number(values.openingBalance)){await recordPartyTransaction('supplier',data.id,{type:'adjustment',amount:Number(values.openingBalance),description:'Opening Balance'})} return supplierToUI({...data,balance:id?data.balance:Number(values.openingBalance||0)}) }
export async function deleteSupplier(id) { return softDeleteEntity('supplier',id) }
export async function listLedger(partyType,partyId) { const {data,error}=await supabase.from('transactions').select('*').eq('reference_id',partyId).order('transaction_date',{ascending:false}); fail(error,'Unable to load ledger'); return data }
export async function recordPartyTransaction(partyType,partyId,transaction){const {data,error}=await supabase.rpc('record_party_transaction',{p_party_type:partyType,p_party_id:partyId,p_entry_type:transaction.type,p_amount:Number(transaction.amount),p_description:transaction.description,p_entry_date:transaction.date||new Date().toISOString()});fail(error,'Unable to record ledger transaction');return data}
export async function listExpenses() { const {data,error}=await supabase.from('expenses').select('*').order('expense_date',{ascending:false}); fail(error,'Unable to load expenses'); return data }
export async function saveExpense(values,id) { const query=id?supabase.from('expenses').update(values).eq('id',id):supabase.from('expenses').insert(values); const {data,error}=await query.select().single(); fail(error,'Unable to save expense'); return data }
export async function deleteExpense(id) { const {error}=await supabase.from('expenses').delete().eq('id',id); fail(error,'Unable to delete expense') }
export async function listHeldBills() { const {data,error}=await supabase.from('held_bills').select('*').order('held_at',{ascending:false}); fail(error,'Unable to load held bills'); return data }
export async function saveHeldBill(values) { const user=await requireSession(); const {data,error}=await supabase.from('held_bills').insert({...values,held_by:user.id}).select().single(); fail(error,'Unable to hold bill'); return data }
export async function deleteHeldBill(id) { const {error}=await supabase.from('held_bills').delete().eq('id',id); fail(error,'Unable to remove held bill') }
export async function getBusinessSettings() { const {data,error}=await supabase.from('settings').select('*').order('created_at').limit(1).single(); fail(error,'Unable to load settings'); return {...data,shop:{shopName:data.shop_name||'',address:data.shop_address||'',phone:data.phone||'',email:data.email||''},gst:{gstin:data.gst_number||''},invoice:{prefix:data.invoice_prefix||'INV',footer:data.invoice_footer||'',currency:data.currency||'INR'},printer:data.printer_config||{}} }
export async function saveBusinessSettings(values) { await requireSession(); const current=await supabase.from('settings').select('id').order('created_at').limit(1).single(); fail(current.error,'Unable to load settings'); const shop=values.shop||{},gst=values.gst||{},invoice=values.invoice||{}; const row={shop_name:shop.shopName,address:shop.address,shop_address:shop.address,phone:shop.phone,email:shop.email,gst_number:gst.gstin||gst.gstNumber,invoice_prefix:invoice.prefix,invoice_footer:invoice.footer,currency:invoice.currency,printer_config:values.printer}; delete row.address; const {data,error}=await supabase.from('settings').update(row).eq('id',current.data.id).select().single(); fail(error,'Unable to save settings'); return data }

export function subscribeToTable(table, onChange) { const channel=supabase.channel(`erp:${table}:${Math.random().toString(36).slice(2)}`).on('postgres_changes',{event:'*',schema:'public',table},onChange).subscribe(); return ()=>supabase.removeChannel(channel) }
export async function softDeleteEntity(entityType,id){const {error}=await supabase.rpc('soft_delete_entity',{p_entity_type:entityType,p_id:id});fail(error,`Unable to move ${entityType} to trash`)}
export async function listTrash(){const {data,error}=await supabase.from('trash_items').select('*').order('deleted_at',{ascending:false});fail(error,'Unable to load trash');return data}
export async function restoreTrashItem(entityType,id){const {error}=await supabase.rpc('restore_entity',{p_entity_type:entityType,p_id:id});fail(error,'Unable to restore item')}
export async function permanentlyDeleteTrashItem(entityType,id){const {error}=await supabase.rpc('permanently_delete_entity',{p_entity_type:entityType,p_id:id});fail(error,'Unable to permanently delete item')}
export async function emptyDatabaseTrash(){const {error}=await supabase.rpc('empty_trash');fail(error,'Unable to empty trash')}
export async function saveBarcodePrintJob(values){const user=await requireSession();const {data,error}=await supabase.from('barcode_print_jobs').insert({...values,printed_by:user.id}).select().single();fail(error,'Unable to save barcode print history');return data}
export async function adminUsers(action,payload={}){const {data,error}=await supabase.functions.invoke('admin-users',{body:{action,...payload}});fail(error,'User administration failed');if(data?.error)throw new Error(data.error);return data?.data}
export async function listRoles(){const {data,error}=await supabase.from('roles').select('*, role_permissions(*)').order('name');fail(error,'Unable to load roles');return data.map(r=>({...r,role:r.name.toLowerCase(),permissions:{modules:(r.role_permissions||[]).map(p=>p.permission)}}))}
export async function updateRolePermissions(roleId,permissions){if(typeof roleId==='string'&&!/^[0-9a-f-]{36}$/i.test(roleId)){const {data,error}=await supabase.from('roles').select('id').ilike('name',roleId).single();fail(error,'Unable to resolve role');roleId=data.id}const {error:de}=await supabase.from('role_permissions').delete().eq('role_id',roleId);fail(de,'Unable to clear role permissions');const rows=(permissions?.modules||permissions||[]).map(permission=>({role_id:roleId,permission}));if(rows.length){const {error}=await supabase.from('role_permissions').insert(rows);fail(error,'Unable to update role permissions')}return listRoles()}
export async function exportDatabaseBackup(){const tables=['roles','role_permissions','profiles','categories','products','inventory','stock_movements','customers','suppliers','sales','sale_items','purchases','purchase_items','sales_returns','sale_return_items','purchase_returns','purchase_return_items','transactions','expenses','held_bills','held_bill_items','payments','settings'];const entries=await Promise.all(tables.map(async table=>{const{data,error}=await supabase.from(table).select('*');fail(error,`Unable to export ${table}`);return[table,data]}));return{app:'Gupta Traders',format:'supabase-existing-v1',createdAt:new Date().toISOString(),data:Object.fromEntries(entries)}}
