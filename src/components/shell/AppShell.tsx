import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUiStore } from '@/store/uiStore'

export function AppShell() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const sidebarWidth = sidebarCollapsed ? 64 : 220

  return (
    <div className="min-h-screen bg-base font-body text-text-primary">
      <Sidebar />
      <TopBar
        className="max-md:left-0 max-md:w-full"
        style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }}
      />
      <main
        className="min-h-screen transition-all duration-200 ease-in-out pt-14 max-md:!ml-0"
        style={{ marginLeft: sidebarWidth }}
      >
        <Outlet />
      </main>
    </div>
  )
}
