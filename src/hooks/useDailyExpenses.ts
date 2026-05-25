import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dailyExpensesService, type DailyExpenseFilters } from '@/services/dailyExpenses'
import type { DailyExpense, DailyExpenseFormValues } from '@/types'

export function useDailyExpenses(filters: DailyExpenseFilters) {
  return useQuery({
    queryKey: ['daily-expenses', filters],
    queryFn: () => dailyExpensesService.list(filters),
  })
}

export function useDailyExpenseMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['daily-expenses'] })

  return {
    create: useMutation({
      mutationFn: (v: DailyExpenseFormValues & { created_by?: string }) =>
        dailyExpensesService.create(v),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, values }: { id: string; values: Partial<DailyExpenseFormValues> }) =>
        dailyExpensesService.update(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => dailyExpensesService.softDelete(id),
      onSuccess: invalidate,
    }),
    bulkInsert: useMutation({
      mutationFn: (rows: Partial<DailyExpense>[]) => dailyExpensesService.bulkInsert(rows),
      onSuccess: invalidate,
    }),
  }
}
