import { useAuthStore } from '@/store/authStore'
import { getPermissions } from '@/lib/permissions'
import type { RolePermissions, UserRole } from '@/types'

export function useRole(): { role: UserRole; permissions: RolePermissions } {
  const profile = useAuthStore((s) => s.profile)
  const role = (profile?.role ?? 'guest') as UserRole
  return { role, permissions: getPermissions(role) }
}
