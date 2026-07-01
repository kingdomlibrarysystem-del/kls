import { Shield, Users, X } from 'lucide-react'
import { permissionLabels, type Role } from './roles-data'

interface RoleDetailModalProps {
  role: Role | null
  onClose: () => void
}

/** Read-only details view for a role — full permission list (the card view only shows the first 4). */
export function RoleDetailModal({ role, onClose }: RoleDetailModalProps) {
  if (!role) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, width: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Shield size={18} color="var(--gold)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{role.name}</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>{role.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
          <Users size={13} /> {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>
          PERMISSIONS ({role.permissions.length})
        </p>
        {role.permissions.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No permissions assigned.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {role.permissions.map((p) => (
              <span key={p} style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: 4, padding: '4px 8px' }}>
                {permissionLabels[p] ?? p}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
