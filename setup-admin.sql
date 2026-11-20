-- CampusCore: register a Supabase Auth account as an application administrator.
-- 1. In Supabase > Authentication > Users, choose an existing email/password
--    account or create one with your own password and Auto Confirm User enabled.
-- 2. Replace admin@example.com below with that account's email.
-- 3. Run this file in the Supabase SQL Editor. No password belongs in this file.

-- Check current application administrators (zero rows means none exist).
SELECT u.email, u.full_name, u.is_active,
       a.id IS NOT NULL AS auth_account_exists,
       a.email_confirmed_at IS NOT NULL AS email_confirmed
FROM public.users u
JOIN public.user_roles ur ON ur.user_id = u.user_id
JOIN public.roles r ON r.role_id = ur.role_id
LEFT JOIN auth.users a ON a.id = u.auth_user_id
WHERE r.role_name = 'admin';

-- Register the chosen account and give it the admin role atomically.
-- Re-running with the same email keeps existing roles and avoids duplicates.
DO $$
DECLARE
  target_email TEXT := 'admin@example.com';
  target_name TEXT := 'CampusCore Administrator';
  auth_id UUID;
  app_id INTEGER;
  admin_id INTEGER;
BEGIN
  SELECT id INTO auth_id
  FROM auth.users
  WHERE lower(email) = lower(trim(target_email));

  IF auth_id IS NULL THEN
    RAISE EXCEPTION 'Create the account % in Authentication > Users first.', target_email;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth_id
      AND email_confirmed_at IS NOT NULL
      AND COALESCE(encrypted_password, '') <> ''
      AND (banned_until IS NULL OR banned_until < now())
  ) THEN
    RAISE EXCEPTION 'The Auth account needs a password, confirmed email, and no active ban.';
  END IF;

  INSERT INTO public.roles (role_name)
  VALUES ('student'), ('lecturer'), ('lab_teacher'), ('admin')
  ON CONFLICT (role_name) DO NOTHING;

  SELECT role_id INTO admin_id FROM public.roles WHERE role_name = 'admin';

  INSERT INTO public.users (auth_user_id, full_name, email, is_active, created_at)
  SELECT auth_id, target_name, email, true, now()
  FROM auth.users WHERE id = auth_id
  ON CONFLICT (auth_user_id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        is_active = true
  RETURNING user_id INTO app_id;

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (app_id, admin_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;

-- Confirm the resulting administrator accounts.
SELECT u.email, u.full_name, u.is_active
FROM public.users u
JOIN public.user_roles ur ON ur.user_id = u.user_id
JOIN public.roles r ON r.role_id = ur.role_id
WHERE r.role_name = 'admin';
