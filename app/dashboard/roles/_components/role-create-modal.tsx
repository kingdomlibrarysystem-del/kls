import { Shield, X, Plus } from 'lucide-react'
import { defaultPermissions, permissionLabels } from './roles-data'

export interface NewRoleForm {
  name: string
  description: string
  permissions: string[]
}

interface RoleCreateModalProps {
  open: boolean
  form: NewRoleForm
  onChange: (form: NewRoleForm) => void
  onClose: () => void
  onCreate: () => void
}

/** Create modal for a brand-new role. */
export function RoleCreateModal({ open, form, onChange, onClose, onCreate }: RoleCreateModalProps) {
  if (!open) return null

  const togglePerm = (perm: string) => onChange({
    ...form,
    permissions: form.permissions.includes(perm) ? form.permissions.filter((p) => p !== perm) : [...form.permissions, perm],
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, width: 450 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Shield size={18} color="var(--gold)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Create New Role</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Role Name</label>
          <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="e.g. Editor" style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Description</label>
          <input value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="Brief description of this role" style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Permissions</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {defaultPermissions.map((perm) => (
              <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px 0' }}>
                <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePerm(perm)} style={{ accentColor: 'var(--gold)' }} />
                {permissionLabels[perm] ?? perm}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 14px', cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={onCreate} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
            <Plus size={14} /> Create Role
          </button>
        </div>
      </div>
    </div>
  )
}
