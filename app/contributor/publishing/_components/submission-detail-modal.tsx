import { Tag, CalendarDays, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { publicationStatusConfig, type MySubmission } from './my-submissions-data'

interface SubmissionDetailModalProps {
  submission: MySubmission | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--gold)', marginTop: 2 }} className="shrink-0">{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 70 }} className="shrink-0">{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/** Read-only details view for a single submission belonging to this contributor. */
export function SubmissionDetailModal({ submission, onClose }: SubmissionDetailModalProps) {
  return (
    <Modal open={!!submission} onClose={onClose} title="Submission Details" size="sm">
      {submission && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{submission.title}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${publicationStatusConfig[submission.status].cls}`}>
              {publicationStatusConfig[submission.status].label}
            </span>
          </div>

          <div className="card space-y-2">
            <DetailRow icon={<Tag size={13} />} label="Category" value={submission.category} />
            <DetailRow icon={<CalendarDays size={13} />} label="Submitted" value={submission.submittedAt} />
            <DetailRow icon={<Hash size={13} />} label="ID" value={submission.id} />
          </div>
        </div>
      )}
    </Modal>
  )
}
