import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shell/PageHeader'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { selectClass } from '@/lib/uiClasses'
import {
  commitMigration,
  previewMigration,
  type ImportPreview,
  type MigrationFiles,
} from '@/services/excel/importOrchestrator'
import { formatImportSummary } from '@/lib/bulkChunk'
import { toast } from 'sonner'
import { Upload, Play, FileSpreadsheet } from 'lucide-react'

const FILE_SLOTS = [
  { key: 'daily' as const, label: 'Daily Expenses Report.xlsx', hint: 'Column H = project tag' },
  { key: 'payroll' as const, label: 'Payroll Summary.xlsx', hint: 'Row codes = project_id' },
  { key: 'projectExpenses' as const, label: 'Project Expenses Report.xlsx', hint: 'Sheet name = project_id' },
  { key: 'pmr' as const, label: 'Project Monitoring Report.xlsx', hint: 'PROJECT NAME column' },
]

export function MigrationPage() {
  const defaultYear = new Date().getFullYear()
  const [year, setYear] = useState(defaultYear)
  const [files, setFiles] = useState<MigrationFiles>({})
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [aggregateAfter, setAggregateAfter] = useState(true)
  const qc = useQueryClient()

  const setFile = (key: keyof MigrationFiles, file: File | undefined) => {
    setFiles((f) => ({ ...f, [key]: file }))
    setPreview(null)
  }

  const handlePreview = async () => {
    if (!files.daily && !files.payroll && !files.projectExpenses && !files.pmr) {
      toast.error('Select at least one file')
      return
    }
    setPreviewing(true)
    try {
      const p = await previewMigration(files, year)
      setPreview(p)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  const handleImportAll = async () => {
    if (!preview?.canCommit) {
      toast.error('Run preview first')
      return
    }
    setImporting(true)
    try {
      const result = await commitMigration({
        year,
        files,
        aggregateAfterPmr: aggregateAfter && !!files.pmr,
      })
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['daily-expenses'] }),
        qc.invalidateQueries({ queryKey: ['payroll'] }),
        qc.invalidateQueries({ queryKey: ['project-expenses'] }),
        qc.invalidateQueries({ queryKey: ['project-monitoring'] }),
      ])
      const parts: string[] = []
      if (files.daily) parts.push(formatImportSummary(result.daily.imported, result.daily.skipped))
      if (files.payroll) parts.push(`Payroll: ${result.payroll.imported}`)
      if (files.projectExpenses) parts.push(`Project expenses: ${result.projectExpenses.imported}`)
      if (files.pmr) parts.push(`PMR: ${result.pmr.imported}`)
      if (result.aggregated != null) parts.push(`Aggregated ${result.aggregated} reports`)
      toast.success(parts.join(' · '))
      setPreview(null)
      setFiles({})
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title="Data Migration"
        subtitle="Import legacy Excel workbooks in the recommended order. See docs/IMPORT_RUNBOOK.md."
      />

      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <Label htmlFor="migration-year">Report year</Label>
        <select
          id="migration-year"
          className={`${selectClass} mt-2 max-w-xs`}
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value))
            setPreview(null)
          }}
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-text-secondary">
          Order: Daily → set categories → Payroll → Project Expenses (optional) → PMR → Aggregate
          Expenses → manual Labor Cost from payroll.
        </p>
      </div>

      <ol className="mb-6 space-y-4">
        {FILE_SLOTS.map(({ key, label, hint }, idx) => (
          <li
            key={key}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border-subtle bg-card p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm text-white">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">{label}</p>
              <p className="text-xs text-text-tertiary">{hint}</p>
              {files[key] && (
                <p className="mt-1 flex items-center gap-1 text-xs text-accent">
                  <FileSpreadsheet className="h-3 w-3" />
                  {files[key]!.name}
                </p>
              )}
            </div>
            <PermissionGuard require="canCreate">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Choose file
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => setFile(key, e.target.files?.[0])}
                />
              </label>
            </PermissionGuard>
          </li>
        ))}
      </ol>

      <label className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={aggregateAfter}
          onChange={(e) => setAggregateAfter(e.target.checked)}
          className="rounded border-border"
        />
        Run Aggregate Expenses after PMR import (requires daily data and categories)
      </label>

      <div className="flex flex-wrap gap-2">
        <PermissionGuard require="canCreate">
          <Button variant="outline" onClick={handlePreview} disabled={previewing}>
            {previewing ? 'Previewing…' : 'Preview import'}
          </Button>
          <Button onClick={handleImportAll} disabled={importing || !preview?.canCommit}>
            <Play className="h-4 w-4" />
            {importing ? 'Importing…' : 'Import all'}
          </Button>
        </PermissionGuard>
      </div>

      {preview && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated text-left text-text-secondary">
                <th className="p-3">Module</th>
                <th className="p-3">Ready</th>
                <th className="p-3">Errors</th>
                <th className="p-3">Skipped</th>
                <th className="p-3">Samples</th>
              </tr>
            </thead>
            <tbody>
              {preview.sections.map((s) => (
                <tr key={s.label} className="border-b border-border-subtle">
                  <td className="p-3 font-medium">{s.label}</td>
                  <td className="p-3 font-mono">{s.valid}</td>
                  <td className="p-3 font-mono">{s.errors}</td>
                  <td className="p-3 font-mono">{s.skipped}</td>
                  <td className="p-3 text-text-tertiary">
                    {s.skippedSamples.length ? s.skippedSamples.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
