import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyUser } from '@/lib/notify'
import { publicationApprovedEmailHtml, publicationRejectedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

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
  const auth = await requireOwnerOrStaff(publication.contributorId)
  if (auth.response) return auth.response
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
const patchPublicationSchema = z.union([
  z.object({ action: z.literal('approve'), contributorShare: z.number().optional(), platformShare: z.number().optional() }),
  z.object({ action: z.literal('reject') }),
  z.object({ action: z.literal('toggleFeatured') }),
  z.object({ action: z.literal('withdraw') }),
  z.object({ action: z.undefined() }).passthrough(),
])

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
export const PATCH = withErrorHandling('/api/publications/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = patchPublicationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.publication.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Publication not found', 404)

  // withdraw is the contributor pulling back their own draft/submitted
  // work; approve/reject/toggleFeatured/raw field edits are all staff review actions.
  const auth = await (body.action === 'withdraw' ? requireOwnerOrStaff(existing.contributorId) : requireStaff())
  if (auth.response) return auth.response

  if (body.action === 'approve') {
    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
      throw new ApiError('Only a submitted or under-review publication can be approved', 409)
    }
    // Contributor/platform share comes from the caller (Revenue page's
    // "Default Revenue Share" config form — see revenue-config-form.tsx)
    // if provided, falling back to the 70/30 default. There is no
    // Settings collection in this app to persist that config
    // server-side (every other app-wide default, e.g.
    // defaultBorrowPeriodDays, is the same kind of client-held
    // constant), so the client passes its current value explicitly on
    // every approve call rather than the server silently ignoring it.
    const contributorShare = body.contributorShare ?? DEFAULT_CONTRIBUTOR_SHARE
    const platformShare = body.platformShare ?? DEFAULT_PLATFORM_SHARE
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

    const publicationUrl = `${appBaseUrl()}/library/${updated.resourceId}`
    await notifyUser({
      userId: updated.contributorId,
      type: 'PUBLICATION',
      category: 'publication-approved',
      title: 'Publication approved',
      message: `"${updated.title}" has been approved and published.`,
      href: `/library/${updated.resourceId}`,
      email: { subject: 'Your submission has been published', html: publicationApprovedEmailHtml(updated.contributorName, updated.title, publicationUrl) },
    })

    return NextResponse.json({ data: serializePublication(updated), message: 'Publication approved and published successfully', code: 'success', status: 200 })
  }

  if (body.action === 'reject') {
    if (existing.status !== 'SUBMITTED' && existing.status !== 'UNDER_REVIEW') {
      throw new ApiError('Only a submitted or under-review publication can be rejected', 409)
    }
    const updated = await prisma.publication.update({ where: { id }, data: { status: 'REJECTED' }, include: REVENUE_INCLUDE })

    const publicationUrl = `${appBaseUrl()}/dashboard/publishing`
    await notifyUser({
      userId: updated.contributorId,
      type: 'PUBLICATION',
      category: 'publication-rejected',
      title: 'Publication not approved',
      message: `"${updated.title}" was not approved for publishing.`,
      href: `/dashboard/publishing`,
      email: { subject: 'Update on your submission', html: publicationRejectedEmailHtml(updated.contributorName, updated.title, publicationUrl) },
    })

    return NextResponse.json({ data: serializePublication(updated), message: 'Publication rejected', code: 'success', status: 200 })
  }

  if (body.action === 'toggleFeatured') {
    const updated = await prisma.publication.update({ where: { id }, data: { featured: !existing.featured }, include: REVENUE_INCLUDE })
    return NextResponse.json({ data: serializePublication(updated), message: 'Publication updated successfully', code: 'success', status: 200 })
  }

  if (body.action === 'withdraw') {
    if (existing.status !== 'DRAFT' && existing.status !== 'SUBMITTED') {
      throw new ApiError('Only a draft or submitted publication can be withdrawn', 409)
    }
    await prisma.publication.delete({ where: { id } })
    return NextResponse.json({ data: null, message: 'Publication withdrawn successfully', code: 'success', status: 200 })
  }

  const data: Record<string, unknown> = { ...body }
  delete data.action
  const updated = await prisma.publication.update({ where: { id }, data, include: REVENUE_INCLUDE })
  return NextResponse.json({ data: serializePublication(updated), message: 'Publication updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/publications/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.publication.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Publication not found', 404)

  await prisma.publication.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Publication deleted successfully', code: 'success', status: 200 })
})
