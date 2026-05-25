import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  tabs?: { label: string; value: string }[]
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: PageHeaderProps) {
  const sub = subtitle ?? description

  return (
    <header className="px-4 pb-6 pt-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
          {sub && <p className="mt-1 text-sm text-text-secondary">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && tabs.length > 0 && (
        <div className="mt-6 flex gap-1 border-b border-border-subtle">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange?.(tab.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {(!tabs || tabs.length === 0) && <div className="mt-6 border-b border-border" />}
    </header>
  )
}
