'use client'

import { useState } from 'react'
import { Eye, Pencil, Trash2, PlusCircle, Users as UsersIcon, Archive, RotateCcw } from 'lucide-react'
import { LocalDate } from '@/components/ui/local-date'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAuth } from '@/contexts/auth-context'
import { logAuditEvent } from '@/app/dashboard/audit-log/_components/use-audit-log'
import { roleColor, statusColors, type PlatformUser } from './users-data'
import { useUsers, type NewUserInput, type DeleteProgress } from './use-users'
import { UserFormModal } from './user-form-modal'
import { DeleteUserModal, type DeleteMode } from './delete-user-modal'
import { NewUserCredentialsModal } from './new-user-credentials-modal'
import { UsersStats } from './users-stats'

/**
 * User Management: full CRUD over the real /api/users backend, with two ways
 * to delete — Move to Trash (soft delete, restorable: RULES.md deletedAt) and
 * Delete Permanently. Trashed accounts are listed in their own Trash tab.
 */
export function UsersView() {
  const { users, trashed, loading, addUser, updateUser, removeUser, trashUser, restoreUser } = useUsers()
  const [tab, setTab] = useState<'users' | 'trash'>('users')
  const [toast, setToast] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformUser | null>(null)
  const [deleting, setDeleting] = useState<{ user: PlatformUser; mode: DeleteMode } | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress | null>(null)
  const [newCredentials, setNewCredentials] = useState<{ name: string; email: string; temporaryPassword: string } | null>(null)
  const { user: currentUser } = useAuth()
  const actorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin User'

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (user: PlatformUser) => { setEditing(user); setFormOpen(true) }

  const handleSave = async (data: NewUserInput, editingId: string | null) => {
    try {
      if (editingId) {
        const before = users.find((u) => u.id === editingId)
        await updateUser(editingId, data)
        if (before && before.role !== data.role) {
          logAuditEvent({
            actor: actorName,
            action: 'ROLE_ASSIGNED',
            target: `${data.name} → ${data.role}`,
            notes: `Before: ${before.role}. After: ${data.role}.`,
          })
        }
        showToast(`Updated "${data.name}".`)
      } else {
        const created = await addUser(data)
        logAuditEvent({
          actor: actorName,
          action: 'USER_CREATED',
          target: `${data.name} (${data.role})`,
          notes: 'Account created directly by admin, not self-registered.',
        })
        setNewCredentials({ name: created.name, email: created.email, temporaryPassword: created.temporaryPassword })
      }
      setFormOpen(false)
      setEditing(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save this user — please try again.')
    }
  }

  const handleDelete = async (user: PlatformUser, mode: DeleteMode) => {
    setDeleteBusy(true)
    setDeleteProgress(null)
    try {
      if (mode === 'trash') {
        await trashUser(user.id)
        showToast(`Moved "${user.name}" to Trash.`)
      } else {
        await removeUser(user.id, setDeleteProgress)
        showToast(`Permanently deleted "${user.name}".`)
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete this user — please try again.')
    } finally {
      setDeleteBusy(false)
      setDeleteProgress(null)
      setDeleting(null)
    }
  }

  const handleRestore = async (user: PlatformUser) => {
    try {
      await restoreUser(user.id)
      showToast(`Restored "${user.name}".`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not restore this user — please try again.')
    }
  }

  const permanentButton = (u: PlatformUser) => (
    <button onClick={() => setDeleting({ user: u, mode: 'permanent' })} aria-label={`Delete ${u.name} permanently`} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border border-red-200 dark:border-destructive/30 rounded text-xs font-lato hover:bg-red-100 dark:hover:bg-destructive/20 transition-colors">
      <Trash2 size={12} /> Delete Permanently
    </button>
  )

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
      render: (u) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${roleColor(u.role)}`}>{u.role}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (u) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusColors[u.status]}`}>{u.status.charAt(0).toUpperCase() + u.status.slice(1)}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <UniversalButton
            href={`/dashboard/users/${u.id}`}
            aria-label={`View ${u.name}`}
            variant="outline"
            size="sm"
            icon={<Eye size={12} />}
          >
            View
          </UniversalButton>
          <button onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors">
            <Pencil size={12} /> Edit
          </button>
          <button onClick={() => setDeleting({ user: u, mode: 'trash' })} aria-label={`Move ${u.name} to Trash`} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 dark:hover:bg-white/10 transition-colors">
            <Archive size={12} /> Trash
          </button>
          {permanentButton(u)}
        </div>
      ),
    },
  ]

  const trashColumns: Column<PlatformUser>[] = [
    ...columns.slice(0, 3),
    {
      key: 'deletedAt', label: 'Moved to Trash', sortable: true,
      render: (u) => (u.deletedAt ? <LocalDate value={u.deletedAt} options={{ dateStyle: 'medium' }} className="text-w-700" /> : <span className="text-w-700">—</span>),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => handleRestore(u)} aria-label={`Restore ${u.name}`} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-success/10 text-green-700 dark:text-success border border-green-200 dark:border-success/30 rounded text-xs font-lato hover:bg-green-100 dark:hover:bg-success/20 transition-colors">
            <RotateCcw size={12} /> Restore
          </button>
          {permanentButton(u)}
        </div>
      ),
    },
  ]

  const tabCls = (active: boolean) =>
    `flex items-center gap-1.5 px-4 py-2.5 font-lato text-sm font-semibold border-b-2 -mb-px transition-colors ${active ? 'text-w-950 border-w-600 dark:border-primary' : 'text-w-700 border-transparent hover:text-w-950'}`

  return (
    <div>
      <UsersStats data={users} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="font-lato text-xs text-w-600 uppercase tracking-wider font-semibold">{users.length} users total</p>
        <ElegantButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5 text-sm py-2">
          <PlusCircle size={15} /> Add User
        </ElegantButton>
      </div>

      {toast && (
        <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>
      )}

      <div className="mb-4 flex gap-1 border-b border-w-300" role="tablist">
        <button role="tab" aria-selected={tab === 'users'} onClick={() => setTab('users')} className={tabCls(tab === 'users')}>
          <UsersIcon size={15} /> Users ({users.length})
        </button>
        <button role="tab" aria-selected={tab === 'trash'} onClick={() => setTab('trash')} className={tabCls(tab === 'trash')}>
          <Archive size={15} /> Trash ({trashed.length})
        </button>
      </div>

      {tab === 'trash' ? (
        trashed.length === 0 ? (
          <EmptyState icon={Archive} title="Trash is empty" description="Users you move to Trash appear here. You can restore them or delete them permanently." />
        ) : (
          <DataTable<PlatformUser>
            data={trashed}
            columns={trashColumns}
            rowKey={(u) => u.id}
            searchPlaceholder="Search by name or email..."
            searchFilter={(u, q) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)}
            emptyMessage="No users match your search."
          />
        )
      ) : users.length === 0 ? (
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
      <DeleteUserModal user={deleting?.user ?? null} mode={deleting?.mode ?? 'trash'} busy={deleteBusy} progress={deleteProgress} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
      <NewUserCredentialsModal
        credentials={newCredentials}
        onClose={() => { setNewCredentials(null); setFormOpen(false); setEditing(null) }}
      />
    </div>
  )
}
