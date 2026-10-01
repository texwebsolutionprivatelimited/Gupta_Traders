-- 1. Remove all previously generated receipt records / POS sales bills and dependent records
delete from public.sale_return_items;
delete from public.sales_returns;
delete from public.sale_items;
delete from public.payments where sale_id is not null or lower(payment_type) = 'sale';
delete from public.transactions where lower(type) = 'sale';
delete from public.held_bill_items;
delete from public.held_bills;
delete from public.barcode_print_jobs;
delete from public.sales;

-- 2. Reset sale invoice sequence so future bills start cleanly
alter sequence if exists public.sale_invoice_seq restart with 1;
alter sequence if exists public.sales_return_seq restart with 1;

-- 3. Add optimization indexes to prevent full table scans and reduce egress
create index if not exists idx_sales_sale_date on public.sales(sale_date desc);
create index if not exists idx_sales_customer_id on public.sales(customer_id);
create index if not exists idx_purchases_purchase_date on public.purchases(purchase_date desc);
create index if not exists idx_purchases_supplier_id on public.purchases(supplier_id);
create index if not exists idx_expenses_expense_date on public.expenses(expense_date desc);
create index if not exists idx_stock_movements_created on public.stock_movements(created_at desc);
create index if not exists idx_stock_movements_product_id on public.stock_movements(product_id);
create index if not exists idx_transactions_party on public.transactions(reference_id, transaction_date desc);