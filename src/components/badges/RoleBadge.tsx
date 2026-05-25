import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

const roleStyles: Record<UserRole, string> = {
  owner: 'bg-accent-muted text-accent',
  finance_manager: 'bg-teal/10 text-teal',
  accountant: 'bg-success/10 text-success',
  developer: 'bg-purple-500/10 text-purple-400',
  guest: 'bg-elevated text-text-secondary',
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  const key = role as UserRole
  const style = roleStyles[key] ?? 'bg-elevated text-text-secondary'
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 font-mono text-xs capitalize', style)}>
      {role.replace(/_/g, ' ')}
    </span>
  )
}
