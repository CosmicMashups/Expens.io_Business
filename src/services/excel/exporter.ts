import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { MONTH_NAMES, PMR_EXCEL_COLUMNS, PMR_SAMPLE_ROW2_HEADERS } from '@/lib/constants'
import { PAYROLL_PERIOD_COLUMNS } from '@/types'
import type {
  DailyExpense,
  Payroll,
  PayrollPeriodKeys,
  ProjectExpense,
  ProjectMonitoringReport,
} from '@/types'
import { PAYROLL_DATE_TO_COLUMN } from '@/lib/excelLayouts'

export function exportProjectMonitoringSample(
  reports: ProjectMonitoringReport[],
  year: number,
  filename?: string,
) {
  const wb = XLSX.utils.book_new()
  const title = `PROJECT MONITORING REPORT ${format(new Date(), 'MMMM d, yyyy').toUpperCase()}`
  const data: unknown[][] = [[title]]
  data.push([...PMR_SAMPLE_ROW2_HEADERS])

  for (const r of reports) {
    const row: unknown[] = new Array(PMR_SAMPLE_ROW2_HEADERS.length).fill(null)
    row[0] = r.report_id
    row[1] = r.report_description
    row[2] = r.client
    row[3] = r.date_start
    row[4] = r.date_finish
    row[5] = r.accomplishment > 1 ? r.accomplishment / 100 : r.accomplishment
    row[6] = r.remarks
    row[7] = r.contracted_amount
    row[8] = r.tax_amount
    row[9] = r.amount_collected
    row[10] = r.balance_to_be_collected
    row[12] = r.material_cost_rental_scaffolds_tools_equipments
    row[13] = r.coil_breakdown
    row[14] = r.labor_cost
    row[15] = r.company_outing_13th_month
    row[16] = r.mandatories
    row[17] = r.equipment_power_tools
    row[18] = r.compensation_1601c
    row[19] = r.diesel_tollgate_machine_vehicles_registration
    row[21] = r.subcon_project_payment_supplier
    row[22] = r.house_rentals_utilities_maintenance
    row[23] = r.surity_bond_commission_others
    row[24] = r.five_percent_com
    row[25] = r.twelve_percent_vat
    row[26] = r.uniforms_ppe_medical_medicines_insurance_ids
    row[28] = r.others_meal_pf_load_drawings_seminars_permits_const_fee
    row[29] = r.total_expenses
    row[30] = r.profit
    data.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, `CONTRACTED REPORT ${year}`)
  XLSX.writeFile(wb, filename ?? `ProjectMonitoringReport_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}

export function exportProjectMonitoring(
  reportsByYear: Record<number, ProjectMonitoringReport[]>,
  filename?: string,
  useSampleLayout = true,
) {
  if (useSampleLayout) {
    for (const [year, reports] of Object.entries(reportsByYear)) {
      exportProjectMonitoringSample(reports, Number(year), filename)
      return
    }
  }
  const wb = XLSX.utils.book_new()
  for (const [year, reports] of Object.entries(reportsByYear)) {
    const rows = reports.map((r) => {
      const row: Record<string, unknown> = {}
      for (const col of PMR_EXCEL_COLUMNS) {
        row[col.header] = r[col.key as keyof ProjectMonitoringReport] ?? 0
      }
      return row
    })
    const ws = XLSX.utils.json_to_sheet(rows, { header: PMR_EXCEL_COLUMNS.map((c) => c.header) })
    XLSX.utils.book_append_sheet(wb, ws, String(year))
  }
  XLSX.writeFile(wb, filename ?? `ProjectMonitoringReport_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}

export function exportDailyExpenses(
  expensesByMonth: Record<number, DailyExpense[]>,
  year: number,
  filename?: string,
  singleSheet = false,
) {
  const wb = XLSX.utils.book_new()
  const headers = ['DATE', 'Particulars', 'Account Type', 'TIN', 'Address', 'CASH OUT', 'VAT', '']

  if (singleSheet) {
    const all = Object.values(expensesByMonth).flat()
    const rows = all.map((e) => [
      e.expense_date,
      e.particulars,
      e.account_type ?? '',
      e.tin ?? '',
      e.address ?? '',
      e.cash_out,
      e.vat,
      e.associated_project_name ?? '',
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  } else {
    for (let m = 1; m <= 12; m++) {
      const expenses = expensesByMonth[m] ?? []
      const rows = expenses.map((e) => [
        e.expense_date,
        e.particulars,
        e.account_type ?? '',
        e.tin ?? '',
        e.address ?? '',
        e.cash_out,
        e.vat,
        e.associated_project_name ?? '',
      ])
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      XLSX.utils.book_append_sheet(wb, ws, MONTH_NAMES[m - 1])
    }
  }
  XLSX.writeFile(wb, filename ?? `DailyExpenses_${year}_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}

export function exportProjectExpenses(
  expensesByProject: Record<string, { name: string; expenses: ProjectExpense[] }>,
  year: number,
  filename?: string,
) {
  const wb = XLSX.utils.book_new()
  for (const { name, expenses } of Object.values(expensesByProject)) {
    const data: unknown[][] = [[name.substring(0, 31)]]
    data.push([])
    for (const e of expenses) {
      data.push([null, e.expense_date, e.particulars, e.account_type ?? '', e.tin ?? '', e.cash_out])
    }
    const ws = XLSX.utils.aoa_to_sheet(data)
    const sheetName = name.substring(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }
  XLSX.writeFile(wb, filename ?? `ProjectExpenses_${year}_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}

export function exportPayroll(payrollByYear: Record<number, Payroll[]>, filename?: string, sampleLayout = true) {
  const wb = XLSX.utils.book_new()

  for (const [year, rows] of Object.entries(payrollByYear)) {
    const payrollRows = rows as Payroll[]
    if (sampleLayout) {
      const data: unknown[][] = []
      data.push([null, `PAYROLL SUMMARY ${year}`])
      data.push(['PROJECTS', 'PAYROLL PERIOD'])
      const dateRow: unknown[] = [null]
      const colKeys: Array<keyof PayrollPeriodKeys> = []
      for (const col of PAYROLL_PERIOD_COLUMNS) {
        const d = Object.entries(PAYROLL_DATE_TO_COLUMN).find(([, k]) => k === col.key)?.[0]
        dateRow.push(d ?? col.label)
        colKeys.push(col.key)
      }
      dateRow.push('TOTAL')
      data.push(dateRow)

      for (const p of rows) {
        const row: unknown[] = [p.project?.project_id ?? p.worker_name]
        for (const key of colKeys) row.push(p[key] ?? 0)
        row.push(p.total_payroll)
        data.push(row)
      }
      const ws = XLSX.utils.aoa_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, 'PAYROLL SUMMARY')
    } else {
      const periodHeaders = PAYROLL_PERIOD_COLUMNS.map((p) => p.label)
      const headers = ['ProjectID', 'WorkerName', 'WorkerType', ...periodHeaders, 'TotalPayroll']
      const sheetRows = payrollRows.map((p: Payroll) => {
        const row: Record<string, unknown> = {
          ProjectID: p.project?.project_id ?? p.project_id,
          WorkerName: p.worker_name,
          WorkerType: p.worker_type,
        }
        for (const col of PAYROLL_PERIOD_COLUMNS) row[col.label] = p[col.key] ?? 0
        row.TotalPayroll = p.total_payroll
        return row
      })
      const ws = XLSX.utils.json_to_sheet(sheetRows, { header: headers })
      XLSX.utils.book_append_sheet(wb, ws, String(year))
    }
  }
  XLSX.writeFile(wb, filename ?? `PayrollSummary_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}
