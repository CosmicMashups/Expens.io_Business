import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shell/PageHeader'
import { FormSection } from '@/components/forms/FormSection'
import { useProject, useProjectMutations } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { selectClass } from '@/lib/uiClasses'
import { PROJECT_STATUS_OPTIONS } from '@/lib/constants'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  project_id: z.string().min(1),
  project_name: z.string().min(1),
  status: z.enum(['quotation', 'awarded', 'active', 'suspended', 'completed', 'archived']),
})

type FormValues = z.infer<typeof schema>

export function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { data: project } = useProject(id)
  const { create, update } = useProjectMutations()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  })

  useEffect(() => {
    if (project) reset({ project_id: project.project_id, project_name: project.project_name, status: project.status })
  }, [project, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, values })
        toast.success('Saved successfully')
      } else {
        await create.mutateAsync(values)
        toast.success('Saved successfully')
      }
      navigate('/projects')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title={isEdit ? 'Edit Project' : 'New Project'}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to={isEdit && id ? `/projects/${id}` : '/projects'}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <FormSection title="Project details">
          <div>
            <Label htmlFor="project_id">Project ID</Label>
            <Input id="project_id" className="mt-1.5" {...register('project_id')} disabled={isEdit} />
            {errors.project_id && (
              <p className="mt-1 text-xs text-danger">{errors.project_id.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="project_name">Project name</Label>
            <Input id="project_name" className="mt-1.5" {...register('project_name')} />
            {errors.project_name && (
              <p className="mt-1 text-xs text-danger">{errors.project_name.message}</p>
            )}
          </div>
          <div className="col-span-2 md:col-span-1">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={`mt-1.5 w-full ${selectClass}`} {...register('status')}>
              {PROJECT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </FormSection>
        <Button type="submit">{isEdit ? 'Save changes' : 'Create project'}</Button>
      </form>
    </div>
  )
}
