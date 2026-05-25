import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { dashboardService } from '@/services/dashboard'
import type { InvoiceStatus, ProjectProfitabilityData } from '@/types'

export function useDashboardSummary(year: number) {
  return useQuery({
    queryKey: ['dashboard', 'summary', year],
    queryFn: () => dashboardService.getSummary(year),
  })
}

export function useMonthlyExpenses(year: number) {
  return useQuery({
    queryKey: ['dashboard', 'monthly-expenses', year],
    queryFn: () => dashboardService.getMonthlyExpenses(year),
  })
}

export function useProjectProfitability(year: number) {
  return useQuery({
    queryKey: ['dashboard', 'profitability', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_monitoring_reports')
        .select('report_description, amount_collected, total_expenses, profit, project:projects(project_name)')
        .eq('report_year', year)
        .is('deleted_at', null)
        .order('profit', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []).map((r) => ({
        project_name:
          (r.project as unknown as { project_name: string } | null)?.project_name ?? r.report_description,
        amount_collected: Number(r.amount_collected),
        total_expenses: Number(r.total_expenses),
        profit: Number(r.profit),
      })) as ProjectProfitabilityData[]
    },
  })
}

export function usePaymentAging() {
  return useQuery({
    queryKey: ['dashboard', 'payment-aging'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_invoices')
        .select('status, amount, amount_paid')
        .is('deleted_at', null)
      if (error) throw error
      const grouped: Record<string, { count: number; total: number }> = {}
      for (const inv of data ?? []) {
        if (!grouped[inv.status]) grouped[inv.status] = { count: 0, total: 0 }
        grouped[inv.status].count++
        grouped[inv.status].total += Number(inv.amount) - Number(inv.amount_paid)
      }
      return Object.entries(grouped).map(([status, { count, total }]) => ({
        status: status as InvoiceStatus,
        count,
        total_amount: total,
      }))
    },
  })
}

export function useOverdueWarnings() {
  return useQuery({
    queryKey: ['dashboard', 'overdue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_invoices')
        .select('*, project:projects(project_id, project_name)')
        .in('status', ['overdue', 'partially_paid'])
        .is('deleted_at', null)
        .order('due_date')
      if (error) throw error
      return data
    },
  })
}
