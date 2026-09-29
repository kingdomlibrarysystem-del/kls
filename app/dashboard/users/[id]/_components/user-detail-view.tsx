'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Shield, CalendarDays, Activity, ArrowLeft, Pencil, Trash2, UserX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { UserFormModal } from '../../_components/user-form-modal'
import { DeleteUserModal } from '../../_components/delete-user-modal'
import { updateUserRequest, removeUserRequest, type NewUserInput } from '../../_components/use-users'
import { roleColor, statusColors, type PlatformUser } from '../../_components/users-data'

interface UserDetailViewProps {
  /** Loaded on the server by page.tsx (404s when missing) — no fetch on mount. */
  initialUser: PlatformUser
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single platform user, replacing the modal
 * that used to open from the Users table's "View" button. The user is
 * loaded on the server by page.tsx, and Edit/Delete call the standalone
 * request helpers rather than useUsers() (which would download the
 * whole user list just to expose those two actions).
 */
export function UserDetailView({ initialUser }: UserDetailViewProps) {
  const router = useRouter()
  const [user, setUser] = useState<PlatformUser | null>(initialUser)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async (data: NewUserInput, editingId: string | null) => {
    if (!editingId) return
    await updateUserRequest(editingId, data)
    setEditing(false)
    setUser((prev) => (prev ? { ...prev, ...data, status: data.status } : prev))
  }

  const handleDelete = async (target: PlatformUser) => {
    await removeUserRequest(target.id)
    router.push('/dashboard/users')
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="User Details" />
        <EmptyState icon={UserX} title="User not found" description="This user does not exist or was deleted." />
        <div className="mt-4">
          <UniversalButton href="/dashboard/users" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Users
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/users" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Users
        </UniversalButton>
        <div className="flex gap-2">
          <UniversalButton variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
            Edit
          </UniversalButton>
          <UniversalButton
            variant="destructive"
            size="sm"
            icon={<Trash2 size={13} />}
            onClick={() => setDeleting(true)}
          >
            Delete
          </UniversalButton>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-w-100 flex items-center justify-center font-cinzel text-xl font-bold text-w-600 shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-cinzel text-xl font-semibold text-w-950">{user.name}</h1>
            <p className="font-lato text-sm text-w-600">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${roleColor(user.role)}`}>
            {user.role}
          </span>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusColors[user.status]}`}>
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<Mail size={13} />} label="Email" value={user.email} />
          <DetailRow icon={<Shield size={13} />} label="Role" value={user.role} />
          <DetailRow icon={<Activity size={13} />} label="Status" value={user.status} />
          <DetailRow icon={<CalendarDays size={13} />} label="Joined" value={user.joinDate} />
        </div>
      </div>

      <UserFormModal open={editing} editing={user} onClose={() => setEditing(false)} onSave={handleSave} />
      <DeleteUserModal user={deleting ? user : null} onClose={() => setDeleting(false)} onConfirm={handleDelete} />
    </div>
  )
}
