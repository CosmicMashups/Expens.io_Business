import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectsService } from '@/services/projects'
import type { ProjectFormValues } from '@/types'

export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: ['projects', includeArchived],
    queryFn: () => projectsService.list(includeArchived),
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsService.getById(id!),
    enabled: !!id,
  })
}

export function useProjectMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['projects'] })

  return {
    create: useMutation({
      mutationFn: (v: ProjectFormValues) => projectsService.create(v),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, values }: { id: string; values: Partial<ProjectFormValues> }) =>
        projectsService.update(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => projectsService.softDelete(id),
      onSuccess: invalidate,
    }),
  }
}
