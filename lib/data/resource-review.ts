import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { broadcastToSubscribers } from '@/lib/newsletter-broadcast'
import { assignKlpCodes } from '@/lib/data/klp-register'

/**
 * DRAFT → published approval for library resources. Every new resource is
 * saved as a DRAFT that readers can't see; an Admin, or a role with the
 * "library:approve" permission, publishes it here. Publishing is also the
 * moment the KLP Code / Kingdom Library ID are assigned and subscribers are
 * told about the new title — never for a draft.
 */

export const APPROVE_PERMISSION = 'library:approve'

/** Role names roleNameToUserRole treats as admin (it lower-cases; Prisma 'in' is exact). */
const ADMIN_ROLE_NAMES = ['Admin', 'admin', 'Administrator', 'administrator', 'ADMIN']

/** Everyone who can approve: Admin-role users plus users whose role has library:approve. */
async function approverIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { OR: [{ role: { name: { in: ADMIN_ROLE_NAMES } } }, { role: { permissions: { has: APPROVE_PERMISSION } } }] },
    select: { id: true },
  }).catch(() => [])
  return users.map((u) => u.id)
}

/** Tells every approver a new draft is waiting (the creator is skipped — they already know). */
export async function notifyDraftAwaitingApproval(resource: { id: string; title: string }, createdById: string, creatorName: string) {
  const ids = (await approverIds()).filter((id) => id !== createdById)
  await Promise.all(ids.map((userId) => notifyUser({
    userId,
    type: 'SYSTEM',
    category: 'library-resource-review',
    title: 'New resource awaiting approval',
    message: `${creatorName || 'A staff member'} added "${resource.title}". It stays hidden from readers until it is approved.`,
    href: `/dashboard/library/${resource.id}`,
  }))).catch(() => {})
}

export class ReviewError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

/**
 * Publishes a draft: status → AVAILABLE (OUT_OF_STOCK when no copies),
 * approval trail, KLP codes, newsletter. Optional collection lets the
 * approver file it in a KLP collection at the same time.
 */
export async function approveResource(id: string, approverId: string, opts: { collection?: string } = {}) {
  const r = await prisma.resource.findUnique({ where: { id }, select: { id: true, title: true, author: true, status: true, availableQty: true, createdById: true, klpCollection: true } })
  if (!r) throw new ReviewError('Resource not found', 404)
  if (r.status !== 'DRAFT') throw new ReviewError('This resource is already published', 409)
  const collection = opts.collection || r.klpCollection
  if (!collection) throw new ReviewError('Choose the KLP collection before approving, so the resource can get its publication code.')

  // Conditional on still being a DRAFT, so two approvers clicking at once publish (and notify) once.
  const { count } = await prisma.resource.updateMany({
    where: { id, status: 'DRAFT' },
    data: { status: r.availableQty > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK', approvedById: approverId, approvedAt: new Date(), reviewNote: null, klpCollection: collection },
  })
  if (!count) throw new ReviewError('This resource is already published', 409)

  const codes = await assignKlpCodes(id)

  if (r.createdById && r.createdById !== approverId) {
    await notifyUser({
      userId: r.createdById,
      type: 'SYSTEM',
      category: 'library-resource-decision',
      title: 'Resource approved',
      message: `"${r.title}" is now published${codes ? ` as ${codes.klpCode}` : ''} and visible to readers.`,
      href: `/dashboard/library/${id}`,
    }).catch(() => {})
  }
  broadcastToSubscribers({ type: 'new_resource', title: r.title, author: r.author, id }).catch(() => {})
  return codes
}

/** Sends a draft back with a reason; it stays hidden and the creator is told what to fix. */
export async function rejectResource(id: string, reviewerId: string, note: string) {
  const r = await prisma.resource.findUnique({ where: { id }, select: { id: true, title: true, status: true, createdById: true } })
  if (!r) throw new ReviewError('Resource not found', 404)
  if (r.status !== 'DRAFT') throw new ReviewError('Only a draft can be sent back', 409)
  await prisma.resource.update({ where: { id }, data: { reviewNote: note } })
  if (r.createdById && r.createdById !== reviewerId) {
    await notifyUser({
      userId: r.createdById,
      type: 'SYSTEM',
      category: 'library-resource-decision',
      title: 'Resource needs changes',
      message: `"${r.title}" was not approved yet: ${note}`,
      href: `/dashboard/library/${id}`,
    }).catch(() => {})
  }
}
