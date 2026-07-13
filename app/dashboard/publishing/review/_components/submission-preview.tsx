import Image from 'next/image'
import type { PublicationSubmission } from './review-data'

const languageLabels: Record<PublicationSubmission['language'], string> = { en: 'EN', fr: 'FR', rw: 'RW' }

interface SubmissionPreviewProps {
  submission: PublicationSubmission
}

/** Read-only preview of the full submission a reviewer is deciding on — cover, category, language, description. */
export function SubmissionPreview({ submission }: SubmissionPreviewProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 bg-form-highlight border border-w-300 rounded-lg p-3">
      <div className="relative w-full sm:w-24 h-32 shrink-0 rounded overflow-hidden bg-w-200">
        <Image src={submission.coverImage} alt={submission.title} fill className="object-cover" sizes="96px" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold">
            {languageLabels[submission.language]}
          </span>
          <span className="px-2 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">{submission.category}</span>
        </div>
        <h4 className="font-cinzel text-sm font-semibold text-w-950 mb-0.5">{submission.title}</h4>
        <p className="font-lato text-xs text-w-700 mb-2">by {submission.contributor}</p>
        <p className="font-lato text-xs text-w-700 leading-relaxed line-clamp-3">{submission.description}</p>
      </div>
    </div>
  )
}
