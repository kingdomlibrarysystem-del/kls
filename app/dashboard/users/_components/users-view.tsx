'use client'

import { useState, useEffect } from 'react'
import { Eye, Pencil, Trash2, PlusCircle, Users as UsersIcon } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { initialUsers, roleColors, statusColors, type PlatformUser } from './users-data'
import { UserFormModal } from './user-form-modal'
import { UserDetailModal } from './user-detail-modal'
import { DeleteUserModal } from './delete-user-modal'

/** Simulated network delay before mock users become visible. */
const LOAD_DELAY_MS = 400

/**
 * User Management: full CRUD over the mocked platform-user list — Create
 * (via modal, appended to local state), Details (read-only modal), Edit
 * (pre-filled modal writing back to state), Delete (confirmation modal
 * removing the row).
 */
export function UsersView() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [toast, setToast] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformUser | null>(null)
  const [viewing, setViewing] = useState<PlatformUser | null>(null)
  const [deleting, setDeleting] = useState<PlatformUser | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setUsers(initialUsers)
      setLoading(false)
    }, LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (user: PlatformUser) => { setEditing(user); setFormOpen(true) }

  const handleSave = (data: { name: string; email: string; role: PlatformUser['role']; status: PlatformUser['status'] }, editingId: string | null) => {
    try {
      if (editingId) {
        setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, ...data } : u)))
        showToast(`Updated "${data.name}".`)
      } else {
        const newUser: PlatformUser = { id: crypto.randomUUID(), joinDate: new Date().toISOString().split('T')[0], ...data }
        setUsers((prev) => [newUser, ...prev])
        showToast(`Added "${data.name}".`)
      }
      setFormOpen(false)
      setEditing(null)
    } catch {
      showToast('Could not save this user — please try again.')
    }
  }

  const handleDelete = (user: PlatformUser) => {
    try {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      showToast(`Deleted "${user.name}".`)
      setDeleting(null)
    } catch {
      showToast('Could not delete this user — please try again.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading users">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    )
  }

  const columns: Column<PlatformUser>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (u) => <span className="font-semibold text-w-950">{u.name}</span> },
    { key: 'email', label: 'Email', sortable: true, render: (u) => <span className="text-w-700">{u.email}</span> },
    {
      key: 'role', label: 'Role', sortable: true,
      render: (u) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${roleColors[u.role]}`}>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (u) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusColors[u.status]}`}>{u.status.charAt(0).toUpperCase() + u.status.slice(1)}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => setViewing(u)} aria-label={`View ${u.name}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
            <Eye size={12} /> View
          </button>
          <button onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
            <Pencil size={12} /> Edit
          </button>
          <button onClick={() => setDeleting(u)} aria-label={`Delete ${u.name}`} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-lato text-xs text-w-600 uppercase tracking-wider font-semibold">{users.length} users total</p>
        <ElegantButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5 text-sm py-2">
          <PlusCircle size={15} /> Add User
        </ElegantButton>
      </div>

      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>
      )}

      {users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users yet" description="Use Add User above to create the first platform user." />
      ) : (
        <DataTable<PlatformUser>
          data={users}
          columns={columns}
          rowKey={(u) => u.id}
          searchPlaceholder="Search by name or email..."
          searchFilter={(u, q) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)}
          emptyMessage="No users match your search."
        />
      )}

      <UserFormModal open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} onSave={handleSave} />
      <UserDetailModal user={viewing} onClose={() => setViewing(null)} />
      <DeleteUserModal user={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
    </div>
  )
}
