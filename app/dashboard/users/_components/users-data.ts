/** Platform user, backed by the real Prisma User model. `role` is the joined Role.name — a dynamic, admin-managed string (RULES.md dynamic-role model), not a static enum. */
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface PlatformUser {
  id: string
  name: string
  email: string
  role: string
  status: UserStatus
  joinDate: string
}

const ROLE_COLOR_FALLBACK = 'bg-blue-50 dark:bg-info/10 text-blue-700 dark:text-info border-blue-200 dark:border-info/30'
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border-red-200 dark:border-destructive/30',
  administrator: 'bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border-red-200 dark:border-destructive/30',
  manager: 'bg-purple-50 text-purple-700 border-purple-200',
  staff: 'bg-purple-50 text-purple-700 border-purple-200',
  member: 'bg-blue-50 dark:bg-info/10 text-blue-700 dark:text-info border-blue-200 dark:border-info/30',
}

/** Looks up a display color for any role name, falling back gracefully for roles an admin created that aren't in the known set. */
export function roleColor(role: string): string {
  return ROLE_COLORS[role.toLowerCase()] ?? ROLE_COLOR_FALLBACK
}

export const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-50 dark:bg-success/10 text-green-700 dark:text-success border-green-200 dark:border-success/30',
  inactive: 'bg-gray-50 text-gray-700 border-gray-200',
  suspended: 'bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border-red-200 dark:border-destructive/30',
}
