'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, ArrowLeft, Pencil, Trash2, ShieldOff } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { RoleEditModal } from '../../_components/role-edit-modal'
import { permissionLabels, type Role } from '../../_components/roles-data'

interface RoleDetailViewProps {
  /** Loaded on the server by page.tsx (404s when missing) — no fetch on mount. */
  initialRole: Role
}

/**
 * Real details page for a single role, replacing the modal that used to
 * open from the Roles grid's "View" button. The role is loaded on the
 * server by page.tsx and passed in, so it renders immediately.
 */
export function RoleDetailView({ initialRole }: RoleDetailViewProps) {
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(initialRole)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')

  const handleTogglePerm = (perm: string) => {
    if (!role) return
    const updated = role.permissions.includes(perm)
      ? role.permissions.filter((p) => p !== perm)
      : [...role.permissions, perm]
    setRole({ ...role, permissions: updated })
  }

  const handleSave = async (updated: Role) => {
    setActionError('')
    try {
      const res = await fetch(`/api/roles/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updated.name, description: updated.description, permissions: updated.permissions }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Failed to update role')
      setRole(json.data)
      setEditing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleDelete = async () => {
    if (!role) return
    setDeleting(true)
    setActionError('')
    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message ?? 'Failed to delete role')
      }
      router.push('/dashboard/roles')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete role')
      setDeleting(false)
    }
  }

  if (!role) {
    return (
      <div>
        <EmptyState icon={ShieldOff} title="Role not found" description="This role does not exist or was deleted." style={{ color: 'var(--text-secondary)' }} />
        <div style={{ marginTop: 16 }}>
          <UniversalButton href="/dashboard/roles" variant="dim-outline" icon={<ArrowLeft size={14} />}>
            Back to Roles
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <UniversalButton href="/dashboard/roles" variant="dim-outline" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Roles
        </UniversalButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <UniversalButton variant="gold-outline" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
            Edit
          </UniversalButton>
          <UniversalButton
            variant="dim-outline"
            size="sm"
            icon={<Trash2 size={13} />}
            loading={deleting}
            onClick={handleDelete}
            style={{ color: 'var(--red-light)', borderColor: 'var(--red-light)' }}
          >
            Delete
          </UniversalButton>
        </div>
      </div>

      {actionError && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginBottom: 12 }}>{actionError}</div>
      )}

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={22} color="var(--gold)" />
          <div>
            <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{role.name}</h1>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{role.description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <Users size={13} /> {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
        </div>

        <div>
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

      <RoleEditModal role={editing ? role : null} onTogglePerm={handleTogglePerm} onClose={() => setEditing(false)} onSave={handleSave} />
    </div>
  )
}
