import type { UserRole, RolePermissions } from '@/types'

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canView: true, canCreate: true, canEdit: true, canDelete: true,
    canApprove: true, canExport: true, canViewAudit: true, canConfigureSettings: true,
  },
  developer: {
    canView: true, canCreate: true, canEdit: true, canDelete: true,
    canApprove: true, canExport: true, canViewAudit: true, canConfigureSettings: true,
  },
  finance_manager: {
    canView: true, canCreate: true, canEdit: true, canDelete: true,
    canApprove: true, canExport: true, canViewAudit: true, canConfigureSettings: false,
  },
  accountant: {
    canView: true, canCreate: true, canEdit: true, canDelete: true,
    canApprove: false, canExport: true, canViewAudit: true, canConfigureSettings: false,
  },
  guest: {
    canView: true, canCreate: false, canEdit: false, canDelete: false,
    canApprove: false, canExport: false, canViewAudit: false, canConfigureSettings: false,
  },
}

export function getPermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.guest
}
