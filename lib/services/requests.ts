import prisma from '@/prisma/client'
import { ApiError } from '@/lib/api-error-handler'
import { notifyUser } from '@/lib/notify'
import { isObjectId } from '@/lib/server/object-id'
import type { ServiceRequest } from '@prisma/client'
import type { ServiceChannelCode, ServiceRequestItem } from './shared'

/**
 * Service requests: a member asks for one or more sub-services of a programme
 * and says how they want help — a phone call, messages, or an online meeting.
 * Staff with "services:requests" (Admin always) schedule, complete or cancel
 * it; each step notifies the other side.
 */
export const REQUESTS_PERMISSION = 'services:requests'

export const CHANNEL_LABEL: Record<ServiceChannelCode, string> = { CALL: 'Phone call', MESSAGE: 'Messages', MEETING: 'Online meeting' }

/** Role names roleNameToUserRole treats as admin (Prisma 'in' is exact). */
const ADMIN_ROLE_NAMES = ['Admin', 'admin', 'Administrator', 'administrator', 'ADMIN']

function newNumber(): string {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `SRV-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

type Row = ServiceRequest
type UserInfo = { name: string | null; email: string }

export function serializeRequest(r: Row, programSlug: string | null = null, user: UserInfo | null = null): ServiceRequestItem {
  return {
    id: r.id, number: r.number, userId: r.userId, userName: user?.name ?? null, userEmail: user?.email ?? null,
    programId: r.programId, programName: r.programName, programSlug,
    offeringIds: r.offeringIds, offeringNames: r.offeringNames, channel: r.channel,
    preferredAt: r.preferredAt?.toISOString() ?? null, phone: r.phone, note: r.note, status: r.status,
    scheduledAt: r.scheduledAt?.toISOString() ?? null, meetingLink: r.meetingLink, staffNote: r.staffNote,
    cancelReason: r.cancelReason, handledById: r.handledById, createdAt: r.createdAt.toISOString(),
  }
}

/** Adds programme slugs and member names in two batched queries (no per-row lookups). */
async function withSlugs(rows: Row[]): Promise<ServiceRequestItem[]> {
  const programIds = [...new Set(rows.map((r) => r.programId))]
  const userIds = [...new Set(rows.map((r) => r.userId))]
  const [programs, users] = await Promise.all([
    programIds.length ? prisma.serviceProgram.findMany({ where: { id: { in: programIds } }, select: { id: true, slug: true } }) : [],
    userIds.length ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }) : [],
  ])
  const slug = new Map(programs.map((p) => [p.id, p.slug]))
  const user = new Map(users.map((u) => [u.id, u]))
  return rows.map((r) => serializeRequest(r, slug.get(r.programId) ?? null, user.get(r.userId) ?? null))
}

/** Users who handle requests: Admin-role users + roles with services:requests. */
async function handlerIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { OR: [{ role: { name: { in: ADMIN_ROLE_NAMES } } }, { role: { permissions: { has: REQUESTS_PERMISSION } } }] },
    select: { id: true },
  }).catch(() => [])
  return users.map((u) => u.id)
}

export interface CreateRequestInput {
  userId: string
  programId: string
  offeringIds: string[]
  channel: ServiceChannelCode
  preferredAt?: Date | null
  phone?: string | null
  note: string
}

export async function createServiceRequest(input: CreateRequestInput): Promise<ServiceRequestItem> {
  if (!isObjectId(input.programId)) throw new ApiError('Service not found', 404)
  const program = await prisma.serviceProgram.findFirst({ where: { id: input.programId, active: true }, select: { id: true, name: true, slug: true } })
  if (!program) throw new ApiError('Service not found', 404)

  const ids = [...new Set(input.offeringIds)].filter(isObjectId)
  if (ids.length === 0) throw new ApiError('Choose at least one sub-service', 400)
  const offerings = await prisma.serviceOffering.findMany({ where: { id: { in: ids }, programId: program.id, active: true }, orderBy: { sortOrder: 'asc' } })
  if (offerings.length !== ids.length) throw new ApiError('One of the chosen sub-services is no longer available — please choose again', 409)
  const unsupported = offerings.filter((o) => !o.channels.includes(input.channel))
  if (unsupported.length) throw new ApiError(`${CHANNEL_LABEL[input.channel]} is not offered for “${unsupported[0].name}”. Choose another way to talk.`, 400)
  if (input.channel === 'CALL' && !input.phone) throw new ApiError('Enter the phone number we should call', 400)
  if (input.preferredAt && input.preferredAt.getTime() < Date.now() - 5 * 60_000) throw new ApiError('Choose a time in the future (or leave it empty)', 400)

  const row = await prisma.serviceRequest.create({
    data: {
      number: newNumber(), userId: input.userId, programId: program.id, programName: program.name,
      offeringIds: offerings.map((o) => o.id), offeringNames: offerings.map((o) => o.name),
      channel: input.channel, preferredAt: input.preferredAt ?? null, phone: input.phone || null, note: input.note,
    },
  }).catch(async (e) => {
    // Very rare number clash — try once more with a new number.
    if ((e as { code?: string }).code !== 'P2002') throw e
    return prisma.serviceRequest.create({
      data: {
        number: newNumber(), userId: input.userId, programId: program.id, programName: program.name,
        offeringIds: offerings.map((o) => o.id), offeringNames: offerings.map((o) => o.name),
        channel: input.channel, preferredAt: input.preferredAt ?? null, phone: input.phone || null, note: input.note,
      },
    })
  })

  const who = (await prisma.user.findUnique({ where: { id: input.userId }, select: { name: true } }))?.name || 'A member'
  const handlers = (await handlerIds()).filter((id) => id !== input.userId)
  await Promise.all(handlers.map((userId) => notifyUser({
    userId, type: 'SYSTEM', category: 'service-request',
    title: `New ${program.name} request`,
    message: `${who} asked for ${row.offeringNames.join(', ')} — by ${CHANNEL_LABEL[row.channel].toLowerCase()}.`,
    href: `/dashboard/services/requests?open=${row.id}`,
  }))).catch(() => {})
  await notifyUser({
    userId: input.userId, type: 'SYSTEM', category: 'service-request',
    title: 'Request received',
    message: `We received your ${program.name} request (${row.number}). Our team will contact you to arrange it.`,
    href: '/member/services/requests',
  }).catch(() => {})

  return (await withSlugs([row]))[0]
}

export async function listMemberRequests(userId: string): Promise<ServiceRequestItem[]> {
  const rows = await prisma.serviceRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 200})
  return withSlugs(rows)
}

export async function listAllRequests(status?: string): Promise<ServiceRequestItem[]> {
  const valid = ['PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED']
  const rows = await prisma.serviceRequest.findMany({
    where: status && valid.includes(status) ? { status: status as ServiceRequest['status'] } : {},
    orderBy: { createdAt: 'desc' }, take: 500,
  })
  return withSlugs(rows)
}

export type RequestAction =
  | { action: 'schedule'; scheduledAt: Date; meetingLink?: string | null; staffNote?: string | null }
  | { action: 'complete'; staffNote?: string | null }
  | { action: 'cancel'; reason: string }

const fmt = (d: Date) => d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Kigali' })

/**
 * Staff actions, plus "cancel" by the member who made it. Each change is
 * conditional on the status it starts from, so two people acting at once
 * can't both win.
 */
export async function updateServiceRequest(id: string, by: { userId: string; isStaff: boolean }, input: RequestAction): Promise<ServiceRequestItem> {
  if (!isObjectId(id)) throw new ApiError('Request not found', 404)
  const r = await prisma.serviceRequest.findUnique({ where: { id } })
  if (!r) throw new ApiError('Request not found', 404)
  const isOwner = r.userId === by.userId
  if (!by.isStaff && !(isOwner && input.action === 'cancel')) throw new ApiError("You can't change this request", 403)

  let data: Parameters<typeof prisma.serviceRequest.update>[0]['data']
  let from: ServiceRequest['status'][]
  let notice: { title: string; message: string } | null = null

  if (input.action === 'schedule') {
    if (input.scheduledAt.getTime() < Date.now() - 5 * 60_000) throw new ApiError('Choose a time in the future', 400)
    if (r.channel === 'MEETING' && !input.meetingLink) throw new ApiError('Add the online meeting link', 400)
    from = ['PENDING', 'SCHEDULED']
    data = { status: 'SCHEDULED', scheduledAt: input.scheduledAt, meetingLink: input.meetingLink || null, staffNote: input.staffNote || null, handledById: by.userId }
    const how = r.channel === 'CALL' ? `We will call you on ${r.phone}` : r.channel === 'MEETING' ? `Join the online meeting: ${input.meetingLink}` : 'We will talk in Messages'
    notice = { title: `${r.programName}: scheduled`, message: `${how} on ${fmt(input.scheduledAt)}.${input.staffNote ? ` ${input.staffNote}` : ''}` }
  } else if (input.action === 'complete') {
    from = ['PENDING', 'SCHEDULED']
    data = { status: 'COMPLETED', staffNote: input.staffNote ?? r.staffNote, handledById: by.userId }
    notice = { title: `${r.programName}: completed`, message: input.staffNote || `Your request ${r.number} is completed. Thank you!` }
  } else {
    from = ['PENDING', 'SCHEDULED']
    data = { status: 'CANCELLED', cancelReason: input.reason, ...(by.isStaff && !isOwner && { handledById: by.userId }) }
    if (by.isStaff && !isOwner) notice = { title: `${r.programName}: cancelled`, message: `Request ${r.number} was cancelled: ${input.reason}` }
  }

  const { count } = await prisma.serviceRequest.updateMany({ where: { id, status: { in: from } }, data })
  if (!count) throw new ApiError(`This request is already ${r.status.toLowerCase()}`, 409)

  if (notice) {
    await notifyUser({ userId: r.userId, type: 'SYSTEM', category: 'service-request-update', title: notice.title, message: notice.message, href: '/member/services/requests' }).catch(() => {})
  }
  if (!by.isStaff && r.handledById) {
    await notifyUser({ userId: r.handledById, type: 'SYSTEM', category: 'service-request-update', title: 'Request cancelled by the member', message: `${r.number} (${r.programName}) was cancelled: ${(input as { reason: string }).reason}`, href: `/dashboard/services/requests?open=${r.id}` }).catch(() => {})
  }

  const fresh = await prisma.serviceRequest.findUniqueOrThrow({ where: { id }})
  return (await withSlugs([fresh]))[0]
}
