import { useQuery } from '@tanstack/react-query'
import { auditLogsService, type AuditFilters } from '@/services/auditLogs'

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditLogsService.list(filters),
  })
}
