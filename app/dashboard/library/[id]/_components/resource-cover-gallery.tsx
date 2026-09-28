import Image from 'next/image'
import { BookOpen } from 'lucide-react'
import { statusConfig, type Resource } from '../../_components/resources-data'

interface ResourceCoverGalleryProps {
  resource: Resource
}

/** Cover image + thumbnail strip + stock badge, extracted from the original detail modal's left column. */
export function ResourceCoverGallery({ resource }: ResourceCoverGalleryProps) {
  return (
    <div className="shrink-0">
      <div className="relative w-40 h-56 rounded-lg overflow-hidden border border-w-300 bg-w-200">
        {resource.coverImages[0] ? (
          <Image src={resource.coverImages[0]} alt={resource.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <BookOpen size={22} className="text-w-400" />
            <span className="font-lato text-[10px] font-semibold text-w-500 uppercase tracking-wide">Kingdom Library</span>
          </div>
        )}
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
  )
}
