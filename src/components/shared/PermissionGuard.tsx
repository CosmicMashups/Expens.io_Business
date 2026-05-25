import type { RolePermissions } from '@/types'
import { useRole } from '@/hooks/useRole'

type PermKey = keyof RolePermissions

export function PermissionGuard({
  require: perm,
  children,
}: {
  require: PermKey
  children: React.ReactNode
}) {
  const { permissions } = useRole()
  if (!permissions[perm]) return null
  return <>{children}</>
}
