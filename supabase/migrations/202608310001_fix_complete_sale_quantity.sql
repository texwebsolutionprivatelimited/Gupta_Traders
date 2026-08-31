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
  total numeric := 0;
  tax_total numeric := 0;
  qty numeric;
  price numeric;
  disc numeric;
begin
  if not public.is_staff() then raise exception 'Authentication required'; end if;
  v_no := coalesce(nullif(p_sale->>'invoice_number', ''), 'INV-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(nextval('sale_invoice_seq')::text, 6, '0'));

  insert into public.sales(id, customer_id, invoice_number, sale_date, subtotal, discount, tax, total_amount, paid_amount, due_amount, payment_status, payment_method, payment_reference, notes, sold_by, status)
  values(v_id, nullif(p_sale->>'customer_id', '')::uuid, v_no, coalesce((p_sale->>'sale_date')::timestamptz, now()), 0, coalesce((p_sale->>'discount')::numeric, 0), 0, 0, coalesce((p_sale->>'paid_amount')::numeric, 0), 0, coalesce(p_sale->>'payment_status', 'paid'), p_sale->>'payment_method', p_sale->>'payment_reference', p_sale->>'notes', auth.uid(), 'completed');

  for v in select * from jsonb_array_elements(p_items) loop
    select * into p from public.products where id = (v->>'product_id')::uuid and is_active and coalesce(status, 'active') = 'active' and deleted_at is null for share;
    if not found then raise exception 'Product not found or inactive'; end if;
    qty := (v->>'quantity')::numeric;
    price := coalesce((v->>'unit_price')::numeric, (v->>'selling_price')::numeric, p.selling_price);
    disc := coalesce((v->>'discount')::numeric, 0);
    if qty <= 0 then raise exception 'Invalid sale quantity'; end if;
    select quantity into stock from public.inventory where product_id = p.id for update;
    if coalesce(stock, 0) < qty then raise exception 'Insufficient stock for %', p.name; end if;

    insert into public.sale_items(sale_id, product_id, quantity, selling_price, discount, tax, total, product_name, sku, unit, unit_price, tax_rate, tax_amount, line_total)
    values(v_id, p.id, qty, price, disc, coalesce((v->>'tax')::numeric, 0), round(qty * price - disc, 2), p.name, p.sku, p.unit, price, p.gst_rate, round(qty * price * p.gst_rate / 100, 2), round(qty * price - disc, 2));

    total := total + qty * price - disc;
    tax_total := tax_total + qty * price * p.gst_rate / 100;
    update public.inventory set quantity = quantity - qty, available_quantity = greatest(0, quantity - qty - coalesce(reserved_quantity, 0)), updated_at = now() where product_id = p.id;
    insert into public.stock_movements(product_id, movement_type, quantity, reference_type, reference_id, notes, created_by) values(p.id, 'sale', -qty, 'sale', v_id, 'POS sale', auth.uid());
  end loop;

  update public.sales set subtotal = round(total, 2), tax = round(tax_total, 2), tax_amount = round(tax_total, 2), total_amount = round(total + tax_total - coalesce((p_sale->>'discount')::numeric, 0), 2), due_amount = greatest(0, round(total + tax_total - coalesce((p_sale->>'discount')::numeric, 0), 2) - coalesce((p_sale->>'paid_amount')::numeric, 0)) where id = v_id;
  return jsonb_build_object('id', v_id, 'invoice_number', v_no);
end
$$;
