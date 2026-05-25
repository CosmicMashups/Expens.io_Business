import { Routes, Route, NavLink } from 'react-router-dom'
import { PageHeader } from '@/components/shell/PageHeader'
import { UsersPage } from './UsersPage'
import { SettingsPage } from './SettingsPage'
import { cn } from '@/lib/utils'

export function AdminPage() {
  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader title="Administration" />
      <nav className="mb-6 flex gap-1 border-b border-border-subtle">
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary',
            )
          }
        >
          Users
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-secondary hover:text-text-primary',
            )
          }
        >
          Settings
        </NavLink>
      </nav>
      <Routes>
        <Route index element={<UsersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </div>
  )
}
