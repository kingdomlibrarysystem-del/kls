import { Calendar, Users, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { projectStatusConfig, type ResearchProjectSummary } from './collaborations-data'
import { ContributorAvatar } from './contributor-avatar'

interface ProjectDetailModalProps {
  project: ResearchProjectSummary | null
  onClose: () => void
}

/** Read-only details view for a single research project's collaboration record. */
export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  return (
    <Modal open={!!project} onClose={onClose} title="Project Details" size="md">
      {project && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{project.title}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${projectStatusConfig[project.status].cls}`}>
              {projectStatusConfig[project.status].label}
            </span>
          </div>

          <p className="font-lato text-sm text-w-700 leading-relaxed">{project.description}</p>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Calendar size={13} className="text-w-600 mt-0.5 shrink-0" />
              <span className="font-lato text-xs text-w-700 w-20 shrink-0">Started</span>
              <span className="font-lato text-sm text-w-950 font-medium">{project.startDate}</span>
            </div>
            <div className="flex items-start gap-2">
              <Hash size={13} className="text-w-600 mt-0.5 shrink-0" />
              <span className="font-lato text-xs text-w-700 w-20 shrink-0">ID</span>
              <span className="font-lato text-sm text-w-950 font-medium">{project.id}</span>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
              <Users size={12} /> Contributors ({project.contributors.length})
            </p>
            <ul className="space-y-2">
              {project.contributors.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <ContributorAvatar contributor={c} />
                  <span className="font-lato text-sm text-w-950">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  )
}
