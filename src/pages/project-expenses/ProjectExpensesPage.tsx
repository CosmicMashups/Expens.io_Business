import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shell/PageHeader'
import { useProjectExpenses, useProjectExpenseMutations } from '@/hooks/useProjectExpenses'
import { useRole } from '@/hooks/useRole'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ProjectSelect } from '@/components/forms/ProjectSelect'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { DataTable } from '@/components/tables/DataTable'
import { DetailDrawer } from '@/components/drawers/DetailDrawer'
import { ApprovalBadge } from '@/components/badges/ApprovalBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { selectClass } from '@/lib/uiClasses'
import { exportProjectExpenses } from '@/services/excel/exporter'
import { commitProjectExpensesImport } from '@/services/excel/importOrchestrator'
import { projectsService } from '@/services/projects'
import { formatImportSummary } from '@/lib/bulkChunk'
import { formatDate, formatPeso } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Download, Upload } from 'lucide-react'
import type { ProjectExpense } from '@/types'

export function ProjectExpensesPage() {
  const year = new Date().getFullYear()
  const [filterYear, setFilterYear] = useState(year)
  const [projectId, setProjectId] = useState('')
  const { data: rows = [], isLoading } = useProjectExpenses({
    year: filterYear,
    projectId: projectId || undefined,
  })
  const qc = useQueryClient()
  const { create, remove } = useProjectExpenseMutations()
  const { permissions } = useRole()
  const [selected, setSelected] = useState<ProjectExpense | null>(null)
  const [form, setForm] = useState({
    project_id: '',
    expense_date: new Date().toISOString().slice(0, 10),
    particulars: '',
    cash_out: 0,
    currency: 'PHP' as const,
  })

  const handleExport = () => {
    const map: Record<string, { name: string; expenses: typeof rows }> = {}
    for (const e of rows) {
      const key = e.project?.project_id ?? e.project_id
      if (!map[key]) map[key] = { name: key, expenses: [] }
      map[key].expenses.push(e)
    }
    exportProjectExpenses(map, filterYear)
    toast.success('Exported')
  }

  const handleImport = async (file: File) => {
    try {
      const projects = await projectsService.list()
      const { imported, skipped, skippedTags } = await commitProjectExpensesImport(file, projects)
      if (imported > 0) await qc.invalidateQueries({ queryKey: ['project-expenses'] })
      toast.success(formatImportSummary(imported, skipped, skippedTags))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
    }
  }

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title="Project Expenses"
        actions={
          <>
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

      <div className="mb-4 flex flex-wrap gap-2">
        <select className={selectClass} value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="w-56">
          <ProjectSelect value={projectId} onChange={setProjectId} />
        </div>
      </div>

      {permissions.canCreate && (
        <div className="mb-4 max-w-xl space-y-3 rounded-xl border border-border-subtle bg-card p-5">
          <ProjectSelect value={form.project_id} onChange={(id) => setForm((f) => ({ ...f, project_id: id }))} />
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              className="mt-1.5"
              value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              className="mt-1.5"
              placeholder="Particulars"
              value={form.particulars}
              onChange={(e) => setForm((f) => ({ ...f, particulars: e.target.value }))}
            />
          </div>
          <CurrencyInput value={form.cash_out} onChange={(v) => setForm((f) => ({ ...f, cash_out: v }))} />
          <Button size="sm" onClick={() => create.mutateAsync(form).then(() => toast.success('Saved successfully'))}>
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </div>
      )}

      <DataTable<ProjectExpense>
        columns={[
          { id: 'expense_date', header: 'Date', cell: (r) => formatDate(r.expense_date) },
          { id: 'project', header: 'Project', cell: (r) => r.project?.project_name ?? '—' },
          { id: 'particulars', header: 'Description', accessorKey: 'particulars' },
          {
            id: 'amount',
            header: 'Amount',
            align: 'right',
            mono: true,
            cell: (r) => formatPeso(r.cash_out),
          },
          {
            id: 'approval',
            header: 'Status',
            cell: (r) => <ApprovalBadge status={r.approval_status} />,
          },
          {
            id: 'actions',
            header: '',
            sortable: false,
            cell: (r) =>
              permissions.canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove.mutate(r.id)
                  }}
                >
                  Delete
                </Button>
              ) : null,
          },
        ]}
        data={rows}
        loading={isLoading}
        onRowClick={setSelected}
        emptyState={{
          title: 'No project expenses',
          description: 'Add expenses linked to project budgets.',
        }}
        caption="Project expenses"
      />

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.particulars ?? 'Expense'}
      >
        {selected && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-secondary">Date</dt>
              <dd>{formatDate(selected.expense_date)}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Amount</dt>
              <dd className="font-mono text-lg font-bold">{formatPeso(selected.cash_out)}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Status</dt>
              <dd className="mt-1">
                <ApprovalBadge status={selected.approval_status} />
              </dd>
            </div>
          </dl>
        )}
      </DetailDrawer>
    </div>
  )
}
