import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { useProjects, useProjectMutations } from '@/hooks/useProjects'
import { useRole } from '@/hooks/useRole'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ProjectCard } from '@/components/cards/ProjectCard'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/badges/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/modals/ConfirmModal'
import { filterChipClass } from '@/lib/uiClasses'
import { formatDate } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types'

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Quotation', value: 'quotation' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'suspended' },
  { label: 'Archived', value: 'archived' },
]

export function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const { data: projects = [], isLoading } = useProjects()
  const { remove } = useProjectMutations()
  const { permissions } = useRole()

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.project_name.toLowerCase().includes(search.toLowerCase()) ||
      p.project_id.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title="Projects"
        actions={
          <PermissionGuard require="canCreate">
            <Button asChild>
              <Link to="/projects/new">
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </Button>
          </PermissionGuard>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={filterChipClass(statusFilter === f.value)}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1 rounded-lg border border-border-subtle p-1">
          <Button
            variant={view === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setView('table')}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-elevated" />
            ))
          ) : filtered.length === 0 ? (
            <p className="col-span-full text-center text-sm text-text-secondary">No projects found.</p>
          ) : (
            filtered.map((p) => <ProjectCard key={p.id} project={p} />)
          )}
        </div>
      ) : (
        <DataTable<Project>
          columns={[
            { id: 'project_id', header: 'ID', accessorKey: 'project_id', mono: true },
            { id: 'project_name', header: 'Name', accessorKey: 'project_name' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={row.status} />,
            },
            {
              id: 'created_at',
              header: 'Created',
              cell: (row) => formatDate(row.created_at),
            },
            {
              id: 'actions',
              header: 'Actions',
              align: 'right',
              sortable: false,
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/projects/${row.id}`}>View</Link>
                  </Button>
                  {permissions.canEdit && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/projects/${row.id}/edit`}>Edit</Link>
                    </Button>
                  )}
                  {permissions.canDelete && (
                    <Button variant="ghost" size="sm" onClick={() => setArchiveId(row.id)}>
                      Archive
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filtered}
          loading={isLoading}
          emptyState={{
            title: 'No projects yet',
            description: 'Create your first project to start tracking expenses.',
          }}
          caption="Projects"
        />
      )}

      <ConfirmModal
        open={!!archiveId}
        onClose={() => setArchiveId(null)}
        onConfirm={() => {
          if (archiveId) remove.mutate(archiveId)
          setArchiveId(null)
        }}
        title="Archive project"
        description="This project will be archived. You can restore it from admin if needed."
        confirmLabel="Archive"
      />
    </div>
  )
}
