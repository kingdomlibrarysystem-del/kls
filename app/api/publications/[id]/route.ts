import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializePublication(p: {
  id: string
  title: string
  contributorId: string
  contributorName: string
  category: string
  language: string
  coverImage: string | null
  description: string
  status: string
  resourceId: string | null
  price: number | null
  quantity: number | null
  bindingType: string | null
  mediaType: string | null
  featured: boolean
  submittedAt: Date
  revenueShare?: { contributorShare: number; platformShare: number; totalRevenue: number } | null
}) {
  return {
    id: p.id,
    title: p.title,
    contributorId: p.contributorId,
    contributor: p.contributorName,
    category: p.category,
    language: p.language.toLowerCase(),
    coverImage: p.coverImage ?? '',
    description: p.description,
    status: p.status,
    resourceId: p.resourceId ?? undefined,
    price: p.price ?? undefined,
    quantity: p.quantity ?? undefined,
    bindingType: p.bindingType ?? undefined,
    mediaType: p.mediaType ?? undefined,
    featured: p.featured,
    submittedAt: p.submittedAt.toISOString().split('T')[0],
    revenueShare: p.revenueShare
      ? { contributorShare: p.revenueShare.contributorShare, platformShare: p.revenueShare.platformShare, totalRevenue: p.revenueShare.totalRevenue }
      : undefined,
  }
}

const REVENUE_INCLUDE = { revenueShare: { select: { contributorShare: true, platformShare: true, totalRevenue: true } } } as const
const DEFAULT_CONTRIBUTOR_SHARE = 70
const DEFAULT_PLATFORM_SHARE = 30

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const publication = await prisma.publication.findUnique({ where: { id }, include: REVENUE_INCLUDE })
  if (!publication) {
    return NextResponse.json({ data: null, message: 'Publication not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializePublication(publication), message: 'Publication fetched successfully', code: 'success', status: 200 })
}

/**
 * Status-transition guard, porting review-queue-view.tsx's Approve/Reject
 * handlers into the server. `approve` here does what the migration plan
 * flagged as entirely missing from the mock: creates a real matching
 * Resource row (the actual "approval creates a catalog book" relationship
 * Task 5.2 describes) plus a RevenueShare row at the default 70/30 split
 * (mirroring use-revenue.ts's addRevenueRowForApproval), inside one
 * transaction so a partial failure can't leave a Publication marked
 * APPROVED with no Resource/RevenueShare behind it.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.publication.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Publication not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.action === 'approve') {
      if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
        return NextResponse.json({ data: null, message: 'Only a submitted or under-review publication can be approved', code: 'error', status: 409 }, { status: 409 })
      }
      // Contributor/platform share comes from the caller (Revenue page's
      // "Default Revenue Share" config form — see revenue-config-form.tsx)
      // if provided, falling back to the 70/30 default. There is no
      // Settings collection in this app to persist that config
      // server-side (every other app-wide default, e.g.
      // defaultBorrowPeriodDays, is the same kind of client-held
      // constant), so the client passes its current value explicitly on
      // every approve call rather than the server silently ignoring it.
      const contributorShare = typeof body.contributorShare === 'number' ? body.contributorShare : DEFAULT_CONTRIBUTOR_SHARE
      const platformShare = typeof body.platformShare === 'number' ? body.platformShare : DEFAULT_PLATFORM_SHARE
      const updated = await prisma.$transaction(async (tx) => {
        const resource = await tx.resource.create({
          data: {
            title: existing.title,
            author: existing.contributorName,
            publisher: 'Kingdom Library System',
            categoryId: null,
            type: 'Book',
            format: 'Physical',
            language: existing.language,
            year: new Date().getFullYear(),
            pages: 0,
            isbn: '',
            price: existing.price ?? 0,
            totalQty: existing.quantity ?? 1,
            availableQty: existing.quantity ?? 1,
            status: 'AVAILABLE',
            coverImages: existing.coverImage ? [existing.coverImage] : [],
            bindingType: existing.bindingType ?? 'SOFT',
            mediaType: existing.mediaType ?? 'TEXT',
            description: existing.description,
            tags: [],
          },
        })
        await tx.revenueShare.create({
          data: {
            publicationId: id,
            contributorShare,
            platformShare,
            totalRevenue: 0,
          },
        })
        return tx.publication.update({
          where: { id },
          data: { status: 'PUBLISHED', resourceId: resource.id },
          include: REVENUE_INCLUDE,
        })
      })
      return NextResponse.json({ data: serializePublication(updated), message: 'Publication approved and published successfully', code: 'success', status: 200 })
    }

    if (body.action === 'reject') {
      if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
        return NextResponse.json({ data: null, message: 'Only a submitted or under-review publication can be rejected', code: 'error', status: 409 }, { status: 409 })
      }
      const updated = await prisma.publication.update({ where: { id }, data: { status: 'REJECTED' }, include: REVENUE_INCLUDE })
      return NextResponse.json({ data: serializePublication(updated), message: 'Publication rejected', code: 'success', status: 200 })
    }

    if (body.action === 'toggleFeatured') {
      const updated = await prisma.publication.update({ where: { id }, data: { featured: !existing.featured }, include: REVENUE_INCLUDE })
      return NextResponse.json({ data: serializePublication(updated), message: 'Publication updated successfully', code: 'success', status: 200 })
    }

    if (body.action === 'withdraw') {
      if (existing.status !== 'DRAFT' && existing.status !== 'SUBMITTED') {
        return NextResponse.json({ data: null, message: 'Only a draft or submitted publication can be withdrawn', code: 'error', status: 409 }, { status: 409 })
      }
      await prisma.publication.delete({ where: { id } })
      return NextResponse.json({ data: null, message: 'Publication withdrawn successfully', code: 'success', status: 200 })
    }

    const data: Record<string, unknown> = { ...body }
    delete data.action
    delete data.id
    delete data.contributorId
    const updated = await prisma.publication.update({ where: { id }, data, include: REVENUE_INCLUDE })
    return NextResponse.json({ data: serializePublication(updated), message: 'Publication updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update publication', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.publication.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Publication not found', code: 'error', status: 404 }, { status: 404 })
  }
  await prisma.publication.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Publication deleted successfully', code: 'success', status: 200 })
}
