'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Headphones, Video, FileText } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'

export interface Resource {
  id: string
  title: string
  author: string
  category: string
  type: string        // book | ebook | journal | magazine | audio | video
  format: string      // physical | digital
  language: string
  year: number
  pages?: number
  isbn?: string
  price: number       // RWF
  available: number
  total: number
  coverImage: string
  description: string
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'audio')   return <Headphones size={12} />
  if (type === 'video')   return <Video size={12} />
  if (type === 'journal') return <FileText size={12} />
  return <BookOpen size={12} />
}

function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

interface Props {
  resource: Resource
  onBorrow: (resource: Resource) => void
  onReserve: (resource: Resource) => void
}

export function ResourceCard({ resource, onBorrow, onReserve }: Props) {
  const isAvailable = resource.available > 0

  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col group">
      {/* Cover */}
      <Link href={`/dashboard/library/${resource.id}`} className="block">
        <div className="relative w-full h-48 bg-w-200 overflow-hidden">
          <Image
            src={resource.coverImage}
            alt={resource.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-w-950/80 text-white rounded text-xs font-lato">
              <TypeIcon type={resource.type} />
              {typeLabel(resource.type)}
            </span>
          </div>
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded text-xs font-lato font-semibold ${
              isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
            }`}>
              {isAvailable ? `${resource.available} left` : 'Unavailable'}
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <Link href={`/dashboard/library/${resource.id}`}>
          <h3 className="font-cinzel text-sm font-semibold text-w-950 leading-snug hover:text-w-600 transition-colors line-clamp-2">
            {resource.title}
          </h3>
        </Link>
        <p className="font-lato text-xs text-w-700">by {resource.author}</p>

        {/* Price */}
        <p className="font-cinzel text-base font-bold text-w-600">
          {resource.price.toLocaleString('en-RW')} RWF
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{resource.category}</span>
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato capitalize">{resource.format}</span>
          <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato">{resource.language.toUpperCase()}</span>
        </div>

        {/* Meta */}
        <p className="font-lato text-xs text-w-600">
          {resource.year}{resource.pages ? ` · ${resource.pages} pages` : ''}
          {resource.isbn ? ` · ISBN ${resource.isbn}` : ''}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <ElegantButton
            variant="primary"
            className="flex-1 text-xs py-2"
            onClick={() => onBorrow(resource)}
            disabled={!isAvailable}
          >
            Borrow
          </ElegantButton>
          <ElegantButton
            variant="outline"
            className="flex-1 text-xs py-2"
            onClick={() => onReserve(resource)}
          >
            Reserve
          </ElegantButton>
        </div>
      </div>
    </div>
  )
}
