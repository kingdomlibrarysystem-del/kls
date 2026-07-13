import type { Role } from './roles-data'

interface RolesStatsProps {
  roles: Role[]
}

/**
 * Total roles / distinct permissions actually assigned across those roles
 * (not the full permission catalog, which includes unused entries) /
 * total users covered — derived from the same `roles` state the cards
 * below render, so Create/Edit/Delete update these counts immediately.
 */
export function RolesStats({ roles }: RolesStatsProps) {
  const permissionsInUse = new Set(roles.flatMap((r) => r.permissions)).size
  const usersCovered = roles.reduce((sum, r) => sum + r.userCount, 0)

  const stats = [
    { label: 'Total Roles', value: roles.length, color: 'var(--gold)' },
    { label: 'Permissions In Use', value: permissionsInUse, color: 'var(--text-primary)' },
    { label: 'Users Covered', value: usersCovered, color: 'var(--green-light)' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 10, marginBottom: 4 }}>
      {stats.map((s) => (
        <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Cinzel',serif" }}>{s.value}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
