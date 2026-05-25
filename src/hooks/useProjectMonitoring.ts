import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectMonitoringService } from '@/services/projectMonitoring'
import type { ProjectMonitoringReport } from '@/types'

export function useProjectMonitoring(year: number) {
  return useQuery({
    queryKey: ['project-monitoring', year],
    queryFn: () => projectMonitoringService.listByYear(year),
  })
}

export function useProjectMonitoringMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['project-monitoring'] })

  return {
    create: useMutation({
      mutationFn: (v: Partial<ProjectMonitoringReport>) => projectMonitoringService.create(v),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, values }: { id: string; values: Partial<ProjectMonitoringReport> }) =>
        projectMonitoringService.update(id, values),
      onSuccess: invalidate,
    }),
    aggregate: useMutation({
      mutationFn: (reportId: string) => projectMonitoringService.aggregateExpensesIntoReport(reportId),
      onSuccess: invalidate,
    }),
    aggregateYear: useMutation({
      mutationFn: (year: number) => projectMonitoringService.aggregateAllForYear(year),
      onSuccess: invalidate,
    }),
    bulkInsert: useMutation({
      mutationFn: (rows: Partial<ProjectMonitoringReport>[]) =>
        projectMonitoringService.bulkInsert(rows),
      onSuccess: invalidate,
    }),
  }
}
