import { supabase } from '@/lib/supabase'
import type { Payroll, PayrollPeriodKeys } from '@/types'

export const payrollService = {
  async list(year: number, projectId?: string) {
    let q = supabase
      .from('payroll')
      .select('*, project:projects(project_id, project_name)')
      .eq('payroll_year', year)
      .is('deleted_at', null)
      .order('worker_name')
    if (projectId) q = q.eq('project_id', projectId)
    const { data, error } = await q
    if (error) throw error
    return data as Payroll[]
  },

  async create(values: Partial<Payroll>) {
    const { total_payroll: _t, ...rest } = values
    void _t
    const { data, error } = await supabase.from('payroll').insert(rest).select().single()
    if (error) throw error
    return data as Payroll
  },

  async updatePeriod(id: string, key: keyof PayrollPeriodKeys, amount: number) {
    const { data, error } = await supabase
      .from('payroll')
      .update({ [key]: amount })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Payroll
  },

  async update(id: string, values: Partial<Payroll>) {
    const { total_payroll: _t, ...rest } = values
    void _t
    const { data, error } = await supabase.from('payroll').update(rest).eq('id', id).select().single()
    if (error) throw error
    return data as Payroll
  },

  async setLocked(id: string, locked: boolean) {
    const { data, error } = await supabase
      .from('payroll')
      .update({ is_locked: locked })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Payroll
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from('payroll')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async bulkInsert(rows: Partial<Payroll>[]) {
    const cleaned = rows.map(({ total_payroll: _t, ...r }) => r)
    const { data, error } = await supabase.from('payroll').insert(cleaned).select()
    if (error) throw error
    return data as Payroll[]
  },
}
