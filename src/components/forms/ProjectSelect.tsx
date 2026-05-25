import { useProjects } from '@/hooks/useProjects'

export function ProjectSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const { data: projects = [], isLoading } = useProjects()

  return (
    <select
      className="flex h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 disabled:opacity-50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
    >
      <option value="">Select project</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.project_id} — {p.project_name}
        </option>
      ))}
    </select>
  )
}
