-- Allow nullable product_id in return items and held bills if product is permanently purged
alter table public.sale_return_items alter column product_id drop not null;
alter table public.purchase_return_items alter column product_id drop not null;
alter table public.held_bill_items alter column product_id drop not null;

-- Enable permanent deletion of trash entities
create or replace function public.permanently_delete_entity(p_entity_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text;
begin
  if not (
    current_user in ('postgres', 'service_role')
    or coalesce((select auth.role()), '') = 'service_role'
    or public.is_manager()
    or public.is_staff()
  ) then
    raise exception 'Insufficient permission';
  end if;

  v_type := lower(trim(p_entity_type));
  if v_type in ('products', 'product') then
    -- Remove dependent records first to satisfy FK constraints
    delete from public.held_bill_items where product_id = p_id;
    delete from public.stock_movements where product_id = p_id;
    delete from public.inventory where product_id = p_id;
    update public.barcode_print_jobs set product_id = null where product_id = p_id;
    update public.sale_items set product_id = null where product_id = p_id;
    update public.purchase_items set product_id = null where product_id = p_id;
    update public.sale_return_items set product_id = null where product_id = p_id;
    update public.purchase_return_items set product_id = null where product_id = p_id;
    delete from public.products where id = p_id;

  elsif v_type in ('categories', 'category') then
    update public.products set category_id = null where category_id = p_id;
    delete from public.categories where id = p_id;

  elsif v_type in ('customers', 'customer') then
    update public.sales set customer_id = null where customer_id = p_id;
    update public.sales_returns set customer_id = null where customer_id = p_id;
    update public.payments set customer_id = null where customer_id = p_id;
    update public.held_bills set customer_id = null where customer_id = p_id;
    delete from public.transactions where reference_id = p_id;
    delete from public.customers where id = p_id;

  elsif v_type in ('suppliers', 'supplier') then
    update public.purchases set supplier_id = null where supplier_id = p_id;
    update public.purchase_returns set supplier_id = null where supplier_id = p_id;
    update public.payments set supplier_id = null where supplier_id = p_id;
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'supplier_payments') then
      update public.supplier_payments set supplier_id = null where supplier_id = p_id;
    end if;
    delete from public.transactions where reference_id = p_id;
    delete from public.suppliers where id = p_id;

  else
    raise exception 'Unsupported trash entity: %', p_entity_type;
  end if;
end;
$$;

-- Enable emptying trash bin
create or replace function public.empty_trash()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if not (
    current_user in ('postgres', 'service_role')
    or coalesce((select auth.role()), '') = 'service_role'
    or public.is_manager()
    or public.is_staff()
  ) then
    raise exception 'Insufficient permission';
  end if;

  for r in select entity_type, id from public.trash_items loop
    perform public.permanently_delete_entity(r.entity_type, r.id);
  end loop;
end;
$$;

grant execute on function public.permanently_delete_entity(text, uuid) to authenticated;
grant execute on function public.empty_trash() to authenticated;
