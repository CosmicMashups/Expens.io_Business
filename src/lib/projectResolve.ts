import type { Project } from '@/types'

function norm(s: string): string {
  return s.trim().toLowerCase()
}

/** Match daily expense column H tag to a project. */
export function findProjectByTag(
  projects: Project[],
  tag: string | null | undefined,
): Project | undefined {
  if (!tag?.trim()) return undefined
  const t = norm(tag)
  return (
    projects.find((p) => norm(p.project_id) === t) ??
    projects.find((p) => norm(p.project_name) === t)
  )
}

/** Match payroll row code (column A) to project_id. */
export function findProjectByCode(projects: Project[], code: string): Project | undefined {
  if (!code.trim()) return undefined
  const t = norm(code)
  return projects.find((p) => norm(p.project_id) === t)
}

/** Match PMR project name or id. */
export function findProjectByNameOrId(projects: Project[], name: string): Project | undefined {
  if (!name.trim()) return undefined
  const t = norm(name)
  return (
    projects.find((p) => norm(p.project_name) === t) ??
    projects.find((p) => norm(p.project_id) === t)
  )
}

/** Map Excel sheet names to Supabase project UUIDs. */
export function buildSheetToProjectUuid(projects: Project[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of projects) {
    map[p.project_id] = p.id
    map[norm(p.project_id)] = p.id
  }
  return map
}
