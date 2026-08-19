import { Shield, Eye, Edit3, Trash2, Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { permissionLabels, type Role } from './roles-data'

interface RoleCardsProps {
  roles: Role[]
  onEdit: (role: Role) => void
  onDelete: (id: string) => void
}

/** Grid of role summary cards with View/Edit/Delete actions. */
export function RoleCards({ roles, onEdit, onDelete }: RoleCardsProps) {
  if (roles.length === 0) {
    return <EmptyState icon={Shield} title="No roles defined" description="Use New Role above to create the first role." style={{ color: 'var(--text-secondary)' }} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ gap: 10 }}>
      {roles.map((role) => (
        <div key={role.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={18} color="var(--gold)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{role.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{role.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <Users size={12} /> {role.userCount}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
            {role.permissions.slice(0, 4).map((p) => (
              <span key={p} style={{ fontSize: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: 3, padding: '2px 5px', color: 'var(--text-muted)' }}>{permissionLabels[p] ?? p}</span>
            ))}
            {role.permissions.length > 4 && <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>+{role.permissions.length - 4} more</span>}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <UniversalButton
              href={`/dashboard/roles/${role.id}`}
              aria-label={`View ${role.name}`}
              variant="dim-outline"
              size="sm"
              icon={<Eye size={12} />}
              style={{ padding: '4px 8px', fontSize: 10 }}
            >
              View
            </UniversalButton>
            <button onClick={() => onEdit(role)} aria-label={`Edit ${role.name}`} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: 'var(--text-secondary)' }}>
              <Edit3 size={12} /> Edit
            </button>
            <button onClick={() => onDelete(role.id)} aria-label={`Delete ${role.name}`} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: 'var(--red-light)' }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
