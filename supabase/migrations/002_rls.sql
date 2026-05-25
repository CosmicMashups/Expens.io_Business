-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_monitoring_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_write_role()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('owner', 'finance_manager', 'accountant', 'developer')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('owner', 'developer')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_approver_role()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('owner', 'finance_manager', 'developer')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- user_profiles
-- ============================================================
CREATE POLICY "users_select_own" ON user_profiles FOR SELECT USING (id = auth.uid() OR is_write_role());
CREATE POLICY "users_update_own" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "auth_service_insert_profiles" ON user_profiles FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "admin_manage_users_select" ON user_profiles FOR SELECT USING (is_admin_role());
CREATE POLICY "admin_manage_users_update" ON user_profiles FOR UPDATE USING (is_admin_role());
CREATE POLICY "admin_manage_users_delete" ON user_profiles FOR DELETE USING (is_admin_role());

-- ============================================================
-- app_settings
-- ============================================================
CREATE POLICY "settings_select_all" ON app_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings_update_admin" ON app_settings FOR UPDATE USING (is_admin_role());

-- ============================================================
-- expense_categories
-- ============================================================
CREATE POLICY "categories_select_all" ON expense_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories_write_admin" ON expense_categories FOR ALL USING (is_admin_role());

-- ============================================================
-- projects
-- ============================================================
CREATE POLICY "projects_select_all" ON projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "projects_write" ON projects FOR INSERT WITH CHECK (is_write_role());
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (is_write_role());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (is_write_role());

-- ============================================================
-- client_invoices
-- ============================================================
CREATE POLICY "invoices_select_all" ON client_invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "invoices_write" ON client_invoices FOR INSERT WITH CHECK (is_write_role());
CREATE POLICY "invoices_update" ON client_invoices FOR UPDATE USING (is_write_role());
CREATE POLICY "invoices_delete" ON client_invoices FOR DELETE USING (is_write_role());

-- ============================================================
-- project_monitoring_reports
-- ============================================================
CREATE POLICY "pmr_select_all" ON project_monitoring_reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "pmr_write" ON project_monitoring_reports FOR INSERT WITH CHECK (is_write_role());
CREATE POLICY "pmr_update" ON project_monitoring_reports FOR UPDATE USING (is_write_role());
CREATE POLICY "pmr_delete" ON project_monitoring_reports FOR DELETE USING (is_write_role());

-- ============================================================
-- daily_expenses
-- ============================================================
CREATE POLICY "de_select_all" ON daily_expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "de_write" ON daily_expenses FOR INSERT WITH CHECK (is_write_role());
CREATE POLICY "de_update" ON daily_expenses FOR UPDATE USING (is_write_role());
CREATE POLICY "de_delete" ON daily_expenses FOR DELETE USING (is_write_role());

-- ============================================================
-- project_expenses
-- ============================================================
CREATE POLICY "pe_select_all" ON project_expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "pe_write" ON project_expenses FOR INSERT WITH CHECK (is_write_role());
CREATE POLICY "pe_update" ON project_expenses FOR UPDATE USING (is_write_role());
CREATE POLICY "pe_delete" ON project_expenses FOR DELETE USING (is_write_role());

-- ============================================================
-- payroll
-- ============================================================
CREATE POLICY "payroll_select_all" ON payroll FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "payroll_write" ON payroll FOR INSERT WITH CHECK (is_write_role());
CREATE POLICY "payroll_update" ON payroll FOR UPDATE USING (is_write_role());
CREATE POLICY "payroll_delete" ON payroll FOR DELETE USING (is_write_role());

-- ============================================================
-- approval_queue
-- ============================================================
CREATE POLICY "aq_select_all" ON approval_queue FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "aq_insert_write" ON approval_queue FOR INSERT WITH CHECK (is_write_role());
CREATE POLICY "aq_update_approver" ON approval_queue FOR UPDATE USING (is_approver_role());

-- ============================================================
-- audit_logs — APPEND ONLY
-- ============================================================
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (is_write_role());
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT WITH CHECK (is_write_role());
-- No UPDATE or DELETE policies on audit_logs intentionally
