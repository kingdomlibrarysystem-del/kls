'use client'

import { useState } from 'react'
import { Shield, Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'
import type { Role } from './_components/roles-data'
import { useRoles, addRole, updateRole, removeRole } from './_components/use-roles'
import { RoleCards } from './_components/role-cards'
import { RolesStats } from './_components/roles-stats'
import { RoleDetailModal } from './_components/role-detail-modal'
import { RoleEditModal } from './_components/role-edit-modal'
import { RoleCreateModal, type NewRoleForm } from './_components/role-create-modal'

const EMPTY_NEW_ROLE: NewRoleForm = { name: '', description: '', permissions: [] }

/** Role & Permission Management: full CRUD plus a details view over the shared role store. */
export default function RolesPage() {
  const roles = useRoles()
  const [viewing, setViewing] = useState<Role | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newRole, setNewRole] = useState<NewRoleForm>(EMPTY_NEW_ROLE)

  const handleEdit = (role: Role) => setEditingRole({ ...role })
  const handleDelete = (id: string) => removeRole(id)

  const handleTogglePerm = (perm: string) => {
    if (!editingRole) return
    const updated = editingRole.permissions.includes(perm)
      ? editingRole.permissions.filter((p) => p !== perm)
      : [...editingRole.permissions, perm]
    setEditingRole({ ...editingRole, permissions: updated })
  }

  const handleSave = (role: Role) => {
    updateRole(role)
    setEditingRole(null)
  }

  const handleCreate = () => {
    if (!newRole.name.trim()) return
    addRole({ name: newRole.name, description: newRole.description, permissions: newRole.permissions })
    setShowCreate(false)
    setNewRole(EMPTY_NEW_ROLE)
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={22} color="var(--gold)" />
          <div>
            <div className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>ROLE & PERMISSION MANAGEMENT</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Create and manage roles, assign permissions to control access</div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
          >
            <Plus size={14} /> New Role
          </button>
        </div>

        <RolesStats roles={roles} />

        <RoleCards roles={roles} onView={setViewing} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <RoleDetailModal role={viewing} onClose={() => setViewing(null)} />
      <RoleEditModal role={editingRole} onTogglePerm={handleTogglePerm} onClose={() => setEditingRole(null)} onSave={handleSave} />
      <RoleCreateModal open={showCreate} form={newRole} onChange={setNewRole} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </PageTransition>
  )
}
