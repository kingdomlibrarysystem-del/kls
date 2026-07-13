import { Calendar, FileText } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { projectStatusConfig, type ResearchProjectSummary } from '@/app/dashboard/research/collaborations/_components/collaborations-data'

interface MyResearchDetailModalProps {
  project: ResearchProjectSummary | null
  /** Papers linked to this project that this contributor authored, computed live from the shared repository store. */
  myPapers: { id: string; title: string }[]
  onClose: () => void
}

/** Read-only details view for one of this contributor's own research projects, including their linked papers. */
export function MyResearchDetailModal({ project, myPapers, onClose }: MyResearchDetailModalProps) {
  return (
    <Modal open={!!project} onClose={onClose} title="Project Details" size="sm">
      {project && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{project.title}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${projectStatusConfig[project.status].cls}`}>
              {projectStatusConfig[project.status].label}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{project.description}</p>

          <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <Calendar size={12} /> Started {project.startDate}
          </p>

          <div>
            <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <FileText size={12} /> Your Papers on This Project ({myPapers.length})
            </p>
            {myPapers.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No papers submitted yet for this project.</p>
            ) : (
              <ul className="space-y-1">
                {myPapers.map((p) => (
                  <li key={p.id} style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.title}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
