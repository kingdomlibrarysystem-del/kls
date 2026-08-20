import Link from 'next/link'
import { BookOpen, Hash, Globe, Layers, Calendar, Copy, BookMarked, Film, FileText, Music, Video } from 'lucide-react'
import { getCategoryName } from '@/lib/kcs-taxonomy'
import { statusConfig, bindingTypeLabels, mediaTypeLabels, type Resource } from '../../_components/resources-data'

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Type/category/language/year/pages/isbn/publisher/status/binding/media grid, extracted from the original detail modal. */
export function ResourceDetailRows({ resource }: { resource: Resource }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <DetailRow icon={<BookOpen size={13} />} label="Type" value={`${resource.type} · ${resource.format}`} />
      <DetailRow icon={<Layers size={13} />} label="Category" value={getCategoryName(resource.categoryId)} />
      <DetailRow icon={<Globe size={13} />} label="Language" value={resource.language} />
      <DetailRow icon={<Calendar size={13} />} label="Year" value={String(resource.year)} />
      <DetailRow icon={<BookOpen size={13} />} label="Pages" value={`${resource.pages} pages`} />
      <DetailRow icon={<Hash size={13} />} label="ISBN" value={resource.isbn} />
      <DetailRow icon={<Copy size={13} />} label="Publisher" value={resource.publisher} />
      <DetailRow icon={<Layers size={13} />} label="Status" value={statusConfig[resource.status].label} />
      <DetailRow icon={<BookMarked size={13} />} label="Binding" value={bindingTypeLabels[resource.bindingType]} />
      <DetailRow icon={<Film size={13} />} label="Media" value={mediaTypeLabels[resource.mediaType]} />
    </div>
  )
}

/** Document/audio/video link chips, extracted from the original detail modal. Document opens the real page-by-page reader instead of downloading the raw Cloudinary PDF (browsers force-download resource_type: raw URLs). */
export function ResourceMediaLinks({ resource }: { resource: Resource }) {
  if (!resource.documentUrl && !resource.audioUrl && !resource.videoUrl) return null
  return (
    <div className="flex flex-wrap gap-2">
      {resource.documentUrl && (
        <Link href={`/member/library/read/${resource.id}`} target="_blank" className="flex items-center gap-1.5 px-2 py-1 bg-w-100 text-w-700 rounded text-xs font-lato hover:text-w-950">
          <FileText size={12} /> Read Document
        </Link>
      )}
      {resource.audioUrl && (
        <a href={resource.audioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-w-100 text-w-700 rounded text-xs font-lato hover:text-w-950">
          <Music size={12} /> Audio
        </a>
      )}
      {resource.videoUrl && (
        <a href={resource.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-w-100 text-w-700 rounded text-xs font-lato hover:text-w-950">
          <Video size={12} /> Video
        </a>
      )}
    </div>
  )
}
