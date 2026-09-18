-- A one-off POS item belongs to its sale, but does not need a catalog product.
alter table public.sale_items alter column product_id drop not null;

create or replace function public.complete_sale(p_sale jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
  v_no text;
  v jsonb;
  p public.products%rowtype;
  stock numeric;
  v_subtotal numeric := 0;
  tax_total numeric := 0;
  qty numeric;
  price numeric;
  disc numeric;
  rate numeric;
  item_name text;
  item_unit text;
  product_id uuid;
begin
  if not public.is_staff() then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A sale must contain at least one item';
  end if;
  v_no := coalesce(nullif(p_sale->>'invoice_number', ''), 'INV-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(nextval('sale_invoice_seq')::text, 6, '0'));

  insert into public.sales(id, customer_id, invoice_number, sale_date, subtotal, discount, tax, total_amount, paid_amount, due_amount, payment_status, payment_method, payment_reference, notes, sold_by, status)
  values(v_id, nullif(p_sale->>'customer_id', '')::uuid, v_no, coalesce((p_sale->>'sale_date')::timestamptz, now()), 0, coalesce((p_sale->>'discount')::numeric, 0), 0, 0, coalesce((p_sale->>'paid_amount')::numeric, 0), 0, coalesce(p_sale->>'payment_status', 'paid'), p_sale->>'payment_method', p_sale->>'payment_reference', p_sale->>'notes', auth.uid(), 'completed');

  for v in select * from jsonb_array_elements(p_items) loop
    qty := (v->>'quantity')::numeric;
    price := (v->>'unit_price')::numeric;
    disc := coalesce((v->>'discount')::numeric, 0);
    if qty is null or qty <= 0 then raise exception 'Invalid sale quantity'; end if;

    if coalesce((v->>'is_custom')::boolean, false) then
      product_id := null;
      item_name := nullif(btrim(v->>'product_name'), '');
      item_unit := coalesce(nullif(btrim(v->>'unit'), ''), 'Pcs');
      rate := coalesce((v->>'tax_rate')::numeric, 0);
      if item_name is null then raise exception 'Custom item name is required'; end if;
    else
      product_id := (v->>'product_id')::uuid;
      select * into p from public.products where id = product_id and is_active and coalesce(status, 'active') = 'active' and deleted_at is null for share;
      if not found then raise exception 'Product not found or inactive'; end if;
      price := coalesce(price, (v->>'selling_price')::numeric, p.selling_price);
      item_name := p.name;
      item_unit := p.unit;
      rate := coalesce(p.gst_rate, 0);
      select quantity into stock from public.inventory where public.inventory.product_id = p.id for update;
      if coalesce(stock, 0) < qty then raise exception 'Insufficient stock for %', p.name; end if;
    end if;

    if price is null or price < 0 or disc < 0 or disc > qty * price or rate < 0 or rate > 100 then
      raise exception 'Invalid sale item price, discount, or tax rate';
    end if;

    insert into public.sale_items(sale_id, product_id, quantity, selling_price, discount, tax, total, product_name, sku, unit, unit_price, tax_rate, tax_amount, line_total)
    values(v_id, product_id, qty, price, disc, round((qty * price - disc) * rate / 100, 2), round(qty * price - disc, 2), item_name, case when product_id is null then null else p.sku end, item_unit, price, rate, round((qty * price - disc) * rate / 100, 2), round(qty * price - disc, 2));

    v_subtotal := v_subtotal + qty * price - disc;
    tax_total := tax_total + (qty * price - disc) * rate / 100;
    if product_id is not null then
      update public.inventory set quantity = quantity - qty, available_quantity = greatest(0, quantity - qty - coalesce(reserved_quantity, 0)), updated_at = now() where public.inventory.product_id = p.id;
      insert into public.stock_movements(product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
      values(p.id, 'sale', -qty, 'sale', v_id, 'POS sale', auth.uid());
    end if;
  end loop;

  update public.sales
  set subtotal = round(v_subtotal, 2), tax = round(tax_total, 2), tax_amount = round(tax_total, 2),
      total_amount = round(v_subtotal + tax_total - coalesce((p_sale->>'discount')::numeric, 0), 2),
      due_amount = greatest(0, round(v_subtotal + tax_total - coalesce((p_sale->>'discount')::numeric, 0), 2) - coalesce((p_sale->>'paid_amount')::numeric, 0))
  where id = v_id;
  return jsonb_build_object('id', v_id, 'invoice_number', v_no);
end
$$;
