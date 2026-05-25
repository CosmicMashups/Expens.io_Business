import { supabase } from '@/lib/supabase'
import type { ProjectExpense } from '@/types'

export interface ProjectExpenseFilters {
  year?: number
  projectId?: string
  approvalStatus?: string
}

export const projectExpensesService = {
  async list(filters: ProjectExpenseFilters = {}) {
    let q = supabase
      .from('project_expenses')
      .select('*, project:projects(project_id, project_name)')
      .is('deleted_at', null)
      .order('expense_date', { ascending: false })

    if (filters.projectId) q = q.eq('project_id', filters.projectId)
    if (filters.approvalStatus) q = q.eq('approval_status', filters.approvalStatus)
    if (filters.year) {
      q = q.gte('expense_date', `${filters.year}-01-01`).lte('expense_date', `${filters.year}-12-31`)
    }
    const { data, error } = await q
    if (error) throw error
    return data as ProjectExpense[]
  },

  async create(values: Partial<ProjectExpense>) {
    const { data, error } = await supabase.from('project_expenses').insert(values).select().single()
    if (error) throw error
    return data as ProjectExpense
  },

  async update(id: string, values: Partial<ProjectExpense>) {
    const { data, error } = await supabase.from('project_expenses').update(values).eq('id', id).select().single()
    if (error) throw error
    return data as ProjectExpense
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from('project_expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async bulkInsert(rows: Partial<ProjectExpense>[]) {
    const { data, error } = await supabase.from('project_expenses').insert(rows).select()
    if (error) throw error
    return data as ProjectExpense[]
  },
}
