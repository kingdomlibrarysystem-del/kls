import { Users } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { permissionLabels, type Role } from './roles-data'

interface RoleDetailModalProps {
  role: Role | null
  onClose: () => void
}

/** Read-only details view for a role — full permission list (the card view only shows the first 4). */
export function RoleDetailModal({ role, onClose }: RoleDetailModalProps) {
  return (
    <Modal open={!!role} onClose={onClose} title={role?.name ?? ''}>
      {role && (
        <div>
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
      )}
    </Modal>
  )
}
