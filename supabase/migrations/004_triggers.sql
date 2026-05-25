-- ============================================================
-- Auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pmr_updated_at
  BEFORE UPDATE ON project_monitoring_reports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_de_updated_at
  BEFORE UPDATE ON daily_expenses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pe_updated_at
  BEFORE UPDATE ON project_expenses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payroll_updated_at
  BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON client_invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Auto-create user_profile on Supabase auth signup
-- ============================================================
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
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Immutable audit log trigger (generic)
-- Apply to each table individually
-- ============================================================
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id  UUID;
  v_actor_email TEXT;
BEGIN
  v_actor_id    := auth.uid();
  SELECT email INTO v_actor_email FROM user_profiles WHERE id = v_actor_id;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (actor_id, actor_email, action, table_name, record_id, new_data)
    VALUES (v_actor_id, v_actor_email, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (actor_id, actor_email, action, table_name, record_id, old_data, new_data)
    VALUES (v_actor_id, v_actor_email, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (actor_id, actor_email, action, table_name, record_id, old_data)
    VALUES (v_actor_id, v_actor_email, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to all key tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'projects', 'project_monitoring_reports', 'daily_expenses',
    'project_expenses', 'payroll', 'client_invoices', 'approval_queue'
  ] LOOP
    EXECUTE FORMAT('
      CREATE TRIGGER trg_audit_%I
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()', t, t);
  END LOOP;
END $$;

-- ============================================================
-- Auto-calculate VAT on daily_expenses insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION calc_expense_vat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.vat = ROUND(NEW.cash_out * NEW.vat_rate, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_de_vat
  BEFORE INSERT OR UPDATE OF cash_out, vat_rate ON daily_expenses
  FOR EACH ROW EXECUTE FUNCTION calc_expense_vat();

-- ============================================================
-- Auto-update invoice status on payment changes
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_invoice_status(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_status
  AFTER INSERT OR UPDATE OF amount_paid, due_date ON client_invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_invoice_status();
