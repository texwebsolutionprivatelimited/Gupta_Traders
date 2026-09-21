-- Product Return & Refund Migration

create sequence if not exists public.sales_return_seq;

alter table public.sales_returns enable row level security;
alter table public.sale_return_items enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sales_returns' and policyname='erp_sales_returns_read') then
    create policy erp_sales_returns_read on public.sales_returns for select to authenticated using(public.is_staff());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sales_returns' and policyname='erp_sales_returns_write') then
    create policy erp_sales_returns_write on public.sales_returns for all to authenticated using(public.is_staff()) with check(public.is_staff());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sale_return_items' and policyname='erp_sale_return_items_read') then
    create policy erp_sale_return_items_read on public.sale_return_items for select to authenticated using(public.is_staff());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sale_return_items' and policyname='erp_sale_return_items_write') then
    create policy erp_sale_return_items_write on public.sale_return_items for all to authenticated using(public.is_staff()) with check(public.is_staff());
  end if;
end $$;

create or replace function public.complete_sales_return(p_return jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_no text;
  v jsonb;
  s public.sales%rowtype;
  si public.sale_items%rowtype;
  v_return_date timestamptz;
  v_subtotal numeric := 0;
  v_tax_total numeric := 0;
  v_total numeric := 0;
  qty numeric;
  prev_returned numeric;
  item_price numeric;
  item_tax_rate numeric;
  item_subtotal numeric;
  item_tax numeric;
  item_total numeric;
  total_sold_qty numeric := 0;
  total_ret_qty numeric := 0;
begin
  if not public.is_staff() then
    raise exception 'Authentication and staff permissions required';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Return must contain at least one item';
  end if;

  select * into s from public.sales where id = nullif(p_return->>'sale_id', '')::uuid for update;
  if not found then
    raise exception 'Original sales invoice not found';
  end if;

  v_return_date := coalesce((p_return->>'return_date')::timestamptz, now());

  -- Strict 7-day return policy validation
  if (v_return_date::date - s.sale_date::date) > 7 then
    raise exception 'Products sold can only be returned within 7 days of purchase. Purchase date: %, Return date: %',
      to_char(s.sale_date, 'YYYY-MM-DD'), to_char(v_return_date, 'YYYY-MM-DD');
  end if;

  if (v_return_date::date < s.sale_date::date) then
    raise exception 'Return date cannot be earlier than the original sale date (%)', to_char(s.sale_date, 'YYYY-MM-DD');
  end if;

  v_no := coalesce(
    nullif(p_return->>'return_number', ''),
    'SR-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(nextval('sales_return_seq')::text, 6, '0')
  );

  insert into public.sales_returns(
    id, return_number, sale_id, customer_id, return_date,
    total_amount, subtotal, tax_amount, reason, refund_method, notes, processed_by
  ) values (
    v_id, v_no, s.id, s.customer_id, v_return_date,
    0, 0, 0, p_return->>'reason', coalesce(p_return->>'refund_method', 'Cash'), p_return->>'notes', auth.uid()
  );

  for v in select * from jsonb_array_elements(p_items) loop
    select * into si from public.sale_items
    where id = (v->>'sale_item_id')::uuid and sale_id = s.id
    for update;

    if not found then
      raise exception 'Sale item not found on this invoice';
    end if;

    qty := (v->>'quantity')::numeric;
    if qty is null or qty <= 0 then
      raise exception 'Invalid return quantity';
    end if;

    select coalesce(sum(quantity), 0) into prev_returned
    from public.sale_return_items
    where sale_item_id = si.id;

    if prev_returned + qty > si.quantity then
      raise exception 'Return quantity (%) exceeds remaining returnable quantity (%) for %',
        qty, (si.quantity - prev_returned), coalesce(si.product_name, 'item');
    end if;

    item_price := coalesce(si.unit_price, si.selling_price, 0);
    item_tax_rate := coalesce(si.tax_rate, 0);

    -- Calculate prorated refund amount matching original line total if provided
    if (v->>'line_total') is not null and (v->>'line_total')::numeric > 0 then
      item_total := round((v->>'line_total')::numeric, 2);
      if item_tax_rate > 0 then
        item_subtotal := round(item_total / (1 + (item_tax_rate / 100)), 2);
        item_tax := item_total - item_subtotal;
      else
        item_subtotal := item_total;
        item_tax := 0;
      end if;
    else
      item_subtotal := round(qty * item_price, 2);
      item_tax := round(item_subtotal * item_tax_rate / 100, 2);
      item_total := item_subtotal + item_tax;
    end if;

    insert into public.sale_return_items(
      sales_return_id, sale_item_id, product_id, quantity, price, unit_price, tax_rate, tax_amount, line_total, total
    ) values (
      v_id, si.id, si.product_id, qty, item_price, item_price, item_tax_rate, item_tax, item_total, item_total
    );

    v_subtotal := v_subtotal + item_subtotal;
    v_tax_total := v_tax_total + item_tax;
    v_total := v_total + item_total;

    -- Replenish stock to inventory if this was a catalog product
    if si.product_id is not null then
      insert into public.inventory(product_id, quantity, available_quantity)
      values (si.product_id, qty, qty)
      on conflict (product_id) do update set
        quantity = inventory.quantity + excluded.quantity,
        available_quantity = inventory.available_quantity + excluded.available_quantity,
        updated_at = now();

      insert into public.stock_movements(
        product_id, movement_type, quantity, reference_type, reference_id, notes, created_by
      ) values (
        si.product_id, 'sales_return', qty, 'sales_return', v_id,
        'Sales return ' || v_no || ' for ' || s.invoice_number, auth.uid()
      );
    end if;
  end loop;

  -- Update return header totals
  update public.sales_returns
  set subtotal = round(v_subtotal, 2),
      tax_amount = round(v_tax_total, 2),
      total_amount = round(v_total, 2)
  where id = v_id;

  -- Record payment refund transaction
  insert into public.payments(
    sale_id, customer_id, payment_type, payment_method, amount, reference_number, payment_date, notes
  ) values (
    s.id, s.customer_id, 'refund', coalesce(p_return->>'refund_method', 'Cash'),
    round(v_total, 2), v_no, v_return_date, 'Refund for Sales Return ' || v_no
  );

  -- Evaluate if sale is fully or partially returned
  select
    coalesce(sum(si2.quantity), 0),
    coalesce(sum(sri2.quantity), 0)
  into total_sold_qty, total_ret_qty
  from public.sale_items si2
  left join public.sale_return_items sri2 on sri2.sale_item_id = si2.id
  where si2.sale_id = s.id;

  if total_ret_qty >= total_sold_qty and total_sold_qty > 0 then
    update public.sales set status = 'returned' where id = s.id;
  elsif total_ret_qty > 0 then
    update public.sales set status = 'partially_returned' where id = s.id;
  end if;

  return jsonb_build_object(
    'id', v_id,
    'return_number', v_no,
    'sale_id', s.id,
    'invoice_number', s.invoice_number,
    'total_amount', round(v_total, 2),
    'subtotal', round(v_subtotal, 2),
    'tax_amount', round(v_tax_total, 2),
    'refund_method', coalesce(p_return->>'refund_method', 'Cash'),
    'return_date', v_return_date
  );
end;
$$;

grant execute on function public.complete_sales_return(jsonb, jsonb) to authenticated;
