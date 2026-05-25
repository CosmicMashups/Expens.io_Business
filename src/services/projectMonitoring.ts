import { supabase } from '@/lib/supabase'
import {
  EXPENSE_CATEGORY_TO_PMR_COLUMN,
  PMR_EXPENSE_COLUMN_KEYS,
  type ProjectMonitoringReport,
} from '@/types'

export const projectMonitoringService = {
  async listByYear(year: number, includeDeleted = false) {
    let q = supabase
      .from('project_monitoring_reports')
      .select('*, project:projects(project_id, project_name, status)')
      .eq('report_year', year)
    if (!includeDeleted) q = q.is('deleted_at', null)
    const { data, error } = await q.order('report_id')
    if (error) throw error
    return data as ProjectMonitoringReport[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('project_monitoring_reports')
      .select('*, project:projects(project_id, project_name, status)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as ProjectMonitoringReport
  },

  async create(values: Partial<ProjectMonitoringReport>) {
    const { data, error } = await supabase
      .from('project_monitoring_reports')
      .insert(values)
      .select()
      .single()
    if (error) throw error
    return data as ProjectMonitoringReport
  },

  async update(id: string, values: Partial<ProjectMonitoringReport>) {
    const { profit: _p, balance_to_be_collected: _b, ...rest } = values
    void _p
    void _b
    const { data, error } = await supabase
      .from('project_monitoring_reports')
      .update(rest)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ProjectMonitoringReport
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from('project_monitoring_reports')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async aggregateExpensesIntoReport(reportId: string) {
    const report = await this.getById(reportId)
    const year = report.report_year
    const projectId = report.project_id

    const { data: expenses, error } = await supabase
      .from('daily_expenses')
      .select('expense_category_code, cash_out')
      .eq('project_id', projectId)
      .gte('expense_date', `${year}-01-01`)
      .lte('expense_date', `${year}-12-31`)
      .is('deleted_at', null)

    if (error) throw error

    const sums: Record<string, number> = {}
    for (const exp of expenses ?? []) {
      const col = exp.expense_category_code ?? 'others'
      sums[col] = (sums[col] ?? 0) + Number(exp.cash_out)
    }

    const updates: Record<string, number> = {}
    for (const key of PMR_EXPENSE_COLUMN_KEYS) {
      updates[key] = 0
    }
    for (const [code, amount] of Object.entries(sums)) {
      const col = EXPENSE_CATEGORY_TO_PMR_COLUMN[code]
      if (col && col in updates) updates[col as string] = amount
    }
    updates.total_expenses = Object.values(updates).reduce((a, b) => a + b, 0)

    const { data: updated, error: updateError } = await supabase
      .from('project_monitoring_reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single()
    if (updateError) throw updateError
    return updated as ProjectMonitoringReport
  },

  async aggregateAllForYear(year: number) {
    const reports = await this.listByYear(year)
    const results: ProjectMonitoringReport[] = []
    for (const r of reports) {
      results.push(await this.aggregateExpensesIntoReport(r.id))
    }
    return results
  },
}
