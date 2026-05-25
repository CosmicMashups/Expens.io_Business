import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppShell } from '@/components/shell/AppShell'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { PageFallback } from '@/components/feedback/PageFallback'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() =>
  import('@/pages/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })),
)
const ProjectFormPage = lazy(() =>
  import('@/pages/projects/ProjectFormPage').then((m) => ({ default: m.ProjectFormPage })),
)
const ProjectMonitoringPage = lazy(() =>
  import('@/pages/project-monitoring/ProjectMonitoringPage').then((m) => ({
    default: m.ProjectMonitoringPage,
  })),
)
const DailyExpensesPage = lazy(() =>
  import('@/pages/daily-expenses/DailyExpensesPage').then((m) => ({ default: m.DailyExpensesPage })),
)
const ProjectExpensesPage = lazy(() =>
  import('@/pages/project-expenses/ProjectExpensesPage').then((m) => ({ default: m.ProjectExpensesPage })),
)
const PayrollPage = lazy(() => import('@/pages/payroll/PayrollPage').then((m) => ({ default: m.PayrollPage })))
const MigrationPage = lazy(() =>
  import('@/pages/migration/MigrationPage').then((m) => ({ default: m.MigrationPage })),
)
const ApprovalQueuePage = lazy(() =>
  import('@/pages/approvals/ApprovalQueuePage').then((m) => ({ default: m.ApprovalQueuePage })),
)
const AuditLogsPage = lazy(() => import('@/pages/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })))
const AdminPage = lazy(() => import('@/pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <LoadingSpinner />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Wrapped({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)
  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <LoginPage />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <Wrapped>
                <DashboardPage />
              </Wrapped>
            }
          />
          <Route
            path="projects"
            element={
              <Wrapped>
                <ProjectsPage />
              </Wrapped>
            }
          />
          <Route
            path="projects/new"
            element={
              <Wrapped>
                <ProjectFormPage />
              </Wrapped>
            }
          />
          <Route
            path="projects/:id"
            element={
              <Wrapped>
                <ProjectDetailPage />
              </Wrapped>
            }
          />
          <Route
            path="projects/:id/edit"
            element={
              <Wrapped>
                <ProjectFormPage />
              </Wrapped>
            }
          />
          <Route
            path="project-monitoring"
            element={
              <Wrapped>
                <ProjectMonitoringPage />
              </Wrapped>
            }
          />
          <Route
            path="daily-expenses"
            element={
              <Wrapped>
                <DailyExpensesPage />
              </Wrapped>
            }
          />
          <Route
            path="project-expenses"
            element={
              <Wrapped>
                <ProjectExpensesPage />
              </Wrapped>
            }
          />
          <Route
            path="payroll"
            element={
              <Wrapped>
                <PayrollPage />
              </Wrapped>
            }
          />
          <Route
            path="migration"
            element={
              <PermissionGuard require="canCreate">
                <Wrapped>
                  <MigrationPage />
                </Wrapped>
              </PermissionGuard>
            }
          />
          <Route
            path="approvals"
            element={
              <PermissionGuard require="canApprove">
                <Wrapped>
                  <ApprovalQueuePage />
                </Wrapped>
              </PermissionGuard>
            }
          />
          <Route
            path="audit"
            element={
              <PermissionGuard require="canViewAudit">
                <Wrapped>
                  <AuditLogsPage />
                </Wrapped>
              </PermissionGuard>
            }
          />
          <Route
            path="admin/*"
            element={
              <PermissionGuard require="canConfigureSettings">
                <Wrapped>
                  <AdminPage />
                </Wrapped>
              </PermissionGuard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
