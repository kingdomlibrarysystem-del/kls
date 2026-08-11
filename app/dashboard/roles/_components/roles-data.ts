/** A dynamic platform role with an assigned permission set, per RULES.md's dynamic-table (not static-enum) role model. Matches /api/roles' real serialization — description is nullable there. */
export interface Role {
  id: string
  name: string
  description: string | null
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

