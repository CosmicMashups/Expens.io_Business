-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'owner',
  'finance_manager',
  'accountant',
  'developer',
  'guest'
);

CREATE TYPE project_status AS ENUM (
  'quotation',
  'awarded',
  'active',
  'suspended',
  'completed',
  'archived'
);

CREATE TYPE invoice_status AS ENUM (
  'pending',
  'partially_paid',
  'paid',
  'overdue',
  'disputed'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE approval_entity AS ENUM (
  'daily_expense',
  'project_expense',
  'payroll',
  'project_monitoring_report'
);

CREATE TYPE currency_code AS ENUM (
  'PHP',
  'USD',
  'EUR',
  'JPY',
  'SGD',
  'CNY',
  'AUD'
);

-- ============================================================
-- USER PROFILES (mirrors Supabase auth.users)
-- ============================================================

CREATE TABLE user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'guest',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APP SETTINGS (configurable by Owner/Developer)
-- ============================================================

CREATE TABLE app_settings (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_approvals_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  payroll_lock_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  report_approval_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  default_vat_rate            NUMERIC(5,4) NOT NULL DEFAULT 0.12,
  updated_by                  UUID REFERENCES user_profiles(id),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings DEFAULT VALUES;

-- ============================================================
-- EXPENSE CATEGORIES (admin-configurable)
-- ============================================================

CREATE TABLE expense_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed canonical categories matching the Excel headers exactly
INSERT INTO expense_categories (code, label, sort_order) VALUES
  ('material_cost',           'Material Cost / Rental of Scaffolds / Tools / Equipment',  1),
  ('coil_breakdown',          'Coil Breakdown',                                            2),
  ('labor_cost',              'Labor Cost',                                                3),
  ('company_outing',          'Company Outing / 13th Month',                              4),
  ('mandatories',             'Mandatories',                                               5),
  ('equipment_power_tools',   'Equipment / Power Tools',                                  6),
  ('compensation_1601c',      'Compensation 1601C',                                       7),
  ('diesel_tollgate',         'Diesel / Tollgate / Machine / Vehicles Registration',      8),
  ('equipment_maintenance',   'Equipment / Vehicle / Tools Maintenance / Calibration',    9),
  ('subcon',                  'Subcon Project / Payment / Supplier',                      10),
  ('house_rentals',           'House Rentals / Utilities / Maintenance',                  11),
  ('surety_commission',       'Surety Bond / Commission / Others',                        12),
  ('five_percent_com',        '5% Com',                                                   13),
  ('twelve_percent_vat',      '12% VAT',                                                  14),
  ('uniforms_ppe',            'Uniforms / PPE / Medical / Medicines / Insurance / IDs',   15),
  ('iso_certification',       'ISO Certification',                                        16),
  ('others',                  'Others / Meals / PF Load / Drawings / Seminars / Permits', 17);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    TEXT NOT NULL UNIQUE,   -- user-defined business key, e.g. "PRJ-2024-001"
  project_name  TEXT NOT NULL,
  status        project_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ             -- soft delete
);

CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);

-- ============================================================
-- CLIENT INVOICES (for payment tracking)
-- ============================================================

CREATE TABLE client_invoices (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id            UUID NOT NULL REFERENCES projects(id),
  invoice_number        TEXT NOT NULL,
  invoice_date          DATE NOT NULL,
  due_date              DATE NOT NULL,
  amount                NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid           NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency              currency_code NOT NULL DEFAULT 'PHP',
  status                invoice_status NOT NULL DEFAULT 'pending',
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_invoices_project_id ON client_invoices(project_id);
CREATE INDEX idx_invoices_status ON client_invoices(status);
CREATE INDEX idx_invoices_due_date ON client_invoices(due_date);

-- ============================================================
-- PROJECT MONITORING REPORTS
-- ============================================================

CREATE TABLE project_monitoring_reports (
  id                                                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id                                              UUID NOT NULL REFERENCES projects(id),
  report_year                                             SMALLINT NOT NULL,
  report_id                                               TEXT NOT NULL UNIQUE,  -- matches Excel ReportID
  report_description                                      TEXT NOT NULL,
  client                                                  TEXT,
  date_start                                              DATE,
  date_finish                                             DATE,
  accomplishment                                          NUMERIC(6,2) DEFAULT 0,     -- percentage 0-100
  remarks                                                 TEXT,
  contracted_amount                                       NUMERIC(15,2) DEFAULT 0,
  tax_amount                                              NUMERIC(15,2) DEFAULT 0,
  amount_collected                                        NUMERIC(15,2) DEFAULT 0,
  balance_to_be_collected                                 NUMERIC(15,2) GENERATED ALWAYS AS (contracted_amount - amount_collected) STORED,
  -- Expense columns matching Excel exactly
  material_cost_rental_scaffolds_tools_equipments         NUMERIC(15,2) DEFAULT 0,
  coil_breakdown                                          NUMERIC(15,2) DEFAULT 0,
  labor_cost                                              NUMERIC(15,2) DEFAULT 0,
  company_outing_13th_month                               NUMERIC(15,2) DEFAULT 0,
  mandatories                                             NUMERIC(15,2) DEFAULT 0,
  equipment_power_tools                                   NUMERIC(15,2) DEFAULT 0,
  compensation_1601c                                      NUMERIC(15,2) DEFAULT 0,
  diesel_tollgate_machine_vehicles_registration           NUMERIC(15,2) DEFAULT 0,
  equipment_vehicle_tools_maintenance_calibration         NUMERIC(15,2) DEFAULT 0,
  subcon_project_payment_supplier                         NUMERIC(15,2) DEFAULT 0,
  house_rentals_utilities_maintenance                     NUMERIC(15,2) DEFAULT 0,
  surity_bond_commission_others                           NUMERIC(15,2) DEFAULT 0,
  five_percent_com                                        NUMERIC(15,2) DEFAULT 0,
  twelve_percent_vat                                      NUMERIC(15,2) DEFAULT 0,
  uniforms_ppe_medical_medicines_insurance_ids            NUMERIC(15,2) DEFAULT 0,
  iso_certification                                       NUMERIC(15,2) DEFAULT 0,
  others_meal_pf_load_drawings_seminars_permits_const_fee NUMERIC(15,2) DEFAULT 0,
  total_expenses                                          NUMERIC(15,2) DEFAULT 0,
  profit                                                  NUMERIC(15,2) GENERATED ALWAYS AS (amount_collected - total_expenses) STORED,
  -- approval
  approval_status                                         approval_status NOT NULL DEFAULT 'pending',
  approved_by                                             UUID REFERENCES user_profiles(id),
  approved_at                                             TIMESTAMPTZ,
  -- technical
  created_by                                              UUID REFERENCES user_profiles(id),
  created_at                                              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                                              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                                              TIMESTAMPTZ
);

CREATE INDEX idx_pmr_project_id ON project_monitoring_reports(project_id);
CREATE INDEX idx_pmr_report_year ON project_monitoring_reports(report_year);
CREATE INDEX idx_pmr_deleted_at ON project_monitoring_reports(deleted_at);

-- ============================================================
-- DAILY EXPENSES
-- ============================================================

CREATE TABLE daily_expenses (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id              UUID NOT NULL REFERENCES projects(id),
  expense_date            DATE NOT NULL,
  particulars             TEXT NOT NULL,
  account_type            TEXT,
  tin                     TEXT,
  address                 TEXT,
  cash_out                NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_rate                NUMERIC(5,4) NOT NULL DEFAULT 0.12,
  vat                     NUMERIC(15,2) NOT NULL DEFAULT 0,     -- calculated: cash_out * vat_rate
  currency                currency_code NOT NULL DEFAULT 'PHP',
  associated_project_name TEXT,                                 -- free-text, matches Excel column
  expense_category_code   TEXT REFERENCES expense_categories(code),
  receipt_url             TEXT,
  invoice_url             TEXT,
  -- approval
  approval_status         approval_status NOT NULL DEFAULT 'pending',
  approved_by             UUID REFERENCES user_profiles(id),
  approved_at             TIMESTAMPTZ,
  -- technical
  created_by              UUID REFERENCES user_profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_de_project_id ON daily_expenses(project_id);
CREATE INDEX idx_de_expense_date ON daily_expenses(expense_date);
CREATE INDEX idx_de_deleted_at ON daily_expenses(deleted_at);
CREATE INDEX idx_de_particulars ON daily_expenses USING gin(to_tsvector('english', particulars));

-- ============================================================
-- PROJECT EXPENSES
-- ============================================================

CREATE TABLE project_expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES projects(id),
  expense_date    DATE NOT NULL,
  particulars     TEXT NOT NULL,
  account_type    TEXT,
  tin             TEXT,
  cash_out        NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency        currency_code NOT NULL DEFAULT 'PHP',
  receipt_url     TEXT,
  invoice_url     TEXT,
  -- approval
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_by     UUID REFERENCES user_profiles(id),
  approved_at     TIMESTAMPTZ,
  -- technical
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_pe_project_id ON project_expenses(project_id);
CREATE INDEX idx_pe_expense_date ON project_expenses(expense_date);
CREATE INDEX idx_pe_deleted_at ON project_expenses(deleted_at);

-- ============================================================
-- PAYROLL
-- ============================================================

CREATE TABLE payroll (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_year    SMALLINT NOT NULL,
  project_id      UUID NOT NULL REFERENCES projects(id),
  worker_name     TEXT NOT NULL,        -- employee name or outsourced org name
  worker_type     TEXT NOT NULL DEFAULT 'employee',  -- 'employee' | 'organization'
  january_15      NUMERIC(15,2) DEFAULT 0,
  january_31      NUMERIC(15,2) DEFAULT 0,
  february_15     NUMERIC(15,2) DEFAULT 0,
  february_29     NUMERIC(15,2) DEFAULT 0,
  march_15        NUMERIC(15,2) DEFAULT 0,
  march_30        NUMERIC(15,2) DEFAULT 0,
  april_15        NUMERIC(15,2) DEFAULT 0,
  april_30        NUMERIC(15,2) DEFAULT 0,
  may_15          NUMERIC(15,2) DEFAULT 0,
  may_30          NUMERIC(15,2) DEFAULT 0,
  june_15         NUMERIC(15,2) DEFAULT 0,
  june_30         NUMERIC(15,2) DEFAULT 0,
  july_15         NUMERIC(15,2) DEFAULT 0,
  july_30         NUMERIC(15,2) DEFAULT 0,
  august_15       NUMERIC(15,2) DEFAULT 0,
  august_30       NUMERIC(15,2) DEFAULT 0,
  september_15    NUMERIC(15,2) DEFAULT 0,
  september_30    NUMERIC(15,2) DEFAULT 0,
  october_15      NUMERIC(15,2) DEFAULT 0,
  october_30      NUMERIC(15,2) DEFAULT 0,
  november_15     NUMERIC(15,2) DEFAULT 0,
  november_30     NUMERIC(15,2) DEFAULT 0,
  december_15     NUMERIC(15,2) DEFAULT 0,
  december_31     NUMERIC(15,2) DEFAULT 0,
  total_payroll   NUMERIC(15,2) GENERATED ALWAYS AS (
    COALESCE(january_15,0) + COALESCE(january_31,0) +
    COALESCE(february_15,0) + COALESCE(february_29,0) +
    COALESCE(march_15,0) + COALESCE(march_30,0) +
    COALESCE(april_15,0) + COALESCE(april_30,0) +
    COALESCE(may_15,0) + COALESCE(may_30,0) +
    COALESCE(june_15,0) + COALESCE(june_30,0) +
    COALESCE(july_15,0) + COALESCE(july_30,0) +
    COALESCE(august_15,0) + COALESCE(august_30,0) +
    COALESCE(september_15,0) + COALESCE(september_30,0) +
    COALESCE(october_15,0) + COALESCE(october_30,0) +
    COALESCE(november_15,0) + COALESCE(november_30,0) +
    COALESCE(december_15,0) + COALESCE(december_31,0)
  ) STORED,
  currency        currency_code NOT NULL DEFAULT 'PHP',
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
  -- approval
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approved_by     UUID REFERENCES user_profiles(id),
  approved_at     TIMESTAMPTZ,
  -- technical
  created_by      UUID REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_payroll_year ON payroll(payroll_year);
CREATE INDEX idx_payroll_project_id ON payroll(project_id);
CREATE INDEX idx_payroll_deleted_at ON payroll(deleted_at);

-- ============================================================
-- APPROVAL QUEUE
-- ============================================================

CREATE TABLE approval_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type     approval_entity NOT NULL,
  entity_id       UUID NOT NULL,
  requested_by    UUID NOT NULL REFERENCES user_profiles(id),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by     UUID REFERENCES user_profiles(id),
  reviewed_at     TIMESTAMPTZ,
  status          approval_status NOT NULL DEFAULT 'pending',
  notes           TEXT
);

CREATE INDEX idx_aq_entity ON approval_queue(entity_type, entity_id);
CREATE INDEX idx_aq_status ON approval_queue(status);
CREATE INDEX idx_aq_requested_by ON approval_queue(requested_by);

-- ============================================================
-- AUDIT LOGS (IMMUTABLE)
-- ============================================================

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id      UUID REFERENCES user_profiles(id),
  actor_email   TEXT,
  action        TEXT NOT NULL,           -- 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'IMPORT' | 'EXPORT'
  table_name    TEXT NOT NULL,
  record_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs are append-only. No UPDATE or DELETE allowed (enforced by RLS).
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
