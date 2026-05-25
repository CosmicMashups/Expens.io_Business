import type {
  DailyExpense,
  Payroll,
  ProjectExpense,
  ProjectMonitoringReport,
} from '@/types'

export type ExcelLayoutKind =
  | 'daily_expenses_sample'
  | 'daily_expenses_monthly'
  | 'payroll_summary'
  | 'payroll_generic'
  | 'project_expenses_positional'
  | 'project_expenses_generic'
  | 'pmr_contracted_report'
  | 'pmr_generic'
  | 'unknown'

export interface ImportError {
  row: number
  message: string
}

export interface ImportResult<T> {
  valid: T[]
  errors: ImportError[]
  sheetName: string
  layout: ExcelLayoutKind
}

export type PartialDailyExpense = Partial<DailyExpense>
export type PartialProjectExpense = Partial<ProjectExpense>
export type PartialPayroll = Partial<Payroll>
export type PartialPMR = Partial<ProjectMonitoringReport> & {
  _project_name?: string
  _project_match?: string
}
