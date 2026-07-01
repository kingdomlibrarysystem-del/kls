import { Shield, X, Check } from 'lucide-react'
import { defaultPermissions, permissionLabels, type Role } from './roles-data'

interface RoleEditModalProps {
  role: Role | null
  onTogglePerm: (perm: string) => void
  onClose: () => void
  onSave: (role: Role) => void
}

/** Edit modal for an existing role's permission set. */
export function RoleEditModal({ role, onTogglePerm, onClose, onSave }: RoleEditModalProps) {
  if (!role) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, width: 500, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Shield size={18} color="var(--gold)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Role: {role.name}</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Permissions</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {defaultPermissions.map((perm) => (
              <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px 0' }}>
                <input type="checkbox" checked={role.permissions.includes(perm)} onChange={() => onTogglePerm(perm)} style={{ accentColor: 'var(--gold)' }} />
                {permissionLabels[perm] ?? perm}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 14px', cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={() => onSave(role)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            <Check size={14} /> Save
          </button>
        </div>
      </div>
    </div>
  )
}
