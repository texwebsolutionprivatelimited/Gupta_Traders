INSERT INTO public.inventory (product_id, quantity, available_quantity, reserved_quantity, updated_at)
SELECT 
  p.id,
  50,    -- default stock quantity
  50,    -- available quantity
  0,     -- reserved quantity
  now()  -- updated_at
FROM public.products p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.inventory i WHERE i.product_id = p.id
  )
ON CONFLICT (product_id) DO UPDATE SET
  quantity = 50,
  available_quantity = 50,
  reserved_quantity = 0,
  updated_at = now();
