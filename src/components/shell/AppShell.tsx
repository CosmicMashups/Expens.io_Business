import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { PageFallback } from '@/components/feedback/PageFallback'
import { resumeStuckQueries } from '@/lib/resumeStuckQueries'
import { useUiStore } from '@/store/uiStore'

export function AppShell() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const sidebarWidth = sidebarCollapsed ? 64 : 220

  useEffect(() => {
    queryClient.cancelQueries({
      predicate: (query) =>
        query.getObserversCount() === 0 && query.state.fetchStatus === 'fetching',
    })
    void queryClient.invalidateQueries({
      type: 'active',
      predicate: (query) =>
        query.state.status === 'pending' && query.state.dataUpdatedAt === 0,
    })
    resumeStuckQueries(queryClient)
  }, [location.pathname, queryClient])

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
        <Suspense fallback={<PageFallback />}>
          <Outlet key={location.pathname} />
        </Suspense>
      </main>
    </div>
  )
}
