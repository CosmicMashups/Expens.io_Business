import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectExpensesService, type ProjectExpenseFilters } from '@/services/projectExpenses'
import type { ProjectExpense } from '@/types'

export function useProjectExpenses(filters: ProjectExpenseFilters) {
  return useQuery({
    queryKey: ['project-expenses', filters],
    queryFn: () => projectExpensesService.list(filters),
  })
}

export function useProjectExpenseMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['project-expenses'] })

  return {
    create: useMutation({
      mutationFn: (v: Partial<ProjectExpense>) => projectExpensesService.create(v),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, values }: { id: string; values: Partial<ProjectExpense> }) =>
        projectExpensesService.update(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => projectExpensesService.softDelete(id),
      onSuccess: invalidate,
    }),
    bulkInsert: useMutation({
      mutationFn: (rows: Partial<ProjectExpense>[]) => projectExpensesService.bulkInsert(rows),
      onSuccess: invalidate,
    }),
  }
}
