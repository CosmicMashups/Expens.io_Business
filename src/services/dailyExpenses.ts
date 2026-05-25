import { supabase } from '@/lib/supabase'
import type { DailyExpense, DailyExpenseFormValues } from '@/types'

export interface DailyExpenseFilters {
  year?: number
  month?: number
  projectId?: string
  category?: string
  approvalStatus?: string
}

export const dailyExpensesService = {
  async list(filters: DailyExpenseFilters = {}) {
    let q = supabase
      .from('daily_expenses')
      .select('*, project:projects(project_id, project_name)')
      .is('deleted_at', null)
      .order('expense_date', { ascending: false })

    if (filters.projectId) q = q.eq('project_id', filters.projectId)
    if (filters.category) q = q.eq('expense_category_code', filters.category)
    if (filters.approvalStatus) q = q.eq('approval_status', filters.approvalStatus)
    if (filters.year) {
      q = q.gte('expense_date', `${filters.year}-01-01`).lte('expense_date', `${filters.year}-12-31`)
    }
    const { data, error } = await q
    if (error) throw error
    let rows = data as DailyExpense[]
    if (filters.month) {
      rows = rows.filter((r) => new Date(r.expense_date).getMonth() + 1 === filters.month)
    }
    return rows
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('daily_expenses')
      .select('*, project:projects(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as DailyExpense
  },

  async create(values: DailyExpenseFormValues & { created_by?: string }) {
    const { data, error } = await supabase.from('daily_expenses').insert(values).select().single()
    if (error) throw error
    return data as DailyExpense
  },

  async update(id: string, values: Partial<DailyExpenseFormValues>) {
    const { vat: _v, ...rest } = values as Partial<DailyExpense>
    void _v
    const { data, error } = await supabase.from('daily_expenses').update(rest).eq('id', id).select().single()
    if (error) throw error
    return data as DailyExpense
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from('daily_expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async bulkInsert(rows: Partial<DailyExpense>[]) {
    const { data, error } = await supabase.from('daily_expenses').insert(rows).select()
    if (error) throw error
    return data as DailyExpense[]
  },
}
