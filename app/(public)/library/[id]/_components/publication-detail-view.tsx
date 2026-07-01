'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookX, CheckCircle2, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { mockCatalog, languageBadgeLabels } from '@/app/dashboard/publishing/catalog/_components/catalog-data'
import { PublicationActionModal, type PublicationAction } from './publication-action-modal'

/** Simulated network delay before the mock publication becomes visible. */
const LOAD_DELAY_MS = 400

interface PublicationDetailViewProps {
  id: string
}

/** Publication detail: cover, description, contributor, language, availability, Borrow/Reserve actions. */
export function PublicationDetailView({ id }: PublicationDetailViewProps) {
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<PublicationAction>(null)

  const book = mockCatalog.find((b) => b.id === id)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8" aria-label="Loading publication">
        <Skeleton className="h-96 w-full rounded-lg" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <EmptyState
        icon={BookX}
        title="Publication not found"
        description="This publication doesn't exist in the catalog."
      />
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        <div className="relative w-full h-96 bg-w-200 rounded-lg overflow-hidden">
          <Image src={book.coverImage} alt={book.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 280px" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold">
              {languageBadgeLabels[book.language]}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-lato font-semibold ${
              book.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {book.available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {book.available ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <h1 className="font-cinzel text-2xl font-semibold text-w-950 mb-2">{book.title}</h1>
          <p className="font-lato text-sm text-w-700 mb-4">
            by <Link href={`/library?contributor=${encodeURIComponent(book.contributor)}`} className="text-w-600 hover:text-w-950 underline">{book.contributor}</Link>
          </p>

          {book.description && (
            <p className="font-lato text-sm text-w-700 leading-relaxed mb-6">{book.description}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <ElegantButton
              variant="primary"
              disabled={!book.available}
              onClick={() => setAction('borrow')}
              className="flex-1 sm:flex-none"
            >
              Borrow
            </ElegantButton>
            <ElegantButton
              variant="outline"
              onClick={() => setAction('reserve')}
              className="flex-1 sm:flex-none"
            >
              Reserve
            </ElegantButton>
          </div>
        </div>
      </div>

      <PublicationActionModal action={action} bookTitle={book.title} onClose={() => setAction(null)} />
    </div>
  )
}
