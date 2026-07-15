/** A dynamic platform role with an assigned permission set, per RULES.md's dynamic-table (not static-enum) role model. */
export interface Role {
  id: string
  name: string
  description: string
  userCount: number
  permissions: string[]
}

export const defaultPermissions = [
  'library:view', 'library:create', 'library:edit', 'library:delete',
  'borrow:request', 'borrow:approve', 'borrow:return',
  'users:view', 'users:create', 'users:edit',
  'courses:view', 'courses:create', 'courses:enroll',
  'publications:submit', 'publications:approve',
  'reports:view',
  'roles:manage',
  'sessions:approve',
]

export const permissionLabels: Record<string, string> = {
  'library:view': 'View Library Resources',
  'library:create': 'Create Resources',
  'library:edit': 'Edit Resources',
  'library:delete': 'Delete Resources',
  'borrow:request': 'Request Borrow',
  'borrow:approve': 'Approve Borrow',
  'borrow:return': 'Process Return',
  'users:view': 'View Users',
  'users:create': 'Create Users',
  'users:edit': 'Edit Users',
  'courses:view': 'View Courses',
  'courses:create': 'Create Courses',
  'courses:enroll': 'Enroll in Courses',
  'publications:submit': 'Submit Publications',
  'publications:approve': 'Approve Publications',
  'reports:view': 'View Reports',
  'roles:manage': 'Manage Roles',
  'sessions:approve': 'Approve Session Requests',
}

/**
 * 'Contributor' and 'Lecturer' were removed during portal consolidation
 * — Admin and Member are the only two portals now, and there is no
 * remaining UI for either persona to exercise the permissions below.
 */
export const initialRoles: Role[] = [
  { id: '1', name: 'Admin', description: 'Full platform control', userCount: 2, permissions: defaultPermissions },
  { id: '2', name: 'Manager', description: 'Library, publishing, research, e-learning operations', userCount: 5, permissions: defaultPermissions.filter((p) => !p.includes('roles:manage') && !p.includes('users:delete')) },
  { id: '3', name: 'Staff', description: 'Day-to-day operations: borrow/return, content moderation', userCount: 8, permissions: ['library:view', 'library:create', 'library:edit', 'borrow:approve', 'borrow:return', 'users:view'] },
  { id: '5', name: 'Member', description: 'Students and readers', userCount: 1240, permissions: ['library:view', 'borrow:request', 'courses:view', 'courses:enroll'] },
]
