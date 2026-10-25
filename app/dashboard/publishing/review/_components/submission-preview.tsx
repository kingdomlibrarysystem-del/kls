import { BookOpen, FileText, Music, Video } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { MediaTypeName } from '@/components/media-type-name'
import type { PublicationSubmission } from './review-data'

const languageLabels: Record<PublicationSubmission['language'], string> = { en: 'EN', fr: 'FR', rw: 'RW' }

/** The optional book details a publisher's submission carries (see PublicationRecord). */
type SubmissionDetails = PublicationSubmission & Partial<{
  author: string
  mediaType: string
  documentUrl: string
  audioUrl: string
  videoUrl: string
  pages: number
  price: number
  borrowPrice: number
  quantity: number
  chapters: { title: string; body: string }[]
}>

const money = (n?: number) => (n ? `${n.toLocaleString()} RWF` : 'Free')

/** Read-only preview of the book a reviewer is deciding on: cover, KCS category, author, files to open, price. */
export function SubmissionPreview({ submission }: { submission: SubmissionDetails }) {
  const files = [
    submission.documentUrl && { href: submission.documentUrl, label: 'Open PDF', icon: <FileText size={12} /> },
    submission.audioUrl && { href: submission.audioUrl, label: 'Play audio', icon: <Music size={12} /> },
    submission.videoUrl && { href: submission.videoUrl, label: 'Play video', icon: <Video size={12} /> },
  ].filter((f): f is { href: string; label: string; icon: React.ReactElement } => !!f)

  return (
    <div className="mb-4 flex flex-col gap-4 rounded-lg border border-w-300 bg-form-highlight p-3 sm:flex-row">
      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded bg-w-200 sm:w-24 dark:bg-white/10">
        <RemoteImage
          src={submission.coverImage}
          alt={submission.title}
          fill
          className="object-cover"
          sizes="96px"
          fallback={<div className="flex size-full items-center justify-center text-w-600"><BookOpen size={20} /></div>}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-w-100 px-2 py-0.5 font-lato text-xs font-semibold text-w-950">{languageLabels[submission.language] ?? submission.language}</span>
          {submission.category && <span className="rounded bg-w-100 px-2 py-0.5 font-lato text-xs text-w-700">{submission.category}</span>}
          {submission.mediaType && <span className="rounded bg-w-100 px-2 py-0.5 font-lato text-xs text-w-700"><MediaTypeName code={submission.mediaType} /></span>}
        </div>
        <h4 className="mb-0.5 font-cinzel text-sm font-semibold text-w-950">{submission.title}</h4>
        <p className="mb-2 font-lato text-xs text-w-700">
          by {submission.author || submission.contributor}{submission.author && submission.author !== submission.contributor && ` · submitted by ${submission.contributor}`}
        </p>
        <p className="mb-2 line-clamp-3 font-lato text-xs leading-relaxed text-w-700">{submission.description}</p>
        <p className="font-lato text-xs text-w-700">
          Buy: {money(submission.price)} · Borrow: {money(submission.borrowPrice)}
          {submission.pages ? ` · ${submission.pages} pages` : ''}
          {submission.quantity !== undefined ? ` · ${submission.quantity} copies` : ''}
        </p>
        {(submission.chapters?.length ?? 0) > 0 && (
          <details className="mt-2 font-lato text-xs text-w-700">
            <summary className="cursor-pointer font-semibold text-w-950">{submission.chapters!.length} written chapter{submission.chapters!.length === 1 ? '' : 's'}</summary>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              {submission.chapters!.map((c, i) => <li key={i}>{c.title} <span className="text-w-600">· {c.body.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words</span></li>)}
            </ol>
          </details>
        )}
        {files.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {files.map((f) => (
              <a key={f.label} href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-w-300 bg-w-100 px-2 py-1 font-lato text-xs text-w-950 hover:bg-w-200 dark:hover:bg-white/10">
                {f.icon} {f.label}
              </a>
            ))}
          </div>
        ) : (
          !(submission.chapters?.length) && <p className="mt-2 font-lato text-xs text-w-600">No file and no written chapters.</p>
        )}
      </div>
    </div>
  )
}
