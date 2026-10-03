-- Remove dummy test purchases and dummy suppliers

-- 1. Remove dummy test purchases and any linked records
delete from public.payments where purchase_id in (
  select id from public.purchases where invoice_number = 'TEST-PUR-999' or lower(coalesce(supplier_name, '')) = 'aggarwal flour mills'
);
delete from public.purchase_items where purchase_id in (
  select id from public.purchases where invoice_number = 'TEST-PUR-999' or lower(coalesce(supplier_name, '')) = 'aggarwal flour mills'
);
delete from public.purchases where invoice_number = 'TEST-PUR-999' or lower(coalesce(supplier_name, '')) = 'aggarwal flour mills';

-- 2. Clean any dependent records and remove dummy suppliers:
-- (Rahul Sharma, Amit Gupta with placeholder phone 9876543210 & GSTIN 09ABCDE1234F1Z5, and barcode 0039616070991)
delete from public.transactions where reference_id in (
  select id::text from public.suppliers where phone = '9876543210' or name in ('Rahul Sharma', 'Amit Gupta', '0039616070991')
);
delete from public.suppliers where phone = '9876543210' or name in ('Rahul Sharma', 'Amit Gupta', '0039616070991');
