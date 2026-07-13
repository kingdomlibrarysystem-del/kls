import type { PlatformUser, UserRoleValue } from './users-data'

interface UsersStatsProps {
  data: PlatformUser[]
}

/** Total/Active/Suspended/by-role stat cards, derived from the same list state the table below renders — so a Create/Edit/Delete action updates these counts immediately. */
export function UsersStats({ data }: UsersStatsProps) {
  const active = data.filter((u) => u.status === 'active').length
  const suspended = data.filter((u) => u.status === 'suspended').length
  const byRole = (['admin', 'librarian', 'user'] as UserRoleValue[])
    .map((r) => ({ role: r, count: data.filter((u) => u.role === r).length }))
    .filter((r) => r.count > 0)

  const stats = [
    { label: 'Total Users', value: data.length, color: 'text-w-950' },
    { label: 'Active', value: active, color: 'text-green-700' },
    { label: 'Suspended', value: suspended, color: 'text-red-700' },
    ...byRole.map((r) => ({
      label: `${r.role.charAt(0).toUpperCase()}${r.role.slice(1)}s`,
      value: r.count,
      color: 'text-w-600',
    })),
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
          <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  )
}
