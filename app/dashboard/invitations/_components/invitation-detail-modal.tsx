import { Mail, Shield, CalendarDays, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { invitationStatusConfig, type Invitation } from './invitations-data'

interface InvitationDetailModalProps {
  invitation: Invitation | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-16 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Read-only details view for a single invitation. */
export function InvitationDetailModal({ invitation, onClose }: InvitationDetailModalProps) {
  return (
    <Modal open={!!invitation} onClose={onClose} title="Invitation Details" size="sm">
      {invitation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-cinzel text-base font-semibold text-w-950 break-all">{invitation.email}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${invitationStatusConfig[invitation.status].cls}`}>
              {invitationStatusConfig[invitation.status].label}
            </span>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<Mail size={13} />} label="Email" value={invitation.email} />
            <DetailRow icon={<Shield size={13} />} label="Role" value={invitation.role.name} />
            <DetailRow icon={<CalendarDays size={13} />} label="Sent" value={new Date(invitation.sentAt).toLocaleDateString()} />
            <DetailRow icon={<Hash size={13} />} label="ID" value={invitation.id} />
          </div>
        </div>
      )}
    </Modal>
  )
}
