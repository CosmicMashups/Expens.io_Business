import { useNavigate } from 'react-router-dom'
import type { Project } from '@/types'
import { StatusBadge } from '@/components/badges/StatusBadge'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function ProjectCard({
  project,
  onClick,
}: {
  project: Project
  onClick?: () => void
}) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) onClick()
    else navigate(`/projects/${project.id}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full rounded-xl border border-border-subtle bg-card p-5 text-left transition-colors',
        'hover:border-border-subtle hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-text-primary">
            {project.project_name}
          </p>
          <p className="font-mono text-xs text-text-tertiary">{project.project_id}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-elevated">
        <div className="h-full w-2/3 rounded-full bg-accent" />
      </div>
      <p className="mt-3 font-mono text-xs text-text-tertiary">
        Updated {formatDate(project.updated_at)}
      </p>
    </button>
  )
}
