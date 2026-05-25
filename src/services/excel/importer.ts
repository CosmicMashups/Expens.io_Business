import * as XLSX from 'xlsx'
import type { CurrencyCode } from '@/types'
import type {
  ImportResult,
  PartialDailyExpense,
  PartialPayroll,
  PartialPMR,
  PartialProjectExpense,
} from '@/types/excel'
import type { PayrollPeriodKeys } from '@/types'
import {
  cellToDateString,
  detectWorkbookLayout,
  getCell,
  getRow,
  mapPayDateToColumn,
  normalizeHeader,
  pmrHeaderToColumn,
} from '@/lib/excelLayouts'

async function readWorkbook(file: File | ArrayBuffer) {
  const buffer = file instanceof File ? await file.arrayBuffer() : file
  return XLSX.read(buffer, { type: 'array', cellDates: true })
}

function parseDailySampleSheet(ws: XLSX.WorkSheet, sheetName: string, projectId: string, year: number): ImportResult<PartialDailyExpense> {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
  const valid: PartialDailyExpense[] = []
  const errors: ImportResult<PartialDailyExpense>['errors'] = []

  rows.forEach((row, idx) => {
    const rowNum = idx + 2
    const keys = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [normalizeHeader(k), v]),
    )
    const particulars = String(keys.particulars ?? '').trim()
    const cashOut = Number(keys['cash out'] ?? keys.cashout ?? 0)
    if (!particulars) {
      errors.push({ row: rowNum, message: 'Particulars is required' })
      return
    }
    if (isNaN(cashOut) || cashOut < 0) {
      errors.push({ row: rowNum, message: 'Cash out must be a positive number' })
      return
    }
    const rawDate = keys.date ?? keys.expensesdate
    const expense_date = rawDate instanceof Date
      ? cellToDateString(rawDate)
      : String(rawDate ?? `${year}-01-01`).slice(0, 10)
    const vat = Number(keys.vat ?? 0)
    const vat_rate = cashOut > 0 && vat ? vat / cashOut : 0.12
    const assoc = row[''] ?? Object.values(row)[7]
    valid.push({
      project_id: projectId,
      expense_date,
      particulars,
      account_type: (keys['account type'] as string) ?? null,
      tin: (keys.tin as string) ?? null,
      address: (keys.address as string) ?? null,
      cash_out: cashOut,
      vat_rate,
      currency: 'PHP' as CurrencyCode,
      associated_project_name: assoc != null ? String(assoc) : null,
      expense_category_code: 'others',
    })
  })

  return { sheetName, valid, errors, layout: 'daily_expenses_sample' }
}

function parseDailyPositional(ws: XLSX.WorkSheet, sheetName: string, projectId: string, year: number): ImportResult<PartialDailyExpense> {
  const valid: PartialDailyExpense[] = []
  const errors: ImportResult<PartialDailyExpense>['errors'] = []
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let R = 1; R <= range.e.r; R++) {
    const particulars = String(getCell(ws, R, 1) ?? '').trim()
    if (!particulars) continue
    const cashOut = Number(getCell(ws, R, 5) ?? 0)
    valid.push({
      project_id: projectId,
      expense_date: cellToDateString(getCell(ws, R, 0)) || `${year}-01-01`,
      particulars,
      account_type: String(getCell(ws, R, 2) ?? '') || null,
      tin: String(getCell(ws, R, 3) ?? '') || null,
      address: String(getCell(ws, R, 4) ?? '') || null,
      cash_out: cashOut,
      vat_rate: 0.12,
      currency: 'PHP',
      associated_project_name: String(getCell(ws, R, 7) ?? '') || null,
      expense_category_code: 'others',
    })
  }
  return { sheetName, valid, errors, layout: 'daily_expenses_sample' }
}

export async function importDailyExpenses(
  file: File,
  projectId: string,
  year: number,
): Promise<ImportResult<PartialDailyExpense>[]> {
  const wb = await readWorkbook(file)
  const layout = detectWorkbookLayout(wb, 'daily')
  const results: ImportResult<PartialDailyExpense>[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (layout === 'daily_expenses_sample' && wb.SheetNames.length === 1) {
      const headerRow = getRow(ws, 0)
      if (headerRow.some((h) => String(h).toUpperCase() === 'DATE')) {
        results.push(parseDailySampleSheet(ws, sheetName, projectId, year))
      } else {
        results.push(parseDailyPositional(ws, sheetName, projectId, year))
      }
    } else {
      const monthMatch = sheetName.toLowerCase()
      const monthIdx = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(monthMatch)
      const m = monthIdx >= 0 ? monthIdx + 1 : 1
      const r = parseDailySampleSheet(ws, sheetName, projectId, year)
      r.valid = r.valid.map((v) => ({
        ...v,
        expense_date: v.expense_date?.includes('-') ? v.expense_date : `${year}-${String(m).padStart(2, '0')}-01`,
      }))
      results.push(r)
    }
  }
  return results
}

export async function importPayroll(file: File, defaultProjectId?: string): Promise<ImportResult<PartialPayroll>[]> {
  const wb = await readWorkbook(file)
  const layout = detectWorkbookLayout(wb, 'payroll')
  const results: ImportResult<PartialPayroll>[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const valid: PartialPayroll[] = []
    const errors: ImportResult<PartialPayroll>['errors'] = []

    if (layout === 'payroll_summary') {
      const title = String(getCell(ws, 0, 1) ?? '')
      const yearMatch = title.match(/(\d{4})/)
      const payroll_year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
      const periodRow = getRow(ws, 2)
      const colToKey: Record<number, keyof PayrollPeriodKeys> = {}
      periodRow.forEach((cell, col) => {
        if (col === 0 || String(cell).toUpperCase() === 'TOTAL') return
        const key = mapPayDateToColumn(cell as Date | string)
        if (key) colToKey[col] = key
      })
      const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
      for (let R = 3; R <= range.e.r; R++) {
        const code = String(getCell(ws, R, 0) ?? '').trim()
        if (!code) continue
        const row: PartialPayroll = {
          payroll_year,
          project_id: defaultProjectId ?? '',
          worker_name: code,
          worker_type: 'organization',
          currency: 'PHP',
        }
        for (const [col, key] of Object.entries(colToKey)) {
          row[key] = Number(getCell(ws, R, Number(col)) ?? 0)
        }
        valid.push(row)
      }
      results.push({ sheetName, valid, errors, layout: 'payroll_summary' })
    } else {
      const year = parseInt(sheetName, 10) || new Date().getFullYear()
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: 0 })
      rows.forEach((row, idx) => {
        const workerName = String(row.WorkerName ?? row.Employee ?? '').trim()
        if (!workerName) {
          errors.push({ row: idx + 2, message: 'Worker name required' })
          return
        }
        valid.push({
          payroll_year: year,
          project_id: defaultProjectId ?? '',
          worker_name: workerName,
          worker_type: row.WorkerType === 'organization' ? 'organization' : 'employee',
          currency: 'PHP',
          january_15: Number(row.January15 ?? 0),
          january_31: Number(row.January31 ?? 0),
          february_15: Number(row.February15 ?? 0),
          february_29: Number(row.February29 ?? 0),
          march_15: Number(row.March15 ?? 0),
          march_30: Number(row.March30 ?? 0),
          april_15: Number(row.April15 ?? 0),
          april_30: Number(row.April30 ?? 0),
          may_15: Number(row.May15 ?? 0),
          may_30: Number(row.May30 ?? 0),
          june_15: Number(row.June15 ?? 0),
          june_30: Number(row.June30 ?? 0),
          july_15: Number(row.July15 ?? 0),
          july_30: Number(row.July30 ?? 0),
          august_15: Number(row.August15 ?? 0),
          august_30: Number(row.August30 ?? 0),
          september_15: Number(row.September15 ?? 0),
          september_30: Number(row.September30 ?? 0),
          october_15: Number(row.October15 ?? 0),
          october_30: Number(row.October30 ?? 0),
          november_15: Number(row.November15 ?? 0),
          november_30: Number(row.November30 ?? 0),
          december_15: Number(row.December15 ?? 0),
          december_31: Number(row.December31 ?? 0),
        })
      })
      results.push({ sheetName, valid, errors, layout: 'payroll_generic' })
    }
  }
  return results
}

export async function importProjectExpenses(
  file: File,
  projectIdBySheet: Record<string, string>,
): Promise<ImportResult<PartialProjectExpense>[]> {
  const wb = await readWorkbook(file)
  const layout = detectWorkbookLayout(wb, 'project_expenses')
  const results: ImportResult<PartialProjectExpense>[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const project_id = projectIdBySheet[sheetName] ?? ''
    const valid: PartialProjectExpense[] = []
    const errors: ImportResult<PartialProjectExpense>['errors'] = []

    if (layout === 'project_expenses_positional') {
      const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
      for (let R = 2; R <= range.e.r; R++) {
        const particulars = String(getCell(ws, R, 2) ?? '').trim()
        if (!particulars) continue
        const cash_out = Number(getCell(ws, R, 5) ?? 0)
        valid.push({
          project_id,
          expense_date: cellToDateString(getCell(ws, R, 1)),
          particulars,
          account_type: String(getCell(ws, R, 3) ?? '') || null,
          tin: String(getCell(ws, R, 4) ?? '') || null,
          cash_out,
          currency: 'PHP',
        })
      }
    } else {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
      rows.forEach((row) => {
        const particulars = String(row.Particulars ?? '').trim()
        if (!particulars) return
        valid.push({
          project_id,
          expense_date: cellToDateString(row.Date),
          particulars,
          account_type: (row.AccountType as string) ?? null,
          tin: (row.TIN as string) ?? null,
          cash_out: Number(row.CashOut ?? 0),
          currency: 'PHP',
        })
      })
    }
    results.push({ sheetName, valid, errors, layout })
  }
  return results
}

export async function importProjectMonitoring(file: File): Promise<ImportResult<PartialPMR>[]> {
  const wb = await readWorkbook(file)
  const results: ImportResult<PartialPMR>[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const yearMatch = sheetName.match(/(\d{4})/)
    const report_year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
    const valid: PartialPMR[] = []
    const errors: ImportResult<PartialPMR>['errors'] = []

    const headerRow = getRow(ws, 1)
    const colMap: Record<number, string> = {}
    headerRow.forEach((h, col) => {
      if (h == null) return
      const field = pmrHeaderToColumn(String(h))
      if (field) colMap[col] = field
    })

    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
    for (let R = 2; R <= range.e.r; R++) {
      const report_id = String(getCell(ws, R, 0) ?? '').trim()
      const projectName = String(getCell(ws, R, 1) ?? '').trim()
      if (!report_id && !projectName) continue

      const row: PartialPMR = {
        report_year,
        report_id: report_id || `ROW-${R + 1}`,
        report_description: projectName,
        _project_name: projectName,
        client: String(getCell(ws, R, 2) ?? '') || null,
        date_start: cellToDateString(getCell(ws, R, 3)) || null,
        date_finish: cellToDateString(getCell(ws, R, 4)) || null,
        accomplishment: Number(getCell(ws, R, 5) ?? 0) * (Number(getCell(ws, R, 5) ?? 0) <= 1 ? 100 : 1),
        remarks: String(getCell(ws, R, 6) ?? '') || null,
        contracted_amount: Number(getCell(ws, R, 7) ?? 0),
        tax_amount: Number(getCell(ws, R, 8) ?? 0),
        amount_collected: Number(getCell(ws, R, 9) ?? 0),
        iso_certification: 0,
      }

      for (const [col, field] of Object.entries(colMap)) {
        if (field === 'report_description' || field === 'total_expenses') continue
        const v = getCell(ws, R, Number(col))
        if (v != null && field !== 'client') {
          (row as Record<string, unknown>)[field] = Number(v) || v
        }
      }
      const totalIdx = headerRow.findIndex((h) => String(h).toLowerCase().includes('total expenses'))
      if (totalIdx >= 0) row.total_expenses = Number(getCell(ws, R, totalIdx) ?? 0)

      valid.push(row)
    }
    results.push({ sheetName, valid, errors, layout: 'pmr_contracted_report' })
  }
  return results
}
