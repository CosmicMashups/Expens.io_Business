import type { ApprovalQueueItem } from '@/types'
import { StatusBadge } from '@/components/badges/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const entityStyles: Record<string, string> = {
  daily_expense: 'bg-accent-muted text-accent',
  project_expense: 'bg-teal/10 text-teal',
  payroll: 'bg-teal/10 text-teal',
  project_monitoring_report: 'bg-purple-500/10 text-purple-400',
}

export function ApprovalCard({
  item,
  onApprove,
  onReject,
  onViewDetail,
  selected,
  onSelect,
}: {
  item: ApprovalQueueItem
  onApprove?: () => void
  onReject?: () => void
  onViewDetail?: () => void
  selected?: boolean
  onSelect?: (checked: boolean) => void
}) {
  const entityLabel = item.entity_type.replace(/_/g, ' ')
  const isPending = item.status === 'pending'

  return (
    <div
      className={cn(
        'rounded-xl border border-border-subtle bg-card p-5 transition-colors hover:border-border-subtle hover:shadow-elevated',
        selected && 'ring-2 ring-accent/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {onSelect && isPending && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle accent-accent"
              aria-label="Select item"
            />
          )}
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 font-mono text-xs capitalize',
              entityStyles[item.entity_type] ?? 'bg-elevated text-text-secondary',
            )}
          >
            {entityLabel}
          </span>
        </div>
        <span className="font-mono text-xs text-text-tertiary">{formatDate(item.requested_at)}</span>
      </div>
      <p className="mt-3 font-mono text-xs text-text-tertiary">{item.entity_id.slice(0, 12)}…</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={item.status} />
        <div className="flex gap-2">
          {onViewDetail && (
            <Button variant="ghost" size="sm" onClick={onViewDetail}>
              View
            </Button>
          )}
          {isPending && onApprove && (
            <Button variant="success" size="sm" onClick={onApprove}>
              Approve
            </Button>
          )}
          {isPending && onReject && (
            <Button variant="danger" size="sm" onClick={onReject}>
              Reject
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
