import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { payrollService } from '@/services/payroll'
import type { Payroll, PayrollPeriodKeys } from '@/types'

export function usePayroll(year: number, projectId?: string) {
  return useQuery({
    queryKey: ['payroll', year, projectId],
    queryFn: () => payrollService.list(year, projectId),
  })
}

export function usePayrollMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['payroll'] })

  return {
    create: useMutation({
      mutationFn: (v: Partial<Payroll>) => payrollService.create(v),
      onSuccess: invalidate,
    }),
    updatePeriod: useMutation({
      mutationFn: ({ id, key, amount }: { id: string; key: keyof PayrollPeriodKeys; amount: number }) =>
        payrollService.updatePeriod(id, key, amount),
      onSuccess: invalidate,
    }),
    setLocked: useMutation({
      mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
        payrollService.setLocked(id, locked),
      onSuccess: invalidate,
    }),
  }
}
