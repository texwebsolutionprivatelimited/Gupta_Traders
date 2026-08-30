-- Party ledger compatibility RPC. The existing transactions table is the
-- The existing transactions table remains the authoritative ledger.
create or replace function public.record_party_transaction(p_party_type text,p_party_id uuid,p_entry_type text,p_amount numeric,p_description text,p_entry_date timestamptz default now()) returns numeric language plpgsql security definer set search_path=public as $$
declare v_balance numeric; v_id text; begin
  if not public.is_staff() then raise exception 'Authentication required'; end if;
  if p_party_type not in ('customer','supplier') or p_amount=0 then raise exception 'Invalid party transaction'; end if;
  if p_party_type='customer' then
    update public.customers set balance=coalesce(balance,opening_balance,0)+p_amount,updated_at=now() where id=p_party_id returning balance into v_balance;
  else
    update public.suppliers set balance=coalesce(balance,opening_balance,0)+p_amount,updated_at=now() where id=p_party_id returning balance into v_balance;
  end if;
  if v_balance is null then raise exception 'Party not found'; end if;
  v_id:=gen_random_uuid()::text;
  insert into public.transactions(id,transaction_date,type,amount,description,created_at,reference_id,name,status)
    values(v_id,p_entry_date,p_entry_type,p_amount,p_description,now(),p_party_id::text,case when p_party_type='customer' then 'customer' else 'supplier' end,'completed');
  return v_balance;
end $$;
revoke execute on function public.record_party_transaction(text,uuid,text,numeric,text,timestamptz) from public;
grant execute on function public.record_party_transaction(text,uuid,text,numeric,text,timestamptz) to authenticated;
