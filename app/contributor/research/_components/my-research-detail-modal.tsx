import { Calendar, FileText, Users } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { projectStatusConfig, type ResearchProjectSummary } from '@/app/dashboard/research/collaborations/_components/collaborations-data'
import { ContributorInitials } from './contributor-initials'

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
            <span
              className="shrink-0"
              style={{
                padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: `1px solid ${projectStatusConfig[project.status].border}`, background: projectStatusConfig[project.status].bg, color: projectStatusConfig[project.status].color,
              }}
            >
              {projectStatusConfig[project.status].label}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{project.description}</p>

          <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            <Calendar size={12} /> Started {project.startDate}
          </p>

          <div>
            <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              <Users size={12} /> Contributors ({project.contributors.length})
            </p>
            <div className="flex flex-col gap-2">
              {project.contributors.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <ContributorInitials contributor={c} />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>

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
