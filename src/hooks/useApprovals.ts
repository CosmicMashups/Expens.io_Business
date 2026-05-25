import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { ApprovalEntity, ApprovalQueueItem } from '@/types'

export function useApprovalQueue(status?: 'pending' | 'approved' | 'rejected') {
  return useQuery({
    queryKey: ['approvals', status],
    queryFn: async () => {
      let q = supabase.from('approval_queue').select('*').order('requested_at', { ascending: false })
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return data as ApprovalQueueItem[]
    },
  })
}

export function useSubmitForApproval() {
  const profile = useAuthStore((s) => s.profile)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: ApprovalEntity; entityId: string }) => {
      const { error } = await supabase.from('approval_queue').insert({
        entity_type: entityType,
        entity_id: entityId,
        requested_by: profile!.id,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  })
}

export function useReviewApproval() {
  const profile = useAuthStore((s) => s.profile)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      queueId,
      entityType,
      entityId,
      decision,
      notes,
    }: {
      queueId: string
      entityType: ApprovalEntity
      entityId: string
      decision: 'approved' | 'rejected'
      notes?: string
    }) => {
      await supabase
        .from('approval_queue')
        .update({
          status: decision,
          reviewed_by: profile!.id,
          reviewed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', queueId)

      const tableMap: Record<ApprovalEntity, string> = {
        daily_expense: 'daily_expenses',
        project_expense: 'project_expenses',
        payroll: 'payroll',
        project_monitoring_report: 'project_monitoring_reports',
      }
      await supabase
        .from(tableMap[entityType])
        .update({
          approval_status: decision,
          approved_by: decision === 'approved' ? profile!.id : null,
          approved_at: decision === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', entityId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] })
      qc.invalidateQueries({ queryKey: ['daily-expenses'] })
      qc.invalidateQueries({ queryKey: ['project-expenses'] })
      qc.invalidateQueries({ queryKey: ['payroll'] })
      qc.invalidateQueries({ queryKey: ['project-monitoring'] })
    },
  })
}
