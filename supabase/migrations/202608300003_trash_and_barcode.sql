-- Additive trash, barcode audit, return RPCs, and role-aware RLS for the
-- existing Gupta_Traders tables.
alter table public.products add column if not exists deleted_at timestamptz, add column if not exists deleted_by uuid references public.profiles(id);
alter table public.categories add column if not exists deleted_at timestamptz, add column if not exists deleted_by uuid references public.profiles(id);
alter table public.customers add column if not exists deleted_at timestamptz, add column if not exists deleted_by uuid references public.profiles(id);
alter table public.suppliers add column if not exists deleted_at timestamptz, add column if not exists deleted_by uuid references public.profiles(id);

create table if not exists public.barcode_print_jobs (
  id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id), product_name text not null,
  barcode text not null, quantity_printed integer not null check(quantity_printed>0), printed_by uuid not null references public.profiles(id), printed_at timestamptz not null default now()
);

create or replace function public.complete_sales_return(p_return jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid:=gen_random_uuid(); v_no text; v jsonb; si public.sale_items%rowtype; qty numeric; prev numeric; total numeric:=0; stock numeric;
begin
  if not public.is_manager() then raise exception 'Insufficient permission'; end if;
  v_no:=coalesce(nullif(p_return->>'return_number',''),'SR-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('sales_return_seq')::text,6,'0'));
  insert into public.sales_returns(id,return_number,sale_id,customer_id,return_date,total_amount,reason,processed_by,subtotal,tax_amount,refund_method,notes)
    values(v_id,v_no,nullif(p_return->>'sale_id','')::uuid,nullif(p_return->>'customer_id','')::uuid,now(),0,p_return->>'reason',auth.uid(),0,0,p_return->>'refund_method',p_return->>'notes');
  for v in select * from jsonb_array_elements(p_items) loop
    select * into si from public.sale_items where id=(v->>'sale_item_id')::uuid for update;
    if not found then raise exception 'Sale item not found'; end if;
    qty:=(v->>'quantity')::numeric; select coalesce(sum(quantity),0) into prev from public.sale_return_items where sale_item_id=si.id;
    if qty<=0 or prev+qty>si.quantity then raise exception 'Return exceeds sold quantity'; end if;
    insert into public.sale_return_items(sales_return_id,sale_item_id,product_id,quantity,price,total,unit_price,line_total) values(v_id,si.id,si.product_id,qty,si.selling_price,round(qty*si.selling_price,2),si.selling_price,round(qty*si.selling_price,2));
    total:=total+qty*si.selling_price;
    update public.inventory set quantity=quantity+qty,available_quantity=available_quantity+qty,updated_at=now() where product_id=si.product_id returning quantity into stock;
    insert into public.stock_movements(product_id,movement_type,quantity,reference_type,reference_id,notes,created_by) values(si.product_id,'sales_return',qty,'sales_return',v_id,'Sales return',auth.uid());
  end loop;
  update public.sales_returns set subtotal=total,total_amount=total where id=v_id;
  return jsonb_build_object('id',v_id,'return_number',v_no,'total_amount',total);
end $$;

create sequence if not exists public.sales_return_seq;
create sequence if not exists public.purchase_return_seq;

create or replace function public.complete_purchase_return(p_return jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid:=gen_random_uuid(); v_no text; v jsonb; pi public.purchase_items%rowtype; qty numeric; prev numeric; stock numeric; total numeric:=0;
begin
  if not public.is_manager() then raise exception 'Insufficient permission'; end if;
  v_no:=coalesce(nullif(p_return->>'return_number',''),'PR-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(nextval('purchase_return_seq')::text,6,'0'));
  insert into public.purchase_returns(id,return_number,purchase_id,supplier_id,return_date,total_amount,reason,processed_by,subtotal,tax_amount,refund_method,notes)
    values(v_id,v_no,nullif(p_return->>'purchase_id','')::uuid,nullif(p_return->>'supplier_id','')::uuid,now(),0,p_return->>'reason',auth.uid(),0,0,p_return->>'refund_method',p_return->>'notes');
  for v in select * from jsonb_array_elements(p_items) loop
    select * into pi from public.purchase_items where id=(v->>'purchase_item_id')::uuid for update;
    if not found then raise exception 'Purchase item not found'; end if;
    qty:=(v->>'quantity')::numeric; select coalesce(sum(quantity),0) into prev from public.purchase_return_items where purchase_item_id=pi.id; select quantity into stock from public.inventory where product_id=pi.product_id for update;
    if qty<=0 or prev+qty>pi.quantity or coalesce(stock,0)<qty then raise exception 'Invalid purchase return quantity'; end if;
    insert into public.purchase_return_items(purchase_return_id,purchase_item_id,product_id,quantity,price,total,unit_price,line_total) values(v_id,pi.id,pi.product_id,qty,pi.purchase_price,round(qty*pi.purchase_price,2),pi.purchase_price,round(qty*pi.purchase_price,2));
    total:=total+qty*pi.purchase_price;
    update public.inventory set quantity=quantity-qty,available_quantity=greatest(0,available_quantity-qty),updated_at=now() where product_id=pi.product_id returning quantity into stock;
    insert into public.stock_movements(product_id,movement_type,quantity,reference_type,reference_id,notes,created_by) values(pi.product_id,'purchase_return',-qty,'purchase_return',v_id,'Purchase return',auth.uid());
  end loop;
  update public.purchase_returns set subtotal=total,total_amount=total where id=v_id;
  return jsonb_build_object('id',v_id,'return_number',v_no,'total_amount',total);
end $$;

create or replace function public.soft_delete_entity(p_entity_type text,p_id uuid) returns void language plpgsql security definer set search_path=public as $$begin if not public.is_manager() then raise exception 'Insufficient permission'; end if; if p_entity_type not in ('product','category','customer','supplier') then raise exception 'Unsupported trash entity'; end if; execute format('update public.%I set deleted_at=now(),deleted_by=$1 where id=$2',case when p_entity_type='category' then 'categories' else p_entity_type||'s' end) using auth.uid(),p_id; end$$;
create or replace function public.restore_entity(p_entity_type text,p_id uuid) returns void language plpgsql security definer set search_path=public as $$begin if not public.is_manager() then raise exception 'Insufficient permission'; end if; if p_entity_type not in ('product','category','customer','supplier') then raise exception 'Unsupported trash entity'; end if; execute format('update public.%I set deleted_at=null,deleted_by=null where id=$1',case when p_entity_type='category' then 'categories' else p_entity_type||'s' end) using p_id; end$$;
-- Permanent deletion is intentionally disabled. Existing records remain
-- recoverable through restore_entity and deployment never removes data.
create or replace function public.permanently_delete_entity(p_entity_type text,p_id uuid) returns void language plpgsql security definer set search_path=public as $$begin raise exception 'Permanent deletion is disabled; use restore_entity'; end$$;
create or replace function public.empty_trash() returns void language plpgsql security definer set search_path=public as $$begin raise exception 'Emptying trash is disabled; restore or retain soft-deleted records'; end$$;

create or replace view public.trash_items as
select 'product' entity_type,id,name entity_name,deleted_at,deleted_by,to_jsonb(p) data from public.products p where deleted_at is not null
union all select 'category',id,name,deleted_at,deleted_by,to_jsonb(c) from public.categories c where deleted_at is not null
union all select 'customer',id,name,deleted_at,deleted_by,to_jsonb(cu) from public.customers cu where deleted_at is not null
union all select 'supplier',id,coalesce(company_name,name),deleted_at,deleted_by,to_jsonb(s) from public.suppliers s where deleted_at is not null;

alter table public.barcode_print_jobs enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='barcode_print_jobs' and policyname='barcode_jobs_read') then create policy barcode_jobs_read on public.barcode_print_jobs for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='barcode_print_jobs' and policyname='barcode_jobs_insert') then create policy barcode_jobs_insert on public.barcode_print_jobs for insert to authenticated with check(public.is_staff() and printed_by=auth.uid()); end if;
end $$;
grant execute on function public.complete_sales_return(jsonb,jsonb),public.complete_purchase_return(jsonb,jsonb),public.soft_delete_entity(text,uuid),public.restore_entity(text,uuid),public.permanently_delete_entity(text,uuid),public.empty_trash() to authenticated;

-- Existing permissive policies are tightened in place where known; other
-- tables receive role-aware policies. No policy/table/data is dropped.
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sales_returns enable row level security;
alter table public.sale_return_items enable row level security;
alter table public.purchase_returns enable row level security;
alter table public.purchase_return_items enable row level security;
alter table public.transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.held_bills enable row level security;
alter table public.held_bill_items enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;
alter table public.role_permissions enable row level security;

alter policy "Allow authenticated users" on public.products to authenticated using(public.is_staff()) with check(public.is_manager());
alter policy "Enable read/write for all users on purchase_items" on public.purchase_items to authenticated using(public.is_staff()) with check(public.is_manager());
alter policy "Allow insert purchase returns" on public.purchase_returns to authenticated with check(public.is_manager());
alter policy "Allow all" on public.purchases to authenticated using(public.is_staff()) with check(public.is_manager());
alter policy "Enable read/write for all users on purchases" on public.purchases to authenticated using(public.is_staff()) with check(public.is_manager());
alter policy "Enable read/write for all users on transactions" on public.transactions to authenticated using(public.is_staff()) with check(public.is_manager());

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='categories' and policyname='erp_categories_read') then create policy erp_categories_read on public.categories for select to authenticated using(public.is_staff() and deleted_at is null); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='categories' and policyname='erp_categories_write') then create policy erp_categories_write on public.categories for all to authenticated using(public.is_manager()) with check(public.is_manager()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='erp_profiles_read') then create policy erp_profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_manager()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='roles' and policyname='erp_roles_read') then create policy erp_roles_read on public.roles for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='role_permissions' and policyname='erp_role_permissions_read') then create policy erp_role_permissions_read on public.role_permissions for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='role_permissions' and policyname='erp_role_permissions_write') then create policy erp_role_permissions_write on public.role_permissions for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='erp_profiles_admin') then create policy erp_profiles_admin on public.profiles for all to authenticated using(public.is_admin()) with check(public.is_admin()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='erp_customers_read') then create policy erp_customers_read on public.customers for select to authenticated using(public.is_staff() and deleted_at is null); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='customers' and policyname='erp_customers_write') then create policy erp_customers_write on public.customers for all to authenticated using(public.is_manager()) with check(public.is_manager()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='suppliers' and policyname='erp_suppliers_read') then create policy erp_suppliers_read on public.suppliers for select to authenticated using(public.is_staff() and deleted_at is null); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='suppliers' and policyname='erp_suppliers_write') then create policy erp_suppliers_write on public.suppliers for all to authenticated using(public.is_manager()) with check(public.is_manager()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='inventory' and policyname='erp_inventory_read') then create policy erp_inventory_read on public.inventory for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='stock_movements' and policyname='erp_stock_read') then create policy erp_stock_read on public.stock_movements for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sales' and policyname='erp_sales_read') then create policy erp_sales_read on public.sales for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sale_items' and policyname='erp_sale_items_read') then create policy erp_sale_items_read on public.sale_items for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='purchase_returns' and policyname='erp_purchase_returns_read') then create policy erp_purchase_returns_read on public.purchase_returns for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sales_returns' and policyname='erp_sales_returns_read') then create policy erp_sales_returns_read on public.sales_returns for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='expenses' and policyname='erp_expenses_read') then create policy erp_expenses_read on public.expenses for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='held_bills' and policyname='erp_held_bills_read') then create policy erp_held_bills_read on public.held_bills for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='settings' and policyname='erp_settings_read') then create policy erp_settings_read on public.settings for select to authenticated using(public.is_staff()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='settings' and policyname='erp_settings_write') then create policy erp_settings_write on public.settings for update to authenticated using(public.is_manager()) with check(public.is_manager()); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='payments' and policyname='erp_payments_read') then create policy erp_payments_read on public.payments for select to authenticated using(public.is_staff()); end if;
end $$;
