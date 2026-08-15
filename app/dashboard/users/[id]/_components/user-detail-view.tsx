'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Shield, CalendarDays, Activity, ArrowLeft, Pencil, Trash2, UserX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { UserFormModal } from '../../_components/user-form-modal'
import { DeleteUserModal } from '../../_components/delete-user-modal'
import { useUsers, type NewUserInput } from '../../_components/use-users'
import { roleColor, statusColors, type PlatformUser } from '../../_components/users-data'

interface UserDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/**
 * Real details page for a single platform user, replacing the modal
 * that used to open from the Users table's "View" button. Fetches
 * directly from /api/users/:id rather than looking the row up out of
 * the already-loaded list, so this page also works when linked to
 * directly (e.g. from an audit log entry) without the list being
 * loaded first.
 */
export function UserDetailView({ id }: UserDetailViewProps) {
  const router = useRouter()
  const [user, setUser] = useState<PlatformUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { updateUser, removeUser } = useUsers()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/users/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'User not found')
          return
        }
        setUser(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load user') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const handleSave = async (data: NewUserInput, editingId: string | null) => {
    if (!editingId) return
    await updateUser(editingId, data)
    setEditing(false)
    setUser((prev) => (prev ? { ...prev, ...data, status: data.status } : prev))
  }

  const handleDelete = async (target: PlatformUser) => {
    await removeUser(target.id)
    router.push('/dashboard/users')
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="User Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div>
        <PageHeader title="User Details" />
        <EmptyState icon={UserX} title="User not found" description={error || 'This user does not exist or was deleted.'} />
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
