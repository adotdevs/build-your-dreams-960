CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  BEGIN
    v_company_id := NULLIF(NEW.raw_user_meta_data ->> 'company_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_company_id := NULL;
  END;

  IF v_company_id IS NULL THEN
    SELECT c.id INTO v_company_id
    FROM public.companies c
    WHERE c.status = 'active'
    ORDER BY c.created_at ASC
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, company_id)
  VALUES (NEW.id, NEW.email,
          NEW.raw_user_meta_data ->> 'first_name',
          NEW.raw_user_meta_data ->> 'last_name',
          v_company_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

UPDATE public.profiles p
SET company_id = (SELECT c.id FROM public.companies c WHERE c.status = 'active' ORDER BY c.created_at ASC LIMIT 1)
WHERE p.company_id IS NULL;