import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          'relative flex h-full w-full max-w-[480px] flex-col border-l border-border-subtle bg-surface shadow-elevated',
          'animate-in slide-in-from-right duration-250 max-md:max-w-full',
        )}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-6">
          <div>
            <h2 id="drawer-title" className="font-display text-lg font-bold text-text-primary">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {actions && (
          <footer className="sticky bottom-0 border-t border-border-subtle bg-surface px-6 py-4">
            {actions}
          </footer>
        )}
      </aside>
    </div>
  )
}
