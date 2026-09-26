'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookX, CheckCircle2, XCircle, LogIn, BookMarked, Film, Package, BookOpenCheck, AlertTriangle, ShoppingCart, Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAuth } from '@/contexts/auth-context'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { bindingTypeLabels, mediaTypeLabels } from '@/app/dashboard/library/_components/resources-data'
import { languageBadgeLabels } from '@/app/dashboard/publishing/catalog/_components/catalog-data'
import { usePublicPublication } from '@/app/dashboard/publishing/_shared/use-publications'
import { usePublicResource } from '@/app/dashboard/library/_components/use-resources'
import { useReadableContent } from '@/app/member/_shared/use-readable-content'
import { useCart, addToCart, isInCart, type CartItemType } from '@/app/member/_shared/use-cart'

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
  const [addingType, setAddingType] = useState<CartItemType | null>(null)
  const [cartError, setCartError] = useState('')
  const { user, isAuthenticated } = useAuth()
  const { data: resources, loading: resourcesLoading, error: resourcesError } = useResources()
  const { data: singleResource, loading: singleLoading, error: singleError } = usePublicResource(id)
  const { data: publication, loading: publicationsLoading, error: publicationsError } = usePublicPublication(id)
  const readableContent = useReadableContent()
  useCart(user?.id)

  const loading = resourcesLoading || singleLoading || publicationsLoading

  // Prefer the shared cache hit; fall back to the direct fetch for IDs
  // that resolve as a Resource but aren't in the cache yet.
  const resource = resources.find((r) => r.id === id) ?? singleResource ?? undefined

  // If the resource resolved, a 404 from publications is expected (Resource ID, not Publication ID)
  const error = (resourcesError ?? singleError) || (!resource && !publication ? publicationsError : null)
  const catalogBook = publication
    ? {
        title: publication.title,
        contributor: publication.contributor,
        coverImages: publication.coverImage ? [publication.coverImage] : [],
        description: publication.description,
        bindingType: publication.bindingType ?? 'SOFT',
        mediaType: publication.mediaType ?? 'TEXT',
        price: publication.price ?? 0,
        borrowPrice: 0,
        borrowDurationDays: 14,
        quantity: publication.quantity ?? 0,
        available: (publication.quantity ?? 0) > 0,
        language: publication.language,
      }
    : undefined
  const isReadable = !!readableContent[id]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-12" aria-label="Loading publication">
        <Skeleton className="h-[34rem] w-full rounded-lg" />
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
  const coverImage = resource?.coverImages?.[0] ?? catalogBook?.coverImages?.[0] ?? ''
  const description = resource?.description ?? catalogBook?.description
  const bindingType = resource?.bindingType ?? catalogBook!.bindingType
  const mediaType = resource?.mediaType ?? catalogBook!.mediaType
  const price = resource?.price ?? catalogBook!.price
  const borrowPrice = resource?.borrowPrice ?? catalogBook!.borrowPrice
  const borrowDurationDays = resource?.borrowDurationDays ?? catalogBook!.borrowDurationDays
  const quantity = resource ? resource.availableQty : catalogBook!.quantity
  const available = resource ? resource.availableQty > 0 && resource.status !== 'archived' : !!catalogBook?.available
  const language = catalogBook ? languageBadgeLabels[catalogBook.language] : resource!.language
  const inCartRental = resource ? isInCart(resource.id, 'RENTAL') : false
  const inCartSale = resource ? isInCart(resource.id, 'SALE') : false

  const handleAddToCart = async (type: CartItemType) => {
    if (!user || !resource) return
    setAddingType(type)
    setCartError('')
    try {
      await addToCart(user.id, resource.id, type)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Could not add to cart')
    } finally {
      setAddingType(null)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">

        {/* Cover */}
        <div className="w-full md:w-[320px] lg:w-[380px] shrink-0 bg-w-200 rounded-lg pt-8 pb-6 px-6 sm:px-10">
          <div
            className="relative w-full h-72 sm:h-96 md:h-[30rem] lg:h-[34rem] rounded-[2px] overflow-hidden"
            style={{ boxShadow: '0 1px 0 1px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.18), 0 16px 32px -8px rgba(0,0,0,0.3), inset -4px 0 8px rgba(0,0,0,0.14)' }}
          >
            {coverImage ? (
              <Image src={coverImage} alt={title} fill className="object-cover" sizes="(max-width: 640px) 90vw, (max-width: 1024px) 320px, 380px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-w-100">
                <div className="text-center px-4">
                  <Package size={32} className="mx-auto text-w-400 mb-2" />
                  <span className="font-cinzel text-sm font-semibold text-w-600 tracking-wide uppercase">Kingdom Library</span>
                </div>
              </div>
            )}
            <div className="absolute top-0 right-0 h-full w-2" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(255,255,255,0.35) 40%, rgba(0,0,0,0.1))' }} />
            <div className="absolute top-0 left-0 h-full w-4" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)' }} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold">{language}</span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-lato font-semibold ${available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {available ? 'Available' : 'Unavailable'}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold"><BookMarked size={12} /> {bindingTypeLabels[bindingType]}</span>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-w-100 text-w-950 rounded text-xs font-lato font-semibold"><Film size={12} /> {mediaTypeLabels[mediaType]}</span>
          </div>

          <h1 className="font-cinzel text-xl sm:text-2xl font-semibold text-w-950 mb-2 leading-snug">{title}</h1>
          <p className="font-lato text-sm text-w-700 mb-3">
            by <Link href={`/library?contributor=${encodeURIComponent(author)}`} className="text-w-600 hover:text-w-950 underline">{author}</Link>
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="font-cinzel text-lg font-bold text-w-600">
              {price > 0 ? `${price.toLocaleString()} RWF` : 'Free'}
              <span className="text-xs font-lato font-semibold text-w-500 ml-1">to reserve</span>
            </span>
            <span className={`flex items-center gap-1 text-sm font-lato ${quantity === 0 ? 'text-red-700 font-semibold' : 'text-w-700'}`}>
              <Package size={13} /> {quantity} available
            </span>
          </div>
          <p className="font-lato text-sm text-w-600 mb-5">
            {borrowPrice > 0 ? `${borrowPrice.toLocaleString()} RWF` : 'Free'} to borrow · {borrowDurationDays} days
          </p>

          {description && (
            <p className="font-lato text-sm text-w-700 leading-relaxed mb-6">{description}</p>
          )}

          <div className="flex flex-col gap-3">
            {isReadable && (
              <UniversalButton
                href={isAuthenticated ? `/member/library/read/${id}` : `/auth/login?redirect=${encodeURIComponent(`/member/library/read/${id}`)}`}
                variant="primary"
                fullWidth
                icon={<BookOpenCheck size={15} />}
              >
                {price > 0 ? (isAuthenticated ? 'Preview' : 'Sign In to Preview') : (isAuthenticated ? 'Read Online' : 'Sign In to Read')}
              </UniversalButton>
            )}

            {isAuthenticated && resource ? (
              <>
                {(inCartRental || inCartSale) && (
                  <div className="flex items-center gap-1.5 bg-w-100 text-w-700 text-xs font-lato font-semibold px-2 py-1 rounded w-fit">
                    <Check size={12} />
                    {inCartRental && inCartSale ? 'Borrow & Reserve in cart' : inCartRental ? 'Borrow in cart' : 'Reserve in cart'}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <UniversalButton
                    variant={isReadable ? 'outline' : 'primary'}
                    disabled={!available || inCartRental}
                    loading={addingType === 'RENTAL'}
                    icon={<ShoppingCart size={15} />}
                    onClick={() => handleAddToCart('RENTAL')}
                  >
                    Borrow — {borrowPrice > 0 ? `${borrowPrice.toLocaleString()} RWF` : 'Free'}
                  </UniversalButton>
                  <UniversalButton
                    variant="outline"
                    disabled={inCartSale}
                    loading={addingType === 'SALE'}
                    icon={<ShoppingCart size={15} />}
                    onClick={() => handleAddToCart('SALE')}
                  >
                    Reserve — {price > 0 ? `${price.toLocaleString()} RWF` : 'Free'}
                  </UniversalButton>
                </div>
                {cartError && <p className="font-lato text-xs text-red-700">{cartError}</p>}
              </>
            ) : !isAuthenticated ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <UniversalButton
                    href={`/auth/login?redirect=${encodeURIComponent(`/library/${id}`)}`}
                    variant={isReadable ? 'outline' : 'primary'}
                    icon={<LogIn size={15} />}
                  >
                    Sign In to Borrow
                  </UniversalButton>
                  <UniversalButton
                    href={`/auth/login?redirect=${encodeURIComponent(`/library/${id}`)}`}
                    variant="outline"
                    icon={<LogIn size={15} />}
                  >
                    Sign In to Reserve
                  </UniversalButton>
                </div>
               
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
