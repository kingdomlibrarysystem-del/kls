import { Mail, Shield, CalendarDays, Activity } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { roleColors, statusColors, type PlatformUser } from './users-data'

interface UserDetailModalProps {
  user: PlatformUser | null
  onClose: () => void
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

/** Read-only details view for a single platform user. */
export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  return (
    <Modal open={!!user} onClose={onClose} title="User Details" size="md">
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-w-100 flex items-center justify-center font-cinzel text-lg font-bold text-w-600 shrink-0">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-cinzel text-base font-semibold text-w-950">{user.name}</h3>
              <p className="font-lato text-xs text-w-600">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${roleColors[user.role]}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusColors[user.status]}`}>
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<Mail size={13} />} label="Email" value={user.email} />
            <DetailRow icon={<Shield size={13} />} label="Role" value={user.role} />
            <DetailRow icon={<Activity size={13} />} label="Status" value={user.status} />
            <DetailRow icon={<CalendarDays size={13} />} label="Joined" value={user.joinDate} />
          </div>
        </div>
      )}
    </Modal>
  )
}
