import { Calendar, Eye, Pencil, Trash2 } from 'lucide-react'
import { UniversalButton } from '@/components/ui/universal-button'
import { projectStatusConfig, type ResearchProjectSummary } from './collaborations-data'
import { ContributorAvatar } from './contributor-avatar'

interface ProjectCollaborationCardProps {
  project: ResearchProjectSummary
  onEdit: (project: ResearchProjectSummary) => void
  onDelete: (project: ResearchProjectSummary) => void
}

/** One research project's summary card: title, status, description, contributor avatars, and View/Edit/Delete actions. */
export function ProjectCollaborationCard({ project, onEdit, onDelete }: ProjectCollaborationCardProps) {
  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 leading-snug">{project.title}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded border text-xs font-lato font-semibold ${projectStatusConfig[project.status].cls}`}>
          {projectStatusConfig[project.status].label}
        </span>
      </div>

      <p className="font-lato text-xs text-w-700 leading-relaxed">{project.description}</p>

      <p className="flex items-center gap-1.5 font-lato text-xs text-w-600">
        <Calendar size={12} /> Started {project.startDate}
      </p>

      <div>
        <p className="font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-2">
          Contributors ({project.contributors.length})
        </p>
        <div className="flex items-center -space-x-2">
          {project.contributors.map((c) => <ContributorAvatar key={c.id} contributor={c} />)}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1.5">
        <UniversalButton
          href={`/dashboard/research/collaborations/${project.id}`}
          variant="secondary"
          size="sm"
          fullWidth
          icon={<Eye size={12} />}
          aria-label={`View details for ${project.title}`}
        >
          View Details
        </UniversalButton>
        <button onClick={() => onEdit(project)} aria-label={`Edit ${project.title}`} className="shrink-0 p-2 bg-w-100 text-w-950 border border-w-300 rounded hover:bg-w-200 transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(project)} aria-label={`Delete ${project.title}`} className="shrink-0 p-2 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
