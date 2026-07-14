import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Archive, BookOpen, Hash, Globe, Layers, Calendar, Copy, BookMarked, Film, BookOpenCheck } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { statusConfig, bindingTypeLabels, mediaTypeLabels, type Resource } from './resources-data'

interface ResourceDetailModalProps {
  resource: Resource | null
  onClose: () => void
  onEdit: (resource: Resource) => void
  onArchive: (resource: Resource) => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Read-only details view for a single library resource, extracted verbatim from the original page.tsx. */
export function ResourceDetailModal({ resource, onClose, onEdit, onArchive }: ResourceDetailModalProps) {
  const readableContent = useReadableContent()
  const isReadable = !!resource && !!readableContent[resource.id]

  return (
    <Modal open={!!resource} onClose={onClose} title="Resource Details" size="xl">
      {resource && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0">
            <div className="relative w-40 h-56 rounded-lg overflow-hidden border border-w-300 bg-w-200">
              <Image src={resource.coverImages[0]} alt={resource.title} fill className="object-cover" />
            </div>
            {resource.coverImages.length > 1 && (
              <div className="flex gap-1.5 mt-2">
                {resource.coverImages.slice(1).map((src, i) => (
                  <div key={src} className="relative w-9 h-12 rounded overflow-hidden border border-w-300 bg-w-200">
                    <Image src={src} alt={`${resource.title} — additional cover ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className={`mt-3 text-center py-1.5 rounded text-xs font-lato font-semibold border ${statusConfig[resource.status].cls}`}>
              {resource.availableQty} / {resource.totalQty} available
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-cinzel text-lg font-semibold text-w-950 leading-snug">{resource.title}</h3>
              <p className="font-lato text-sm text-w-700 mt-0.5">by {resource.author}</p>
              <p className="font-cinzel text-base font-bold text-w-600 mt-1">{resource.price.toLocaleString()} RWF</p>
            </div>

            <div className="bg-form-highlight border border-w-300 rounded p-3">
              <p className="font-lato text-xs text-w-700 leading-relaxed">{resource.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <DetailRow icon={<BookOpen size={13} />} label="Type" value={`${resource.type} · ${resource.format}`} />
              <DetailRow icon={<Layers size={13} />} label="Category" value={resource.category} />
              <DetailRow icon={<Globe size={13} />} label="Language" value={resource.language} />
              <DetailRow icon={<Calendar size={13} />} label="Year" value={String(resource.year)} />
              <DetailRow icon={<BookOpen size={13} />} label="Pages" value={`${resource.pages} pages`} />
              <DetailRow icon={<Hash size={13} />} label="ISBN" value={resource.isbn} />
              <DetailRow icon={<Copy size={13} />} label="Publisher" value={resource.publisher} />
              <DetailRow icon={<Layers size={13} />} label="Status" value={statusConfig[resource.status].label} />
              <DetailRow icon={<BookMarked size={13} />} label="Binding" value={bindingTypeLabels[resource.bindingType]} />
              <DetailRow icon={<Film size={13} />} label="Media" value={mediaTypeLabels[resource.mediaType]} />
            </div>

            {resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {resource.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-w-100 text-w-700 rounded text-xs font-lato">#{t}</span>)}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-w-300">
              <ElegantButton variant="primary" className="flex items-center gap-1.5 text-xs py-2" onClick={() => onEdit(resource)}>
                <Pencil size={13} /> Edit Resource
              </ElegantButton>
              {resource.status !== 'archived' && (
                <ElegantButton variant="outline" className="flex items-center gap-1.5 text-xs py-2" onClick={() => onArchive(resource)}>
                  <Archive size={13} /> Archive
                </ElegantButton>
              )}
              {isReadable && (
                <Link href={`/member/library/read/${resource.id}`} target="_blank">
                  <ElegantButton variant="outline" className="flex items-center gap-1.5 text-xs py-2">
                    <BookOpenCheck size={13} /> Preview Reader
                  </ElegantButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
