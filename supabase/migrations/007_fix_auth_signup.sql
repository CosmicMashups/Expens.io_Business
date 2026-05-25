-- Fix: "Database error creating new user" when handle_new_user cannot insert user_profiles
-- Causes: RLS blocks INSERT; function missing search_path/owner; null email edge cases

-- Recreate signup handler (SECURITY DEFINER + explicit public schema)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    COALESCE(NEW.email, NEW.id::text || '@placeholder.local'),
    'guest'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), user_profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

-- Function must be owned by a role that bypasses RLS on user_profiles (Supabase: postgres)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Split admin ALL policy so INSERT is not blocked for signup trigger / self-insert
DROP POLICY IF EXISTS "admin_manage_users" ON user_profiles;

CREATE POLICY "admin_manage_users_select" ON user_profiles
  FOR SELECT USING (is_admin_role());

CREATE POLICY "admin_manage_users_update" ON user_profiles
  FOR UPDATE USING (is_admin_role());

CREATE POLICY "admin_manage_users_delete" ON user_profiles
  FOR DELETE USING (is_admin_role());

-- Authenticated users may insert their own row (OAuth / client signup fallback)
CREATE POLICY "users_insert_own" ON user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Auth service role may insert during signup trigger
CREATE POLICY "auth_service_insert_profiles" ON user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

GRANT INSERT ON public.user_profiles TO service_role;
GRANT INSERT ON public.user_profiles TO supabase_auth_admin;
