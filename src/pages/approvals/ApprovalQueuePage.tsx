import { useState } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { useApprovalQueue, useReviewApproval } from '@/hooks/useApprovals'
import { ApprovalCard } from '@/components/cards/ApprovalCard'
import { SectionHeader } from '@/components/primitives/SectionHeader'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import type { ApprovalEntity } from '@/types'

type Tab = 'all' | 'pending' | 'approved' | 'rejected'

export function ApprovalQueuePage() {
  const [tab, setTab] = useState<Tab>('pending')
  const { data: allItems = [], isLoading: allLoading } = useApprovalQueue()
  const { data: pendingItems = [] } = useApprovalQueue('pending')
  const { data: approvedItems = [] } = useApprovalQueue('approved')
  const { data: rejectedItems = [] } = useApprovalQueue('rejected')
  const review = useReviewApproval()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const items =
    tab === 'all'
      ? allItems
      : tab === 'pending'
        ? pendingItems
        : tab === 'approved'
          ? approvedItems
          : rejectedItems

  const isLoading = tab === 'all' ? allLoading : false

  const counts = {
    all: allItems.length,
    pending: pendingItems.length,
    approved: approvedItems.length,
    rejected: rejectedItems.length,
  }

  const reviewItem = (item: (typeof items)[0], decision: 'approved' | 'rejected') => {
    review.mutate(
      {
        queueId: item.id,
        entityType: item.entity_type as ApprovalEntity,
        entityId: item.entity_id,
        decision,
      },
      {
        onSuccess: () => toast.success(decision === 'approved' ? 'Approved' : 'Rejected'),
      },
    )
  }

  const bulkApprove = () => {
    const pending = items.filter((i) => i.status === 'pending' && selected.has(i.id))
    pending.forEach((item) => reviewItem(item, 'approved'))
    setSelected(new Set())
  }

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.entity_type
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title="Approvals"
        tabs={[
          { label: `All (${counts.all})`, value: 'all' },
          { label: `Pending (${counts.pending})`, value: 'pending' },
          { label: `Approved (${counts.approved})`, value: 'approved' },
          { label: `Rejected (${counts.rejected})`, value: 'rejected' },
        ]}
        activeTab={tab}
        onTabChange={(t) => setTab(t as Tab)}
      />

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="All caught up"
          description="No items pending your review."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([entityType, groupItems]) => (
            <div key={entityType}>
              <SectionHeader label={entityType.replace(/_/g, ' ')} />
              <div className="space-y-4">
                {groupItems.map((item) => (
                  <ApprovalCard
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    onSelect={
                      tab === 'pending'
                        ? (checked) => {
                            const next = new Set(selected)
                            if (checked) next.add(item.id)
                            else next.delete(item.id)
                            setSelected(next)
                          }
                        : undefined
                    }
                    onApprove={() => reviewItem(item, 'approved')}
                    onReject={() => reviewItem(item, 'rejected')}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected.size > 0 && tab === 'pending' && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border-subtle bg-elevated px-6 py-3 shadow-elevated">
          <span className="text-sm text-text-secondary">{selected.size} selected</span>
          <Button variant="success" size="sm" onClick={bulkApprove}>
            Approve All Selected
          </Button>
        </div>
      )}
    </div>
  )
}
