-- Enum
CREATE TYPE public.app_role AS ENUM ('admin','client','super_admin','platform_owner','company_admin');

-- Companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  crypto_id_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  logo_url text,
  primary_color text,
  default_currency text DEFAULT 'EUR',
  is_onboarded boolean NOT NULL DEFAULT false,
  admin_user_id uuid,
  admin_username text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text,
  nationality text,
  date_of_birth date,
  occupation text,
  employer text,
  income_range text,
  wealth_range text,
  fund_source text,
  tax_residence text,
  crypto_experience text,
  investment_experience text,
  has_foreign_accounts boolean DEFAULT false,
  is_politically_exposed boolean DEFAULT false,
  kyc_status text DEFAULT 'pending',
  kyc_document_front_url text,
  kyc_document_back_url text,
  kyc_selfie_url text,
  available_balance numeric DEFAULT 0,
  blocked_balance numeric DEFAULT 0,
  agent_id uuid,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.agent_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  permission_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, permission_key)
);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_holder text NOT NULL,
  bank_name text NOT NULL,
  bank_country text NOT NULL,
  iban text NOT NULL,
  bic text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.client_deposit_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_holder text NOT NULL,
  bank_name text NOT NULL,
  iban text NOT NULL,
  bic text,
  currency text NOT NULL DEFAULT 'EUR',
  reference text,
  instructions text,
  min_amount numeric,
  max_amount numeric,
  company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.required_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  amount numeric,
  currency text DEFAULT 'EUR',
  crypto_symbol text,
  due_date timestamptz,
  sort_order integer DEFAULT 0,
  template_id text,
  legal_title text,
  legal_description text,
  legal_basis text,
  why_required text[],
  how_to_proceed text[],
  consequences text,
  contact_info text,
  documents text[],
  attachments text[],
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  attachments text[],
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid,
  type text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  crypto_amount numeric,
  crypto_symbol text,
  description text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wallet_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crypto_symbol text NOT NULL,
  crypto_name text NOT NULL,
  address text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_permissions TO authenticated;
GRANT ALL ON public.agent_permissions TO service_role;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_deposit_info TO authenticated;
GRANT ALL ON public.client_deposit_info TO service_role;
GRANT ALL ON public.login_attempts TO service_role;
GRANT SELECT ON public.login_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.required_actions TO authenticated;
GRANT ALL ON public.required_actions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_addresses TO authenticated;
GRANT ALL ON public.wallet_addresses TO service_role;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deposit_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.required_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_addresses ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_agent(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_owner');
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'company_admin');
$$;

CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','super_admin','platform_owner','company_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid DEFAULT auth.uid())
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_same_company(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_platform_owner(_user_id)
      OR (SELECT company_id FROM public.profiles WHERE id = _user_id) IS NOT DISTINCT FROM _company_id;
$$;

CREATE OR REPLACE FUNCTION public.agent_has_permission(_agent_id uuid, _permission_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.agent_permissions
      WHERE agent_id = _agent_id AND permission_key = _permission_key),
    public.is_super_admin(_agent_id) OR public.is_platform_owner(_agent_id)
  );
$$;

-- Secure profile view (limited columns)
CREATE VIEW public.profiles_secure
WITH (security_invoker = true) AS
SELECT id, email, first_name, last_name, phone, address, city, postal_code, country,
       nationality, kyc_status, available_balance, blocked_balance, agent_id, company_id,
       created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT ALL ON public.profiles_secure TO service_role;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_agent_permissions_updated BEFORE UPDATE ON public.agent_permissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bank_accounts_updated BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_client_deposit_info_updated BEFORE UPDATE ON public.client_deposit_info FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_required_actions_updated BEFORE UPDATE ON public.required_actions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_support_tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_wallet_addresses_updated BEFORE UPDATE ON public.wallet_addresses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- New user -> profile + client role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email,
          NEW.raw_user_meta_data ->> 'first_name',
          NEW.raw_user_meta_data ->> 'last_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Business functions
CREATE OR REPLACE FUNCTION public.insert_activity_log(
  p_user_id uuid, p_type text, p_title text,
  p_description text DEFAULT NULL, p_metadata jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.activity_logs (user_id, type, title, description, metadata, ip_address, user_agent, company_id)
  VALUES (p_user_id, p_type, p_title, p_description, p_metadata, p_ip_address, p_user_agent,
          (SELECT company_id FROM public.profiles WHERE id = p_user_id))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text, p_success boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success) VALUES (lower(p_email), p_success);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_failed int; v_last timestamptz;
BEGIN
  SELECT count(*), max(attempted_at) INTO v_failed, v_last
  FROM public.login_attempts
  WHERE email = lower(p_email) AND success = false AND attempted_at > now() - interval '15 minutes';

  IF v_failed >= 5 THEN
    RETURN jsonb_build_object('allowed', false, 'attempts', v_failed,
      'retry_after_seconds', GREATEST(0, EXTRACT(EPOCH FROM (v_last + interval '15 minutes' - now()))::int));
  END IF;
  RETURN jsonb_build_object('allowed', true, 'attempts', v_failed, 'retry_after_seconds', 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '30 days';
$$;

CREATE OR REPLACE FUNCTION public.validate_company_crypto_code(p_crypto_id_code text)
RETURNS TABLE (id uuid, name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name FROM public.companies c
  WHERE upper(c.crypto_id_code) = upper(p_crypto_id_code) AND c.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.process_balance_transaction(
  p_user_id uuid, p_admin_id uuid, p_transaction_type text, p_amount numeric,
  p_crypto_symbol text DEFAULT NULL, p_crypto_amount numeric DEFAULT NULL,
  p_description text DEFAULT NULL, p_company_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_transaction_type IN ('deposit','credit','recovery') THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) + p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type IN ('withdrawal','debit','fee') THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) - p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type = 'block' THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) - p_amount,
                               blocked_balance = COALESCE(blocked_balance,0) + p_amount WHERE id = p_user_id;
  ELSIF p_transaction_type = 'unblock' THEN
    UPDATE public.profiles SET available_balance = COALESCE(available_balance,0) + p_amount,
                               blocked_balance = COALESCE(blocked_balance,0) - p_amount WHERE id = p_user_id;
  END IF;

  INSERT INTO public.transactions (user_id, admin_id, type, amount, crypto_symbol, crypto_amount, description, company_id)
  VALUES (p_user_id, p_admin_id, p_transaction_type, p_amount, p_crypto_symbol, p_crypto_amount, p_description,
          COALESCE(p_company_id, (SELECT company_id FROM public.profiles WHERE id = p_user_id)));
END;
$$;

CREATE OR REPLACE FUNCTION public.process_withdrawal_request(p_amount numeric, p_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_balance numeric; v_tx uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT COALESCE(available_balance,0) INTO v_balance FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.profiles
  SET available_balance = available_balance - p_amount,
      blocked_balance = COALESCE(blocked_balance,0) + p_amount
  WHERE id = v_uid;

  INSERT INTO public.transactions (user_id, type, amount, description, company_id)
  VALUES (v_uid, 'withdrawal_request', p_amount, p_description,
          (SELECT company_id FROM public.profiles WHERE id = v_uid))
  RETURNING id INTO v_tx;

  RETURN v_tx;
END;
$$;

-- RLS policies
CREATE POLICY "Admins read companies" ON public.companies FOR SELECT TO authenticated
USING (public.has_admin_access(auth.uid()) OR id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Platform owners manage companies" ON public.companies FOR ALL TO authenticated
USING (public.is_platform_owner(auth.uid()) OR public.is_super_admin(auth.uid()))
WITH CHECK (public.is_platform_owner(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Company admins update own company" ON public.companies FOR UPDATE TO authenticated
USING (public.has_admin_access(auth.uid()) AND id = public.get_user_company_id(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()) AND id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR public.has_admin_access(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)))
WITH CHECK (id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)));

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_admin_access(auth.uid()));

CREATE POLICY "Admins read agent permissions" ON public.agent_permissions FOR SELECT TO authenticated
USING (agent_id = auth.uid() OR public.has_admin_access(auth.uid()));
CREATE POLICY "Admins manage agent permissions" ON public.agent_permissions FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.is_platform_owner(auth.uid()) OR public.is_company_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_platform_owner(auth.uid()) OR public.is_company_admin(auth.uid()));

CREATE POLICY "Users read own activity" ON public.activity_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)));
CREATE POLICY "Users insert own activity" ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_admin_access(auth.uid()));

CREATE POLICY "Bank accounts owner access" ON public.bank_accounts FOR ALL TO authenticated
USING (user_id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)))
WITH CHECK (user_id = auth.uid() OR public.has_admin_access(auth.uid()));

CREATE POLICY "Deposit info owner read" ON public.client_deposit_info FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_admin_access(auth.uid()));
CREATE POLICY "Deposit info admin manage" ON public.client_deposit_info FOR ALL TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

CREATE POLICY "Admins read login attempts" ON public.login_attempts FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()) OR public.is_platform_owner(auth.uid()));

CREATE POLICY "Required actions owner read" ON public.required_actions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)));
CREATE POLICY "Required actions owner update" ON public.required_actions FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_admin_access(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.has_admin_access(auth.uid()));
CREATE POLICY "Required actions admin insert" ON public.required_actions FOR INSERT TO authenticated
WITH CHECK (public.has_admin_access(auth.uid()));
CREATE POLICY "Required actions admin delete" ON public.required_actions FOR DELETE TO authenticated
USING (public.has_admin_access(auth.uid()));

CREATE POLICY "Tickets owner access" ON public.support_tickets FOR ALL TO authenticated
USING (user_id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)))
WITH CHECK (user_id = auth.uid() OR public.has_admin_access(auth.uid()));

CREATE POLICY "Messages participant read" ON public.support_messages FOR SELECT TO authenticated
USING (
  public.has_admin_access(auth.uid())
  OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);
CREATE POLICY "Messages participant insert" ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND (
    public.has_admin_access(auth.uid())
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  )
);
CREATE POLICY "Messages participant update" ON public.support_messages FOR UPDATE TO authenticated
USING (
  public.has_admin_access(auth.uid())
  OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
)
WITH CHECK (
  public.has_admin_access(auth.uid())
  OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

CREATE POLICY "Transactions owner read" ON public.transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)));
CREATE POLICY "Transactions admin write" ON public.transactions FOR INSERT TO authenticated
WITH CHECK (public.has_admin_access(auth.uid()));

CREATE POLICY "Wallets owner read" ON public.wallet_addresses FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (public.has_admin_access(auth.uid()) AND public.is_same_company(auth.uid(), company_id)));
CREATE POLICY "Wallets admin manage" ON public.wallet_addresses FOR ALL TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;