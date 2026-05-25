import { cn } from '@/lib/utils'

type Variant = 'text' | 'card' | 'table-row' | 'kpi'

const variantClass: Record<Variant, string> = {
  text: 'h-4 w-32',
  card: 'h-32 w-full',
  'table-row': 'h-12 w-full',
  kpi: 'h-24 w-full',
}

export function LoadingSkeleton({
  variant = 'text',
  className,
  count = 1,
}: {
  variant?: Variant
  className?: string
  count?: number
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('animate-pulse rounded-lg bg-elevated', variantClass[variant], className)}
        />
      ))}
    </>
  )
}
