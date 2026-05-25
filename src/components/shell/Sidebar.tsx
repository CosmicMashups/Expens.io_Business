import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Receipt,
  FolderOpen,
  Users,
  CheckSquare,
  ClipboardList,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/uiStore'
import { useRole } from '@/hooks/useRole'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'
import type { LucideIcon } from 'lucide-react'

type PermissionKey = 'canApprove' | 'canViewAudit' | 'canConfigureSettings'

const navGroups: {
  label: string
  items: { to: string; icon: LucideIcon; label: string; permission?: PermissionKey }[]
}[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/projects', icon: Briefcase, label: 'Projects' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/daily-expenses', icon: Receipt, label: 'Daily Expenses' },
      { to: '/project-expenses', icon: FolderOpen, label: 'Project Expenses' },
      { to: '/payroll', icon: Users, label: 'Payroll' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/project-monitoring', icon: BarChart3, label: 'Monitoring' },
      { to: '/approvals', icon: CheckSquare, label: 'Approvals', permission: 'canApprove' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/audit', icon: ClipboardList, label: 'Audit Logs', permission: 'canViewAudit' },
      { to: '/admin', icon: Settings, label: 'Admin', permission: 'canConfigureSettings' },
    ],
  },
]

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen)
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const { permissions } = useRole()
  const width = collapsed ? 64 : 220

  const canShow = (permission?: PermissionKey) => {
    if (!permission) return true
    return permissions[permission]
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface transition-all duration-200 ease-in-out',
          'max-md:transition-transform',
          mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}
        style={{ width }}
      >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border px-3',
          collapsed && 'justify-center',
        )}
      >
        {collapsed ? (
          <Logo variant="icon" size="sm" />
        ) : (
          <Logo variant="full" size="sm" />
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => canShow(item.permission))
          if (items.length === 0) return null
          return (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="mb-1 px-4 font-mono text-[10px] uppercase tracking-widest text-text-tertiary">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5 px-2">
                {items.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      title={collapsed ? label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                          isActive
                            ? 'border-l-2 border-accent bg-accent-muted text-accent'
                            : 'border-l-2 border-transparent text-text-secondary hover:bg-elevated hover:text-text-primary',
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      {!collapsed && <span>{label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className="w-full justify-center"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
    </>
  )
}
