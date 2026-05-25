import { supabase } from '@/lib/supabase'
import type { ApprovalEntity, ApprovalQueueItem } from '@/types'

export const approvalsService = {
  async list(status?: string) {
    let q = supabase
      .from('approval_queue')
      .select('*, requester:user_profiles!approval_queue_requested_by_fkey(full_name, email), reviewer:user_profiles!approval_queue_reviewed_by_fkey(full_name, email)')
      .order('requested_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) {
      const fallback = await supabase
        .from('approval_queue')
        .select('*')
        .order('requested_at', { ascending: false })
      if (fallback.error) throw fallback.error
      return fallback.data as ApprovalQueueItem[]
    }
    return data as ApprovalQueueItem[]
  },

  async submit(entityType: ApprovalEntity, entityId: string, requestedBy: string) {
    const { error } = await supabase.from('approval_queue').insert({
      entity_type: entityType,
      entity_id: entityId,
      requested_by: requestedBy,
    })
    if (error) throw error
  },
}
