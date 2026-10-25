import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAdmin, requireAuth, requireOwnerOrStaff } from '@/lib/auth/require-role'
import { requirePermission } from '@/lib/auth/permissions'
import { notifyUser } from '@/lib/notify'
import { publicationApprovedEmailHtml, publicationRejectedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'
import { DEFAULT_MEDIA_TYPE_CODE, getMediaCapabilities, isValidMediaTypeCode } from '@/lib/data/media-types'
import { getCommissionPercent } from '@/lib/data/publishing-revenue'
import { EDITABLE_STATUSES, REVENUE_INCLUDE, REVIEW_STATUSES, findKcsCategory, serializePublication } from '@/lib/data/publications'
import { notifySubmitted } from '@/lib/data/publication-notify'
import { assignKlpCodes, collectionForCategory } from '@/lib/data/klp-register'
import { newObjectId } from '@/lib/server/object-id'
import { isObjectId } from '@/lib/server/object-id'
import { bookFieldsSchema, cleanChapters, missingForSubmit } from '../schema'

type Ctx = { params: Promise<{ id: string }> }

const APPROVE_DENIED = 'Your role cannot approve or reject books. Ask an admin to grant "Approve Publications" in Roles & Permissions.'

async function findOr404(id: string) {
  if (!isObjectId(id)) throw new ApiError('Publication not found', 404)
  const existing = await prisma.publication.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Publication not found', 404)
  return existing
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params
  const publication = isObjectId(id) ? await prisma.publication.findUnique({ where: { id }, include: REVENUE_INCLUDE }) : null
  if (!publication) {
    return NextResponse.json({ data: null, message: 'Publication not found', code: 'error', status: 404 }, { status: 404 })
  }
  // PUBLISHED records are publicly visible (e.g. email links to /library/[id])
  if (publication.status !== 'PUBLISHED') {
    const auth = await requireOwnerOrStaff(publication.contributorId)
    if (auth.response) return auth.response
  }
  return NextResponse.json({ data: serializePublication(publication), message: 'Publication fetched successfully', code: 'success', status: 200 })
}

const patchSchema = z.discriminatedUnion('action', [
  /** Publisher edits their own DRAFT/REJECTED book. */
  z.object({ action: z.literal('update'), fields: bookFieldsSchema.partial() }),
  /** Publisher sends their DRAFT/REJECTED book for review. */
  z.object({ action: z.literal('submit') }),
  /** Reviewer ("publications:approve"): publish to the library. */
  /** The split comes from the admin's commission setting (Settings.publishingCommissionPercent). */
  z.object({ action: z.literal('approve'), notes: z.string().trim().max(2000).optional() }),
  /** Reviewer: send back with a reason the publisher sees. */
  z.object({ action: z.literal('reject'), notes: z.string().trim().min(5, 'Give the publisher a reason (at least 5 characters)').max(2000) }),
  /** Admin: show/hide in the catalog's featured row. */
  z.object({ action: z.literal('toggleFeatured') }),
  /** Publisher withdraws a book that is not yet reviewed. */
  z.object({ action: z.literal('withdraw') }),
])

/**
 * PATCH /api/publications/[id] { action, ... }. Who may do what:
 *  - update / submit / withdraw: the publisher who owns the book (Admin too);
 *  - approve / reject: role permission "publications:approve" (Admin always),
 *    and never on your own book unless you are Admin;
 *  - toggleFeatured: Admin.
 * Approve creates the real library Resource (KCS category, files, ISBN,
 * price) and a RevenueShare row in one transaction; only then is the book
 * visible to members.
 */
export const PATCH = withErrorHandling('/api/publications/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const { id } = await params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data
  const existing = await findOr404(id)

  if (body.action === 'update' || body.action === 'submit' || body.action === 'withdraw') {
    const auth = await requireAuth()
    if (auth.response) return auth.response
    if (existing.contributorId !== auth.session.userId && auth.session.role !== 'admin') throw new ApiError('You can only change your own books', 403)

    if (body.action === 'withdraw') {
      if (existing.status !== 'DRAFT' && existing.status !== 'SUBMITTED' && existing.status !== 'REJECTED') {
        throw new ApiError('Only a draft, submitted or rejected book can be withdrawn', 409)
      }
      await prisma.publication.delete({ where: { id } })
      return NextResponse.json({ data: null, message: 'Book withdrawn', code: 'success', status: 200 })
    }

    if (!(EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
      throw new ApiError('This book is already with the reviewers (or published) and can no longer be changed', 409)
    }

    if (body.action === 'update') {
      const f = body.fields
      const category = f.categoryId ? await findKcsCategory(f.categoryId) : null
      if (f.categoryId && !category) throw new ApiError('Choose a KCS category (a scroll under one of the pillars)', 400)
      if (f.mediaType && !(await isValidMediaTypeCode(f.mediaType))) throw new ApiError('The selected media type does not exist', 400)
      const updated = await prisma.publication.update({
        where: { id },
        data: {
          ...(f.title !== undefined && { title: f.title }),
          ...(f.author !== undefined && { author: f.author || existing.contributorName }),
          ...(f.description !== undefined && { description: f.description }),
          ...(category && { categoryId: category.id, category: category.name }),
          ...(f.language !== undefined && { language: f.language.toUpperCase() as 'EN' | 'FR' | 'RW' }),
          ...(f.mediaType !== undefined && { mediaType: f.mediaType || null }),
          ...(f.coverImage !== undefined && { coverImage: f.coverImage || null }),
          ...(f.documentUrl !== undefined && { documentUrl: f.documentUrl || null }),
          ...(f.audioUrl !== undefined && { audioUrl: f.audioUrl || null }),
          ...(f.videoUrl !== undefined && { videoUrl: f.videoUrl || null }),
          ...(f.chapters !== undefined && { chapters: cleanChapters(f.chapters) }),
          ...(f.pages !== undefined && { pages: f.pages }),
          ...(f.price !== undefined && { price: f.price }),
          ...(f.borrowPrice !== undefined && { borrowPrice: f.borrowPrice }),
          ...(f.quantity !== undefined && { quantity: f.quantity }),
        },
        include: REVENUE_INCLUDE,
      })
      return NextResponse.json({ data: serializePublication(updated), message: 'Book saved', code: 'success', status: 200 })
    }

    // submit
    const missing = missingForSubmit(existing, await getMediaCapabilities(existing.mediaType))
    if (missing) throw new ApiError(missing, 400)
    const updated = await prisma.publication.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), reviewNotes: null, reviewedAt: null },
      include: REVENUE_INCLUDE,
    })
    await notifySubmitted(updated.contributorId, updated.contributorName, updated.title)
    return NextResponse.json({ data: serializePublication(updated), message: 'Book submitted for review', code: 'success', status: 200 })
  }

  if (body.action === 'toggleFeatured') {
    const auth = await requireAdmin()
    if (auth.response) return auth.response
    const updated = await prisma.publication.update({ where: { id }, data: { featured: !existing.featured }, include: REVENUE_INCLUDE })
    return NextResponse.json({ data: serializePublication(updated), message: 'Publication updated successfully', code: 'success', status: 200 })
  }

  // approve / reject
  const auth = await requirePermission('publications:approve', APPROVE_DENIED)
  if (auth.response) return auth.response
  if (existing.contributorId === auth.session.userId && auth.session.role !== 'admin') {
    throw new ApiError('You cannot review your own book — another reviewer or an admin must do it', 403)
  }
  if (!(REVIEW_STATUSES as readonly string[]).includes(existing.status)) {
    throw new ApiError('Only a submitted book can be approved or rejected', 409)
  }

  if (body.action === 'reject') {
    const updated = await prisma.publication.update({
      where: { id },
      data: { status: 'REJECTED', reviewNotes: body.notes, reviewedAt: new Date() },
      include: REVENUE_INCLUDE,
    })
    const url = `${appBaseUrl()}/dashboard/publishing/my`
    await notifyUser({
      userId: updated.contributorId,
      type: 'PUBLICATION',
      category: 'publication-rejected',
      title: 'Book not approved yet',
      message: `"${updated.title}" was sent back: ${body.notes}`,
      href: '/dashboard/publishing/my',
      email: { subject: 'Update on your submission', html: publicationRejectedEmailHtml(updated.contributorName, updated.title, url) },
    })
    return NextResponse.json({ data: serializePublication(updated), message: 'Book sent back to the publisher', code: 'success', status: 200 })
  }

  // approve
  // The platform keeps the admin-set commission; the publisher earns the rest.
  const platformShare = await getCommissionPercent()
  const contributorShare = 100 - platformShare
  const caps = await getMediaCapabilities(existing.mediaType)
  const chapters = caps.allowsChapters ? existing.chapters.filter((c) => c.body.trim()) : []
  // The admin approving here is the library approval too, so the book is published straight away and gets its KLP codes
  // (collection matched from its KCS pillar; if none matches, staff pick one by editing the resource and the codes follow).
  const resourceId = newObjectId()
  const klpCollection = await collectionForCategory(existing.categoryId)
  const hasFile = !!(existing.documentUrl || existing.audioUrl || existing.videoUrl)

  const updated = await prisma.$transaction(async (tx) => {
    const resource = await tx.resource.create({
      data: {
        id: resourceId,
        title: existing.title,
        author: existing.author || existing.contributorName,
        publisher: 'Kingdom Library System',
        categoryId: existing.categoryId ?? null,
        type: 'Book',
        format: hasFile ? 'Digital' : 'Physical',
        language: existing.language,
        year: new Date().getFullYear(),
        pages: existing.pages ?? 0,
        isbn: `KL-${resourceId}`,
        klpCollection,
        klpEdition: 1,
        approvedById: auth.session.userId,
        approvedAt: new Date(),
        price: existing.price ?? 0,
        borrowPrice: existing.borrowPrice ?? 0,
        totalQty: existing.quantity ?? 1,
        availableQty: existing.quantity ?? 1,
        status: 'AVAILABLE',
        coverImages: existing.coverImage ? [existing.coverImage] : [],
        bindingType: existing.bindingType ?? 'SOFT',
        mediaType: existing.mediaType ?? DEFAULT_MEDIA_TYPE_CODE,
        description: existing.description,
        documentUrl: existing.documentUrl,
        audioUrl: existing.audioUrl,
        videoUrl: existing.videoUrl,
        tags: [],
      },
    })
    // Written chapters become the library book's real chapters, in order.
    if (chapters.length > 0) {
      await tx.chapter.createMany({ data: chapters.map((c, i) => ({ resourceId: resource.id, title: c.title, body: c.body, order: i + 1 })) })
    }
    await tx.revenueShare.upsert({
      where: { publicationId: id },
      create: { publicationId: id, contributorShare, platformShare, totalRevenue: 0 },
      update: { contributorShare, platformShare },
    })
    return tx.publication.update({
      where: { id },
      data: { status: 'PUBLISHED', resourceId: resource.id, reviewNotes: body.notes || null, reviewedAt: new Date() },
      include: REVENUE_INCLUDE,
    })
  })
  if (updated.resourceId) await assignKlpCodes(updated.resourceId).catch((e) => console.error('[publications] KLP code assignment failed', e))
  // The landing page lists the newest books; expire its cache.
  try { (await import('next/cache')).revalidateTag('home-page', { expire: 0 }) } catch { /* outside a Next request (tests) */ }

  const publicationUrl = `${appBaseUrl()}/library/${updated.resourceId}`
  await notifyUser({
    userId: updated.contributorId,
    type: 'PUBLICATION',
    category: 'publication-approved',
    title: 'Book approved and published',
    message: `"${updated.title}" is now in the Kingdom Library for members.`,
    href: `/library/${updated.resourceId}`,
    email: { subject: 'Your book has been published', html: publicationApprovedEmailHtml(updated.contributorName, updated.title, publicationUrl) },
  })
  return NextResponse.json({ data: serializePublication(updated), message: 'Book approved — it is now in the library', code: 'success', status: 200 })
})

/** DELETE /api/publications/[id] — admin only (removes the submission; an already-created library book stays). */
export const DELETE = withErrorHandling('/api/publications/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { id } = await params
  await findOr404(id)
  await prisma.revenueShare.deleteMany({ where: { publicationId: id } })
  await prisma.publication.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Publication deleted successfully', code: 'success', status: 200 })
})

