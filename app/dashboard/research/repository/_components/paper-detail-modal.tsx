import { User, FolderOpen, CalendarDays, Tag, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { paperStatusConfig, type ResearchPaper } from './repository-data'

interface PaperDetailModalProps {
  paper: ResearchPaper | null
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

/** Read-only details view for a single research paper. */
export function PaperDetailModal({ paper, onClose }: PaperDetailModalProps) {
  return (
    <Modal open={!!paper} onClose={onClose} title="Paper Details" size="md">
      {paper && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{paper.title}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${paperStatusConfig[paper.status].cls}`}>
              {paperStatusConfig[paper.status].label}
            </span>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<User size={13} />} label="Author" value={paper.author} />
            <DetailRow icon={<FolderOpen size={13} />} label="Project" value={paper.project} />
            <DetailRow icon={<CalendarDays size={13} />} label="Published" value={paper.publishedAt} />
            <DetailRow icon={<Hash size={13} />} label="ID" value={paper.id} />
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
              <Tag size={12} /> Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {paper.keywords.map((k) => (
                <span key={k} className="px-2 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">{k}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
