import type { ExcelLayoutKind } from '@/types/excel'
import type { PayrollPeriodKeys } from '@/types'
import * as XLSX from 'xlsx'

export const PAYROLL_DATE_TO_COLUMN: Record<string, keyof PayrollPeriodKeys> = {
  '2024-01-14': 'january_15',
  '2024-01-30': 'january_31',
  '2024-02-14': 'february_15',
  '2024-02-28': 'february_29',
  '2024-03-14': 'march_15',
  '2024-03-29': 'march_30',
  '2024-04-14': 'april_15',
  '2024-04-29': 'april_30',
  '2024-05-14': 'may_15',
  '2024-05-29': 'may_30',
  '2024-06-14': 'june_15',
  '2024-06-29': 'june_30',
  '2024-07-14': 'july_15',
  '2024-07-30': 'july_30',
  '2024-08-14': 'august_15',
  '2024-08-29': 'august_30',
  '2024-09-14': 'september_15',
  '2024-09-29': 'september_30',
  '2024-10-14': 'october_15',
  '2024-10-30': 'october_30',
  '2024-11-14': 'november_15',
  '2024-11-29': 'november_30',
  '2024-12-14': 'december_15',
  '2024-12-30': 'december_31',
}

const MONTH_SHEETS = new Set([
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
])

export function mapPayDateToColumn(date: Date | string): keyof PayrollPeriodKeys | null {
  const iso = typeof date === 'string'
    ? date.slice(0, 10)
    : date.toISOString().slice(0, 10)
  if (PAYROLL_DATE_TO_COLUMN[iso]) return PAYROLL_DATE_TO_COLUMN[iso]
  const d = new Date(iso)
  const month = d.getUTCMonth()
  const day = d.getUTCDate()
  const keys: (keyof PayrollPeriodKeys)[] = [
    'january_15', 'january_31', 'february_15', 'february_29',
    'march_15', 'march_30', 'april_15', 'april_30',
    'may_15', 'may_30', 'june_15', 'june_30',
    'july_15', 'july_30', 'august_15', 'august_30',
    'september_15', 'september_30', 'october_15', 'october_30',
    'november_15', 'november_30', 'december_15', 'december_31',
  ]
  const monthPairs = [
    [15, 31], [15, 29], [15, 30], [15, 30], [15, 30], [15, 30],
    [15, 30], [15, 30], [15, 30], [15, 30], [15, 30], [15, 31],
  ]
  const [d1] = monthPairs[month] ?? [15, 30]
  if (day <= d1 + 1) return keys[month * 2]
  return keys[month * 2 + 1]
}

export function detectWorkbookLayout(
  wb: XLSX.WorkBook,
  kind: 'daily' | 'payroll' | 'project_expenses' | 'pmr',
): ExcelLayoutKind {
  const names = wb.SheetNames
  if (kind === 'daily') {
    if (names.some((n) => MONTH_SHEETS.has(n.toLowerCase()))) return 'daily_expenses_monthly'
    const ws = wb.Sheets[names[0]]
    const row = getRow(ws, 0)
    const h = row.map((c) => String(c ?? '').toUpperCase())
    if (h.includes('DATE') && h.includes('CASH OUT')) return 'daily_expenses_sample'
    return 'daily_expenses_monthly'
  }
  if (kind === 'payroll') {
    const ws = wb.Sheets[names[0]]
    const r0 = String(getCell(ws, 0, 1) ?? '')
    if (r0.includes('PAYROLL SUMMARY')) return 'payroll_summary'
    if (/^\d{4}$/.test(names[0])) return 'payroll_generic'
    return 'payroll_summary'
  }
  if (kind === 'project_expenses') {
    const ws = wb.Sheets[names[0]]
    const row1 = getRow(ws, 0)
    const row3 = getRow(ws, 2)
    if (row3[1] instanceof Date || looksLikeDate(row3[1])) return 'project_expenses_positional'
    if (row1.some((c) => String(c).toLowerCase() === 'date')) return 'project_expenses_generic'
    return 'project_expenses_positional'
  }
  if (kind === 'pmr') {
    if (names.some((n) => n.toUpperCase().includes('CONTRACTED REPORT'))) return 'pmr_contracted_report'
    if (/^\d{4}$/.test(names[0])) return 'pmr_generic'
    return 'pmr_contracted_report'
  }
  return 'unknown'
}

export function getCell(ws: XLSX.WorkSheet, r: number, c: number): unknown {
  const cell = ws[XLSX.utils.encode_cell({ r, c })]
  return cell?.v ?? null
}

export function getRow(ws: XLSX.WorkSheet, r: number, maxCol = 40): unknown[] {
  const row: unknown[] = []
  for (let c = 0; c <= maxCol; c++) row.push(getCell(ws, r, c))
  return row
}

function looksLikeDate(v: unknown): boolean {
  if (v instanceof Date) return true
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return true
  return false
}

export function cellToDateString(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'string') return v.slice(0, 10)
  return ''
}

export function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function pmrHeaderToColumn(header: string): string | null {
  const h = header.trim().toLowerCase()
  const map: Record<string, string> = {
    'project name': 'report_description',
    'project /client': 'client',
    'date start': 'date_start',
    'date finish': 'date_finish',
    accomplishment: 'accomplishment',
    remarks: 'remarks',
    'contracted amount': 'contracted_amount',
    'tax amount': 'tax_amount',
    'amount collected': 'amount_collected',
    'material cost / rental of scaffolds etc../ tools & equips': 'material_cost_rental_scaffolds_tools_equipments',
    'coil breakdown': 'coil_breakdown',
    'labor cost': 'labor_cost',
    'company outing / 13th month / christmas expenses': 'company_outing_13th_month',
    mandatories: 'mandatories',
    'equipment / heavy equipments / power tools': 'equipment_power_tools',
    '1601 c (compensation)': 'compensation_1601c',
    'diesel/   maintenance/ tollgate / machine / new vehicles/ vehicle registration': 'diesel_tollgate_machine_vehicles_registration',
    'subcon proj. payment /supplier': 'subcon_project_payment_supplier',
    'house rentals / utilities / maintenance': 'house_rentals_utilities_maintenance',
    'surity bond / commission': 'surity_bond_commission_others',
    '5% com': 'five_percent_com',
    '12% vat': 'twelve_percent_vat',
    "uniforms/ ppe's / medical expenses/ medicines": 'uniforms_ppe_medical_medicines_insurance_ids',
    'others (meal, pf, drawings , seminars, permits etc. & const fee)': 'others_meal_pf_load_drawings_seminars_permits_const_fee',
    'total expenses': 'total_expenses',
  }
  return map[h] ?? null
}
