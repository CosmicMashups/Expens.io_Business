import { Badge } from '@/components/ui/badge'
import type { ApprovalStatus } from '@/types'

const config: Record<ApprovalStatus, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending Approval' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const c = config[status]
  return <Badge variant={c.variant}>{c.label}</Badge>
}
