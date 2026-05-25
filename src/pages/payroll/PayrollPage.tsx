import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shell/PageHeader'
import { usePayroll, usePayrollMutations } from '@/hooks/usePayroll'
import { useRole } from '@/hooks/useRole'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ProjectSelect } from '@/components/forms/ProjectSelect'
import { StatusBadge } from '@/components/badges/StatusBadge'
import { Button } from '@/components/ui/button'
import { selectClass, filterChipClass } from '@/lib/uiClasses'
import { PAYROLL_PERIOD_COLUMNS, type PayrollPeriodKeys } from '@/types'
import { exportPayroll } from '@/services/excel/exporter'
import { commitPayrollImport } from '@/services/excel/importOrchestrator'
import { projectsService } from '@/services/projects'
import { formatImportSummary } from '@/lib/bulkChunk'
import { formatPeso } from '@/lib/utils'
import { toast } from 'sonner'
import { Download, Upload, LayoutGrid, Table } from 'lucide-react'
export function PayrollPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [projectId, setProjectId] = useState('')
  const [workerFilter, setWorkerFilter] = useState<'all' | 'employee' | 'organization'>('all')
  const [view, setView] = useState<'grid' | 'summary'>('grid')
  const { data: rows = [], isLoading } = usePayroll(year, projectId || undefined)
  const qc = useQueryClient()
  const { updatePeriod } = usePayrollMutations()
  const { permissions } = useRole()
  const [editing, setEditing] = useState<{ id: string; key: keyof PayrollPeriodKeys } | null>(null)
  const [editVal, setEditVal] = useState(0)

  const filtered = rows.filter((r) => workerFilter === 'all' || r.worker_type === workerFilter)

  const handleExport = () => {
    exportPayroll({ [year]: rows }, undefined, true)
    toast.success('Exported payroll')
  }

  const handleImport = async (file: File) => {
    try {
      const projects = await projectsService.list()
      const { imported, skipped, skippedTags } = await commitPayrollImport(file, projects)
      if (imported > 0) await qc.invalidateQueries({ queryKey: ['payroll'] })
      toast.success(formatImportSummary(imported, skipped, skippedTags))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
    }
  }

  const saveCell = async () => {
    if (!editing) return
    await updatePeriod.mutateAsync({ id: editing.id, key: editing.key, amount: editVal })
    setEditing(null)
    toast.success('Saved successfully')
  }

  const byProject = filtered.reduce<Record<string, typeof filtered>>((acc, r) => {
    const key = r.project?.project_name ?? r.project_id
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title="Payroll"
        actions={
          <>
            <select className={selectClass} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-56">
          <ProjectSelect value={projectId} onChange={setProjectId} />
        </div>
        {(['all', 'employee', 'organization'] as const).map((f) => (
          <button key={f} type="button" className={filterChipClass(workerFilter === f)} onClick={() => setWorkerFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex gap-1 rounded-lg border border-border-subtle p-1">
          <Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setView('grid')} aria-label="Grid view">
            <Table className="h-4 w-4" />
          </Button>
          <Button variant={view === 'summary' ? 'default' : 'ghost'} size="icon" onClick={() => setView('summary')} aria-label="Summary view">
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'summary' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(byProject).map(([name, entries]) => (
            <div key={name} className="rounded-xl border border-border-subtle bg-card p-5">
              <h3 className="font-display font-bold text-text-primary">{name}</h3>
              <p className="mt-2 font-mono text-lg font-bold text-text-primary">
                {formatPeso(entries.reduce((s, e) => s + e.total_payroll, 0))}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">{entries.length} workers</p>
            </div>
          ))}
          {!isLoading && Object.keys(byProject).length === 0 && (
            <p className="text-sm text-text-secondary">No payroll entries for this filter.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm" aria-label="Payroll grid">
            <thead className="sticky top-0 z-10 border-b border-border bg-card">
              <tr>
                <th className="sticky left-0 z-20 bg-card px-3 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                  Project
                </th>
                <th className="sticky left-28 z-20 bg-card px-3 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                  Worker
                </th>
                <th className="sticky left-52 z-20 bg-card px-3 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-text-secondary">
                  Type
                </th>
                {PAYROLL_PERIOD_COLUMNS.map((c) => (
                  <th key={c.key} className="min-w-[5rem] px-2 py-3 text-right font-mono text-[10px] text-text-secondary">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-mono text-[11px] uppercase text-text-secondary">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={PAYROLL_PERIOD_COLUMNS.length + 4} className="p-8 text-center text-text-secondary">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={PAYROLL_PERIOD_COLUMNS.length + 4} className="p-8 text-center text-text-secondary">
                    No payroll entries
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-elevated">
                    <td className="sticky left-0 bg-surface px-3 py-2">{p.project?.project_id}</td>
                    <td className="sticky left-28 bg-surface px-3 py-2">{p.worker_name}</td>
                    <td className="sticky left-52 bg-surface px-3 py-2">
                      <StatusBadge status={p.worker_type} />
                    </td>
                    {PAYROLL_PERIOD_COLUMNS.map((col) => (
                      <td key={col.key} className="px-2 py-2 text-right font-mono text-xs">
                        {editing?.id === p.id && editing.key === col.key ? (
                          <input
                            className="w-16 rounded-lg border border-border-subtle bg-elevated px-1 text-right text-text-primary focus:border-accent focus:outline-none"
                            value={editVal}
                            onChange={(e) => setEditVal(Number(e.target.value))}
                            onBlur={saveCell}
                            onKeyDown={(e) => e.key === 'Enter' && saveCell()}
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            className="w-full text-text-primary hover:text-accent disabled:opacity-50"
                            disabled={!permissions.canEdit || p.is_locked}
                            onClick={() => {
                              setEditing({ id: p.id, key: col.key })
                              setEditVal(Number(p[col.key] ?? 0))
                            }}
                          >
                            {Number(p[col.key] ?? 0) > 0
                              ? formatPeso(Number(p[col.key] ?? 0)).replace(/[^\d.,-]/g, '')
                              : '—'}
                          </button>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-mono font-bold text-text-primary">
                      {formatPeso(p.total_payroll)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
