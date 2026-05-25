import { supabase } from '@/lib/supabase'
import type { DashboardSummary, MonthlyExpenseData } from '@/types'

export const dashboardService = {
  async getSummary(year: number) {
    const { data, error } = await supabase.rpc('get_dashboard_summary', { p_year: year })
    if (error) throw error
    return (data?.[0] ?? {
      total_expenses_ytd: 0,
      total_payroll_ytd: 0,
      active_projects_count: 0,
      total_amount_collected: 0,
      total_outstanding_balance: 0,
      total_profit_ytd: 0,
    }) as DashboardSummary
  },

  async getMonthlyExpenses(year: number) {
    const { data, error } = await supabase.rpc('get_monthly_expenses', { p_year: year })
    if (error) throw error
    return (data ?? []) as MonthlyExpenseData[]
  },
}
