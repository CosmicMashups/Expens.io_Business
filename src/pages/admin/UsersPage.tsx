import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DataTable } from '@/components/tables/DataTable'
import { RoleBadge } from '@/components/badges/RoleBadge'
import { selectClass } from '@/lib/uiClasses'
import type { UserProfile, UserRole } from '@/types'
import { toast } from 'sonner'

export function UsersPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_profiles').select('*').order('full_name')
      if (error) throw error
      return data as UserProfile[]
    },
  })

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { error } = await supabase.from('user_profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Saved successfully')
    },
  })

  const roles: UserRole[] = ['owner', 'finance_manager', 'accountant', 'developer', 'guest']

  return (
    <DataTable<UserProfile>
      columns={[
        { id: 'full_name', header: 'Name', accessorKey: 'full_name' },
        { id: 'email', header: 'Email', accessorKey: 'email' },
        {
          id: 'role',
          header: 'Role',
          cell: (u) => (
            <select
              className={selectClass}
              value={u.role}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value as UserRole })}
              aria-label={`Role for ${u.full_name}`}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          ),
          sortable: false,
        },
        {
          id: 'status',
          header: 'Status',
          cell: (u) => (
            <span className={u.is_active ? 'text-success' : 'text-text-tertiary'}>
              {u.is_active ? 'Active' : 'Inactive'}
            </span>
          ),
        },
        {
          id: 'badge',
          header: '',
          sortable: false,
          cell: (u) => <RoleBadge role={u.role} />,
        },
      ]}
      data={users}
      loading={isLoading}
      caption="Users"
    />
  )
}
