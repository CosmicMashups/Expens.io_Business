import { supabase } from '@/lib/supabase'
import type { Project, ProjectFormValues } from '@/types'

export const projectsService = {
  async list(includeArchived = false) {
    let q = supabase.from('projects').select('*').is('deleted_at', null).order('project_name')
    if (!includeArchived) q = q.neq('status', 'archived')
    const { data, error } = await q
    if (error) throw error
    return data as Project[]
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
    if (error) throw error
    return data as Project
  },

  async getByProjectId(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .maybeSingle()
    if (error) throw error
    return data as Project | null
  },

  async create(values: ProjectFormValues) {
    const { data, error } = await supabase.from('projects').insert(values).select().single()
    if (error) throw error
    return data as Project
  },

  async update(id: string, values: Partial<ProjectFormValues>) {
    const { data, error } = await supabase.from('projects').update(values).eq('id', id).select().single()
    if (error) throw error
    return data as Project
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString(), status: 'archived' })
      .eq('id', id)
    if (error) throw error
  },

  async restore(id: string) {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: null, status: 'active' })
      .eq('id', id)
    if (error) throw error
  },
}
