import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shell/PageHeader'
import { useProjectMonitoring, useProjectMonitoringMutations } from '@/hooks/useProjectMonitoring'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ApprovalBadge } from '@/components/badges/ApprovalBadge'
import { DetailDrawer } from '@/components/drawers/DetailDrawer'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/button'
import { selectClass } from '@/lib/uiClasses'
import { exportProjectMonitoring } from '@/services/excel/exporter'
import { commitPmrImport } from '@/services/excel/importOrchestrator'
import { projectsService } from '@/services/projects'
import { formatImportSummary } from '@/lib/bulkChunk'
import { formatPeso } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Download, Upload, RefreshCw, BarChart3 } from 'lucide-react'
import type { ProjectMonitoringReport } from '@/types'

function MonitoringCard({
  report,
  onClick,
}: {
  report: ProjectMonitoringReport
  onClick: () => void
}) {
  const profitPositive = (report.profit ?? 0) >= 0
  const pct = Math.min(100, Math.max(0, report.accomplishment ?? 0))

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border-subtle bg-card p-5 text-left transition-colors hover:border-border-subtle hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-text-tertiary">{report.report_id}</span>
        <ApprovalBadge status={report.approval_status} />
      </div>
      <p className="mt-2 font-display text-base font-bold text-text-primary">
        {report.client ?? report.report_description}
      </p>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-text-secondary">
          <span>Accomplishment</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-text-tertiary">Contracted</p>
          <p className="font-mono text-text-primary">{formatPeso(report.contracted_amount)}</p>
        </div>
        <div>
          <p className="text-text-tertiary">Collected</p>
          <p className="font-mono text-text-primary">{formatPeso(report.amount_collected)}</p>
        </div>
        <div>
          <p className="text-text-tertiary">Balance</p>
          <p className="font-mono text-text-primary">{formatPeso(report.balance_to_be_collected)}</p>
        </div>
        <div>
          <p className="text-text-tertiary">Expenses</p>
          <p className="font-mono text-text-primary">{formatPeso(report.total_expenses)}</p>
        </div>
      </div>
      <p className={cn('mt-4 font-mono text-lg font-bold', profitPositive ? 'text-success' : 'text-danger')}>
        Profit {formatPeso(report.profit)}
      </p>
    </button>
  )
}

export function ProjectMonitoringPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data: reports = [], isLoading } = useProjectMonitoring(year)
  const qc = useQueryClient()
  const { aggregateYear } = useProjectMonitoringMutations()
  const [updating, setUpdating] = useState(false)
  const [selected, setSelected] = useState<ProjectMonitoringReport | null>(null)

  const handleExport = () => {
    exportProjectMonitoring({ [year]: reports }, undefined, true)
    toast.success('Exported')
  }

  const handleImport = async (file: File) => {
    try {
      const projects = await projectsService.list()
      const { imported, skipped, skippedTags } = await commitPmrImport(file, projects)
      if (imported > 0) await qc.invalidateQueries({ queryKey: ['project-monitoring'] })
      toast.success(formatImportSummary(imported, skipped, skippedTags))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
    }
  }

  const handleUpdateExpenses = async () => {
    setUpdating(true)
    try {
      await aggregateYear.mutateAsync(year)
      toast.success('Expenses aggregated for all reports')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title="Project Monitoring"
        actions={
          <>
            <select className={selectClass} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <PermissionGuard require="canEdit">
              <Button size="sm" onClick={handleUpdateExpenses} disabled={updating}>
                <RefreshCw className={cn('h-4 w-4', updating && 'animate-spin')} />
                Aggregate Expenses
              </Button>
            </PermissionGuard>
            <PermissionGuard require="canExport">
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </PermissionGuard>
            <PermissionGuard require="canCreate">
              <label>
                <Button variant="ghost" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                />
              </label>
            </PermissionGuard>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton variant="card" count={6} />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No monitoring reports"
          description="Create a contracted report to begin tracking."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <MonitoringCard key={r.id} report={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.report_description ?? 'Report'}
        subtitle={selected?.report_id}
      >
        {selected && (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-text-secondary">Client</dt>
              <dd className="font-display font-bold">{selected.client ?? '—'}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-text-tertiary">Contracted</dt>
                <dd className="font-mono">{formatPeso(selected.contracted_amount)}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Tax</dt>
                <dd className="font-mono">{formatPeso(selected.tax_amount)}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Collected</dt>
                <dd className="font-mono">{formatPeso(selected.amount_collected)}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">Balance</dt>
                <dd className="font-mono">{formatPeso(selected.balance_to_be_collected)}</dd>
              </div>
            </div>
            <div>
              <dt className="text-text-secondary">Profit</dt>
              <dd
                className={cn(
                  'font-mono text-xl font-bold',
                  (selected.profit ?? 0) >= 0 ? 'text-success' : 'text-danger',
                )}
              >
                {formatPeso(selected.profit)}
              </dd>
            </div>
            <div>
              <dt className="text-text-secondary mb-2">Approval</dt>
              <dd>
                <ApprovalBadge status={selected.approval_status} />
              </dd>
            </div>
          </dl>
        )}
      </DetailDrawer>
    </div>
  )
}
