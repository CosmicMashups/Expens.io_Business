import { useState } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { DataTable } from '@/components/tables/DataTable'
import { selectClass } from '@/lib/uiClasses'
import { formatDate } from '@/lib/utils'
import type { AuditLog } from '@/types'

export function AuditLogsPage() {
  const [tableName, setTableName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { data: logs = [], isLoading } = useAuditLogs({ tableName: tableName || undefined })

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader title="Audit Logs" subtitle="Immutable change history" />
      <select
        className={`mb-4 ${selectClass}`}
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
        aria-label="Filter by module"
      >
        <option value="">All modules</option>
        {['projects', 'daily_expenses', 'project_expenses', 'payroll', 'project_monitoring_reports'].map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <DataTable<AuditLog>
        columns={[
          {
            id: 'created_at',
            header: 'Timestamp',
            cell: (r) => (
              <span className="font-mono text-xs text-text-secondary">{formatDate(r.created_at)}</span>
            ),
          },
          { id: 'actor_email', header: 'Actor', accessorKey: 'actor_email' },
          { id: 'table_name', header: 'Module', accessorKey: 'table_name' },
          { id: 'action', header: 'Action', accessorKey: 'action' },
          {
            id: 'record_id',
            header: 'Record ID',
            cell: (r) => (
              <span className="font-mono text-xs">{r.record_id?.slice(0, 8) ?? '—'}…</span>
            ),
          },
        ]}
        data={logs}
        loading={isLoading}
        onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
        emptyState={{
          title: 'No audit events found',
          description: 'Activity will appear here as changes are made.',
        }}
        caption="Audit logs"
      />

      {expandedId && (
        <div className="mt-2 rounded-xl bg-base p-4">
          {(() => {
            const log = logs.find((l) => l.id === expandedId)
            if (!log) return null
            return (
              <div className="grid gap-4 md:grid-cols-2">
                {log.old_data && (
                  <div>
                    <p className="mb-2 font-mono text-xs uppercase text-danger">Before</p>
                    <pre className="overflow-auto rounded-lg bg-surface p-3 font-mono text-xs text-danger">
                      {JSON.stringify(log.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_data && (
                  <div>
                    <p className="mb-2 font-mono text-xs uppercase text-success">After</p>
                    <pre className="overflow-auto rounded-lg bg-surface p-3 font-mono text-xs text-success">
                      {JSON.stringify(log.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
