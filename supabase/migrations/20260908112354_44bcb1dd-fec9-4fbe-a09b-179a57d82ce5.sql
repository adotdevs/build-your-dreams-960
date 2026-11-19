CREATE OR REPLACE FUNCTION public.admin_delete_transaction(p_transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE tx public.transactions%ROWTYPE;
BEGIN
  IF NOT public.has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO tx FROM public.transactions WHERE id = p_transaction_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF tx.type IN ('deposit','credit','recovery','available_add') THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) - tx.amount WHERE id = tx.user_id;
  ELSIF tx.type IN ('withdrawal','debit','fee','available_remove') THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) + tx.amount WHERE id = tx.user_id;
  ELSIF tx.type = 'blocked_add' THEN
    UPDATE public.profiles SET blocked_balance = COALESCE(blocked_balance,0) - tx.amount WHERE id = tx.user_id;
  ELSIF tx.type = 'blocked_remove' THEN
    UPDATE public.profiles SET blocked_balance = COALESCE(blocked_balance,0) + tx.amount WHERE id = tx.user_id;
  ELSIF tx.type = 'block' THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) + tx.amount,
                               blocked_balance = COALESCE(blocked_balance,0) - tx.amount WHERE id = tx.user_id;
  ELSIF tx.type = 'unblock' THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) - tx.amount,
                               blocked_balance = COALESCE(blocked_balance,0) + tx.amount WHERE id = tx.user_id;
  END IF;

  DELETE FROM public.transactions WHERE id = p_transaction_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_delete_transaction(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_transaction(uuid) TO authenticated;