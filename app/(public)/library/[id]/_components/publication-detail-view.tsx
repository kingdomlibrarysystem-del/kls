'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookX, CheckCircle2, XCircle, LogIn, BookMarked, Film, Package, BookOpenCheck, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAuth } from '@/contexts/auth-context'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { bindingTypeLabels, mediaTypeLabels } from '@/app/dashboard/library/_components/resources-data'
import { languageBadgeLabels } from '@/app/dashboard/publishing/catalog/_components/catalog-data'
import { usePublications } from '@/app/dashboard/publishing/_shared/use-publications'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { BorrowReserveConfirmModal, type BorrowReserveAction } from '@/app/(public)/library/_components/borrow-reserve-confirm-modal'

interface PublicationDetailViewProps {
  id: string
}

/**
 * Publication detail: looks up the book by ID against both the shared
 * resources store (browse-grid IDs, real Resource ObjectIds) and the
 * publishing catalog (admin-catalog IDs, e.g. 'cat-001') — the browse grid
 * and the admin Published Catalog page both link here, using their own ID
 * spaces, so both must resolve rather than picking one and breaking the
 * other.
 */
export function PublicationDetailView({ id }: PublicationDetailViewProps) {
  const [action, setAction] = useState<BorrowReserveAction>(null)
  const { isAuthenticated } = useAuth()
  const { data: resources, loading: resourcesLoading, error: resourcesError } = useResources()
  const { data: publications, loading: publicationsLoading, error: publicationsError } = usePublications()
  const readableContent = useReadableContent()

  const loading = resourcesLoading || publicationsLoading
  const error = resourcesError ?? publicationsError

  const resource = resources.find((r) => r.id === id)
  const publication = publications.find((p) => p.id === id && p.status === 'PUBLISHED')
  const catalogBook = publication
    ? {
        title: publication.title,
        contributor: publication.contributor,
        coverImages: publication.coverImage ? [publication.coverImage] : [],
        description: publication.description,
        bindingType: publication.bindingType ?? 'SOFT',
        mediaType: publication.mediaType ?? 'TEXT',
        price: publication.price ?? 0,
        quantity: publication.quantity ?? 0,
        available: (publication.quantity ?? 0) > 0,
        language: publication.language,
      }
    : undefined
  const isReadable = !!readableContent[id]

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

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this publication"
        description={error}
      />
    )
  }

  if (!resource && !catalogBook) {
    return (
      <EmptyState
        icon={BookX}
        title="Publication not found"
        description="This publication doesn't exist in the catalog."
      />
    )
  }

  const title = resource?.title ?? catalogBook!.title
  const author = resource?.author ?? catalogBook!.contributor
  const coverImage = resource?.coverImages[0] ?? catalogBook!.coverImages[0]
  const description = resource?.description ?? catalogBook?.description
  const bindingType = resource?.bindingType ?? catalogBook!.bindingType
  const mediaType = resource?.mediaType ?? catalogBook!.mediaType
  const price = resource?.price ?? catalogBook!.price
  const quantity = resource ? resource.availableQty : catalogBook!.quantity
  const available = resource ? resource.availableQty > 0 && resource.status !== 'archived' : !!catalogBook?.available
  const language = catalogBook ? languageBadgeLabels[catalogBook.language] : resource!.language

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        <div className="relative w-full h-96 bg-w-200 rounded-lg overflow-hidden">
          <Image src={coverImage} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 280px" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold">{language}</span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-lato font-semibold ${
              available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {available ? 'Available' : 'Unavailable'}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold"><BookMarked size={12} /> {bindingTypeLabels[bindingType]}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold"><Film size={12} /> {mediaTypeLabels[mediaType]}</span>
          </div>

          <h1 className="font-cinzel text-2xl font-semibold text-w-950 mb-2">{title}</h1>
          <p className="font-lato text-sm text-w-700 mb-2">
            by <Link href={`/library?contributor=${encodeURIComponent(author)}`} className="text-w-600 hover:text-w-950 underline">{author}</Link>
          </p>

          <div className="flex items-center gap-4 mb-4">
            <span className="font-cinzel text-lg font-bold text-w-600">{price.toLocaleString()} RWF</span>
            <span className={`flex items-center gap-1 text-sm font-lato ${quantity === 0 ? 'text-red-700 font-semibold' : 'text-w-700'}`}>
              <Package size={13} /> {quantity} available
            </span>
          </div>

          {description && (
            <p className="font-lato text-sm text-w-700 leading-relaxed mb-6">{description}</p>
          )}

          {isReadable && (
            <Link href={isAuthenticated ? `/member/library/read/${id}` : `/auth/login?redirect=${encodeURIComponent(`/member/library/read/${id}`)}`} className="block mb-3">
              <ElegantButton variant="primary" className="w-full flex items-center justify-center gap-2">
                <BookOpenCheck size={15} /> {isAuthenticated ? 'Read Online' : 'Sign In to Read'}
              </ElegantButton>
            </Link>
          )}

          {isAuthenticated && resource ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <ElegantButton
                variant={isReadable ? 'outline' : 'primary'}
                disabled={!available}
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
          ) : isAuthenticated ? null : (
            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/auth/login?redirect=${encodeURIComponent(`/library/${id}`)}`} className="flex-1 sm:flex-none">
                  <ElegantButton variant={isReadable ? 'outline' : 'primary'} className="w-full flex items-center justify-center gap-2">
                    <LogIn size={15} /> Sign In to Borrow
                  </ElegantButton>
                </Link>
                <Link href={`/auth/login?redirect=${encodeURIComponent(`/library/${id}`)}`} className="flex-1 sm:flex-none">
                  <ElegantButton variant="outline" className="w-full flex items-center justify-center gap-2">
                    <LogIn size={15} /> Sign In to Reserve
                  </ElegantButton>
                </Link>
              </div>
              <p className="font-lato text-xs text-w-600 mt-2">
                Sign in to borrow or reserve this book — you&apos;ll land back here once you&apos;re signed in.
              </p>
            </div>
          )}
        </div>
      </div>

      <BorrowReserveConfirmModal action={action} resourceId={resource?.id ?? ''} bookTitle={title} bookAuthor={author} availableQty={quantity} onClose={() => setAction(null)} />
    </div>
  )
}
