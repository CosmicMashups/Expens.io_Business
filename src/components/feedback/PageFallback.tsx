import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'

export function PageFallback() {
  return (
    <div className="p-8">
      <LoadingSkeleton variant="kpi" count={3} />
    </div>
  )
}
