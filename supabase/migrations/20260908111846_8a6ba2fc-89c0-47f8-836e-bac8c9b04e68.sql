CREATE OR REPLACE FUNCTION public.process_balance_transaction(p_user_id uuid, p_admin_id uuid, p_transaction_type text, p_amount numeric, p_crypto_symbol text DEFAULT NULL::text, p_crypto_amount numeric DEFAULT NULL::numeric, p_description text DEFAULT NULL::text, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_transaction_type IN ('deposit','credit','recovery','available_add') THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) + p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type IN ('withdrawal','debit','fee','available_remove') THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) - p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type IN ('blocked_add') THEN
    UPDATE public.profiles SET blocked_balance = COALESCE(blocked_balance,0) + p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type IN ('blocked_remove') THEN
    UPDATE public.profiles SET blocked_balance = COALESCE(blocked_balance,0) - p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type = 'block' THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) - p_amount,
                               blocked_balance = COALESCE(blocked_balance,0) + p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type = 'unblock' THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) + p_amount,
                               blocked_balance = COALESCE(blocked_balance,0) - p_amount WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Unknown transaction type: %', p_transaction_type;
  END IF;

  INSERT INTO public.transactions (user_id, admin_id, type, amount, crypto_symbol, crypto_amount, description, company_id)
  VALUES (p_user_id, p_admin_id, p_transaction_type, p_amount, p_crypto_symbol, p_crypto_amount, p_description,
          COALESCE(p_company_id, (SELECT company_id FROM public.profiles WHERE id = p_user_id)));
END;
$function$;