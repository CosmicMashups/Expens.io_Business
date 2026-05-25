export type UserRole = 'owner' | 'finance_manager' | 'accountant' | 'developer' | 'guest'
export type ProjectStatus = 'quotation' | 'awarded' | 'active' | 'suspended' | 'completed' | 'archived'
export type InvoiceStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'disputed'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ApprovalEntity = 'daily_expense' | 'project_expense' | 'payroll' | 'project_monitoring_report'
export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'JPY' | 'SGD' | 'CNY' | 'AUD'
export type WorkerType = 'employee' | 'organization'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AppSettings {
  id: string
  expense_approvals_enabled: boolean
  payroll_lock_enabled: boolean
  report_approval_enabled: boolean
  default_vat_rate: number
  updated_by: string | null
  updated_at: string
}

export interface ExpenseCategory {
  id: string
  code: string
  label: string
  sort_order: number
  is_active: boolean
}

export interface Project {
  id: string
  project_id: string
  project_name: string
  status: ProjectStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProjectFormValues {
  project_id: string
  project_name: string
  status: ProjectStatus
}

export interface ClientInvoice {
  id: string
  project_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  amount_paid: number
  currency: CurrencyCode
  status: InvoiceStatus
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  project?: Project
}

export interface ProjectMonitoringReport {
  id: string
  project_id: string
  report_year: number
  report_id: string
  report_description: string
  client: string | null
  date_start: string | null
  date_finish: string | null
  accomplishment: number
  remarks: string | null
  contracted_amount: number
  tax_amount: number
  amount_collected: number
  balance_to_be_collected: number
  material_cost_rental_scaffolds_tools_equipments: number
  coil_breakdown: number
  labor_cost: number
  company_outing_13th_month: number
  mandatories: number
  equipment_power_tools: number
  compensation_1601c: number
  diesel_tollgate_machine_vehicles_registration: number
  equipment_vehicle_tools_maintenance_calibration: number
  subcon_project_payment_supplier: number
  house_rentals_utilities_maintenance: number
  surity_bond_commission_others: number
  five_percent_com: number
  twelve_percent_vat: number
  uniforms_ppe_medical_medicines_insurance_ids: number
  iso_certification: number
  others_meal_pf_load_drawings_seminars_permits_const_fee: number
  total_expenses: number
  profit: number
  approval_status: ApprovalStatus
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  project?: Project
}

export const EXPENSE_CATEGORY_TO_PMR_COLUMN: Record<string, keyof ProjectMonitoringReport> = {
  material_cost: 'material_cost_rental_scaffolds_tools_equipments',
  coil_breakdown: 'coil_breakdown',
  labor_cost: 'labor_cost',
  company_outing: 'company_outing_13th_month',
  mandatories: 'mandatories',
  equipment_power_tools: 'equipment_power_tools',
  compensation_1601c: 'compensation_1601c',
  diesel_tollgate: 'diesel_tollgate_machine_vehicles_registration',
  equipment_maintenance: 'equipment_vehicle_tools_maintenance_calibration',
  subcon: 'subcon_project_payment_supplier',
  house_rentals: 'house_rentals_utilities_maintenance',
  surety_commission: 'surity_bond_commission_others',
  five_percent_com: 'five_percent_com',
  twelve_percent_vat: 'twelve_percent_vat',
  uniforms_ppe: 'uniforms_ppe_medical_medicines_insurance_ids',
  iso_certification: 'iso_certification',
  others: 'others_meal_pf_load_drawings_seminars_permits_const_fee',
}

export const PMR_EXPENSE_COLUMN_KEYS = [
  'material_cost_rental_scaffolds_tools_equipments',
  'coil_breakdown',
  'labor_cost',
  'company_outing_13th_month',
  'mandatories',
  'equipment_power_tools',
  'compensation_1601c',
  'diesel_tollgate_machine_vehicles_registration',
  'equipment_vehicle_tools_maintenance_calibration',
  'subcon_project_payment_supplier',
  'house_rentals_utilities_maintenance',
  'surity_bond_commission_others',
  'five_percent_com',
  'twelve_percent_vat',
  'uniforms_ppe_medical_medicines_insurance_ids',
  'iso_certification',
  'others_meal_pf_load_drawings_seminars_permits_const_fee',
] as const

export interface DailyExpense {
  id: string
  project_id: string
  expense_date: string
  particulars: string
  account_type: string | null
  tin: string | null
  address: string | null
  cash_out: number
  vat_rate: number
  vat: number
  currency: CurrencyCode
  associated_project_name: string | null
  expense_category_code: string | null
  receipt_url: string | null
  invoice_url: string | null
  approval_status: ApprovalStatus
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  project?: Project
}

export interface DailyExpenseFormValues {
  project_id: string
  expense_date: string
  particulars: string
  account_type?: string
  tin?: string
  address?: string
  cash_out: number
  vat_rate: number
  currency: CurrencyCode
  associated_project_name?: string
  expense_category_code?: string
}

export interface ProjectExpense {
  id: string
  project_id: string
  expense_date: string
  particulars: string
  account_type: string | null
  tin: string | null
  cash_out: number
  currency: CurrencyCode
  receipt_url: string | null
  invoice_url: string | null
  approval_status: ApprovalStatus
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  project?: Project
}

export interface PayrollPeriodKeys {
  january_15: number
  january_31: number
  february_15: number
  february_29: number
  march_15: number
  march_30: number
  april_15: number
  april_30: number
  may_15: number
  may_30: number
  june_15: number
  june_30: number
  july_15: number
  july_30: number
  august_15: number
  august_30: number
  september_15: number
  september_30: number
  october_15: number
  october_30: number
  november_15: number
  november_30: number
  december_15: number
  december_31: number
}

export interface Payroll extends PayrollPeriodKeys {
  id: string
  payroll_year: number
  project_id: string
  worker_name: string
  worker_type: WorkerType
  total_payroll: number
  currency: CurrencyCode
  is_locked: boolean
  approval_status: ApprovalStatus
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  project?: Project
}

export const PAYROLL_PERIOD_COLUMNS: Array<{ key: keyof PayrollPeriodKeys; label: string }> = [
  { key: 'january_15', label: 'Jan 15' },
  { key: 'january_31', label: 'Jan 31' },
  { key: 'february_15', label: 'Feb 15' },
  { key: 'february_29', label: 'Feb 29' },
  { key: 'march_15', label: 'Mar 15' },
  { key: 'march_30', label: 'Mar 30' },
  { key: 'april_15', label: 'Apr 15' },
  { key: 'april_30', label: 'Apr 30' },
  { key: 'may_15', label: 'May 15' },
  { key: 'may_30', label: 'May 30' },
  { key: 'june_15', label: 'Jun 15' },
  { key: 'june_30', label: 'Jun 30' },
  { key: 'july_15', label: 'Jul 15' },
  { key: 'july_30', label: 'Jul 30' },
  { key: 'august_15', label: 'Aug 15' },
  { key: 'august_30', label: 'Aug 30' },
  { key: 'september_15', label: 'Sep 15' },
  { key: 'september_30', label: 'Sep 30' },
  { key: 'october_15', label: 'Oct 15' },
  { key: 'october_30', label: 'Oct 30' },
  { key: 'november_15', label: 'Nov 15' },
  { key: 'november_30', label: 'Nov 30' },
  { key: 'december_15', label: 'Dec 15' },
  { key: 'december_31', label: 'Dec 31' },
]

export interface ApprovalQueueItem {
  id: string
  entity_type: ApprovalEntity
  entity_id: string
  requested_by: string
  requested_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  status: ApprovalStatus
  notes: string | null
  requester?: UserProfile
  reviewer?: UserProfile
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface DashboardSummary {
  total_expenses_ytd: number
  total_payroll_ytd: number
  active_projects_count: number
  total_amount_collected: number
  total_outstanding_balance: number
  total_profit_ytd: number
}

export interface MonthlyExpenseData {
  month_num: number
  month_name: string
  total: number
}

export interface ProjectProfitabilityData {
  project_name: string
  amount_collected: number
  total_expenses: number
  profit: number
}

export interface ExpenseCategoryBreakdown {
  category: string
  amount: number
}

export interface PaymentAgingData {
  status: InvoiceStatus
  count: number
  total_amount: number
}

export interface RolePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canExport: boolean
  canViewAudit: boolean
  canConfigureSettings: boolean
}
