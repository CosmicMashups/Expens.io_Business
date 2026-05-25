import { LogOut, Menu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'

export function TopBar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { profile, signOut } = useAuth()
  const toggleMobile = useUiStore((s) => s.toggleMobileSidebar)
  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  return (
    <header
      style={style}
      className={cn(
        'fixed top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface/85 px-4 backdrop-blur-md md:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={toggleMobile} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <Logo variant="full" showSubtitle size="sm" />
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted font-mono text-xs font-medium text-accent"
          aria-hidden
        >
          {initials}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-text-primary">{profile?.full_name}</p>
          <Badge variant="secondary" className="mt-0.5 capitalize">
            {profile?.role?.replace(/_/g, ' ') ?? 'user'}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  )
}
