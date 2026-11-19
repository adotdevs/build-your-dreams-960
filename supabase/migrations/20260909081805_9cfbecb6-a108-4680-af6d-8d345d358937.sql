
-- Helper: can the current user access a given client's data?
CREATE OR REPLACE FUNCTION public.can_access_client(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_platform_owner(auth.uid()) OR public.is_super_admin(auth.uid()) THEN true
    WHEN public.is_company_admin(auth.uid()) THEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _client_id
        AND p.company_id IS NOT DISTINCT FROM public.get_user_company_id(auth.uid())
    )
    WHEN public.is_admin(auth.uid()) THEN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _client_id AND p.agent_id = auth.uid()
    )
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.can_access_client(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_client(uuid) TO authenticated;

-- profiles
DROP POLICY "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING ((id = auth.uid()) OR public.can_access_client(id));

DROP POLICY "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING ((id = auth.uid()) OR public.can_access_client(id))
  WITH CHECK ((id = auth.uid()) OR public.can_access_client(id));

-- transactions
DROP POLICY "Transactions owner read" ON public.transactions;
CREATE POLICY "Transactions owner read" ON public.transactions FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id));

DROP POLICY "Transactions admin write" ON public.transactions;
CREATE POLICY "Transactions admin write" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_access(auth.uid()) AND public.can_access_client(user_id));

-- required_actions
DROP POLICY "Required actions owner read" ON public.required_actions;
CREATE POLICY "Required actions owner read" ON public.required_actions FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id));

DROP POLICY "Required actions owner update" ON public.required_actions;
CREATE POLICY "Required actions owner update" ON public.required_actions FOR UPDATE TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id))
  WITH CHECK ((user_id = auth.uid()) OR public.can_access_client(user_id));

DROP POLICY "Required actions admin insert" ON public.required_actions;
CREATE POLICY "Required actions admin insert" ON public.required_actions FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_access(auth.uid()) AND public.can_access_client(user_id));

DROP POLICY "Required actions admin delete" ON public.required_actions;
CREATE POLICY "Required actions admin delete" ON public.required_actions FOR DELETE TO authenticated
  USING (public.has_admin_access(auth.uid()) AND public.can_access_client(user_id));

-- wallet_addresses
DROP POLICY "Wallets owner read" ON public.wallet_addresses;
CREATE POLICY "Wallets owner read" ON public.wallet_addresses FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id));

DROP POLICY "Wallets admin manage" ON public.wallet_addresses;
CREATE POLICY "Wallets admin manage" ON public.wallet_addresses FOR ALL TO authenticated
  USING (public.has_admin_access(auth.uid()) AND public.can_access_client(user_id))
  WITH CHECK (public.has_admin_access(auth.uid()) AND public.can_access_client(user_id));

-- bank_accounts
DROP POLICY "Bank accounts owner access" ON public.bank_accounts;
CREATE POLICY "Bank accounts owner access" ON public.bank_accounts FOR ALL TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id))
  WITH CHECK ((user_id = auth.uid()) OR public.can_access_client(user_id));

-- client_deposit_info
DROP POLICY "Deposit info owner read" ON public.client_deposit_info;
CREATE POLICY "Deposit info owner read" ON public.client_deposit_info FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id));

DROP POLICY "Deposit info admin manage" ON public.client_deposit_info;
CREATE POLICY "Deposit info admin manage" ON public.client_deposit_info FOR ALL TO authenticated
  USING (public.has_admin_access(auth.uid()) AND public.can_access_client(user_id))
  WITH CHECK (public.has_admin_access(auth.uid()) AND public.can_access_client(user_id));

-- activity_logs
DROP POLICY "Users read own activity" ON public.activity_logs;
CREATE POLICY "Users read own activity" ON public.activity_logs FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id));

-- support_tickets
DROP POLICY "Tickets owner access" ON public.support_tickets;
CREATE POLICY "Tickets owner access" ON public.support_tickets FOR ALL TO authenticated
  USING ((user_id = auth.uid()) OR public.can_access_client(user_id))
  WITH CHECK ((user_id = auth.uid()) OR public.can_access_client(user_id));

-- support_messages
DROP POLICY "Messages participant read" ON public.support_messages;
CREATE POLICY "Messages participant read" ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid() OR public.can_access_client(t.user_id))
  ));

DROP POLICY "Messages participant insert" ON public.support_messages;
CREATE POLICY "Messages participant insert" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK ((sender_id = auth.uid()) AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid() OR public.can_access_client(t.user_id))
  ));

DROP POLICY "Messages participant update" ON public.support_messages;
CREATE POLICY "Messages participant update" ON public.support_messages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid() OR public.can_access_client(t.user_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = support_messages.ticket_id
      AND (t.user_id = auth.uid() OR public.can_access_client(t.user_id))
  ));

-- RPC: balance transactions limited to accessible clients
CREATE OR REPLACE FUNCTION public.process_balance_transaction(p_user_id uuid, p_admin_id uuid, p_transaction_type text, p_amount numeric, p_crypto_symbol text DEFAULT NULL::text, p_crypto_amount numeric DEFAULT NULL::numeric, p_description text DEFAULT NULL::text, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_admin_access(auth.uid()) OR NOT public.can_access_client(p_user_id) THEN
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

-- RPC: transaction deletion limited to accessible clients
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

  IF NOT public.can_access_client(tx.user_id) THEN
    RAISE EXCEPTION 'Not authorized';
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
