import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types'

export interface AuditFilters {
  from?: string
  to?: string
  actorId?: string
  tableName?: string
  action?: string
}

export const auditLogsService = {
  async list(filters: AuditFilters = {}, limit = 100) {
    let q = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (filters.from) q = q.gte('created_at', filters.from)
    if (filters.to) q = q.lte('created_at', filters.to)
    if (filters.actorId) q = q.eq('actor_id', filters.actorId)
    if (filters.tableName) q = q.eq('table_name', filters.tableName)
    if (filters.action) q = q.eq('action', filters.action)

    const { data, error } = await q
    if (error) throw error
    return data as AuditLog[]
  },
}
