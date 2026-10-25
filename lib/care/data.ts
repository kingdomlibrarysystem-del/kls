import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'
import { serializeSession, DETAIL_INCLUDE } from '@/lib/data/counseling-sessions'

/** Counseling & Rehabilitation ("Care & Support") loaders shared by the API and the member/staff pages. */

export interface CounselorItem {
  id: string
  name: string
  specialty: string
  bio: string | null
  image: string
  userId: string | null
  languages: string[]
  availability: string | null
  active: boolean
}

type CounselorRow = { id: string; name: string; specialty: string; bio: string | null; image: string; userId: string | null; languages: string[]; availability: string | null; active: boolean }

export function serializeCounselor(c: CounselorRow): CounselorItem {
  return { id: c.id, name: c.name, specialty: c.specialty, bio: c.bio, image: c.image, userId: c.userId ?? null, languages: c.languages ?? [], availability: c.availability ?? null, active: c.active ?? true }
}

let counselorsBackfilled = false
/**
 * Counselors created before `active` existed have no such field; set it to
 * true once (raw MongoDB update — Prisma cannot match an unset required field).
 */
async function backfillCounselors() {
  if (counselorsBackfilled) return
  await prisma.$runCommandRaw({ update: 'Counselor', updates: [{ q: { active: { $exists: false } }, u: { $set: { active: true } }, multi: true }] }).catch(() => {})
  counselorsBackfilled = true
}

export async function listCounselors(activeOnly = true): Promise<CounselorItem[]> {
  await backfillCounselors()
  const rows = await prisma.counselor.findMany({ where: activeOnly ? { active: true } : undefined, orderBy: { name: 'asc' } })
  return rows.map(serializeCounselor)
}

export type CareSession = ReturnType<typeof serializeSession>

export async function listMemberSessions(userId: string): Promise<CareSession[]> {
  const rows = await prisma.counselingSession.findMany({ where: { userId }, include: DETAIL_INCLUDE, orderBy: { proposedTime: 'desc' } })
  return rows.map(serializeSession)
}

// ── Care resources ───────────────────────────────────────────────────────────

export type CareProgram = 'COUNSELING' | 'REHABILITATION' | 'GENERAL'
export type CareKind = 'ARTICLE' | 'AUDIO' | 'VIDEO'

export interface CareResourceItem {
  id: string
  program: CareProgram
  kind: CareKind
  title: string
  summary: string
  body: string | null
  mediaUrl: string | null
  coverImage: string | null
  topic: string
  durationMins: number | null
  published: boolean
  views: number
  inTrash: boolean
  createdByName: string
  createdAt: string
}

type ResourceRow = {
  id: string; program: string; kind: string; title: string; summary: string; body: string | null; mediaUrl: string | null; coverImage: string | null
  topic: string; durationMins: number | null; published: boolean; views: number; deletedAt: Date | null; createdByName: string; createdAt: Date
}

export function serializeResource(r: ResourceRow): CareResourceItem {
  return {
    id: r.id, program: r.program as CareProgram, kind: r.kind as CareKind, title: r.title, summary: r.summary, body: r.body, mediaUrl: r.mediaUrl,
    coverImage: r.coverImage, topic: r.topic, durationMins: r.durationMins, published: r.published, views: r.views, inTrash: !!r.deletedAt,
    createdByName: r.createdByName, createdAt: r.createdAt.toISOString(),
  }
}

const NOT_TRASHED = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] }

/** Published resources members can read/listen to; `program` narrows to a programme (GENERAL ones always included). */
export async function listPublishedResources(program?: Exclude<CareProgram, 'GENERAL'>): Promise<CareResourceItem[]> {
  const rows = await prisma.careResource.findMany({
    where: { published: true, ...NOT_TRASHED, ...(program && { program: { in: [program, 'GENERAL'] } }) },
    orderBy: { createdAt: 'desc' },
    take: 300,
  })
  // Members don't need the full article text in a list.
  return rows.map((r) => ({ ...serializeResource(r), body: null }))
}

export async function listAllResources(): Promise<CareResourceItem[]> {
  const rows = await prisma.careResource.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(serializeResource)
}

/** A resource a member may open (published, not in Trash). Counts the view. */
export async function openResource(id: string): Promise<CareResourceItem | null> {
  if (!isObjectId(id)) return null
  const row = await prisma.careResource.findUnique({ where: { id } })
  if (!row || !row.published || row.deletedAt) return null
  await prisma.careResource.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {})
  return serializeResource(row)
}

// ── Rehabilitation (member view) ─────────────────────────────────────────────

/** Everything the member's rehabilitation page shows, in one parallel batch. */
export async function getMemberRehab(userId: string) {
  const [intakes, groups, memberships, sessions, milestones] = await Promise.all([
    prisma.rehabIntake.findMany({ where: { userId }, orderBy: { submittedAt: 'desc' }, take: 5 }),
    prisma.supportGroup.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { members: true } } } }),
    prisma.rehabGroupMember.findMany({ where: { userId }, select: { groupId: true } }),
    prisma.rehabSession.findMany({ where: { userId }, orderBy: { dateTime: 'desc' }, take: 50, include: { group: { select: { name: true } }, facilitator: { select: { name: true, firstName: true, lastName: true } } } }),
    prisma.rehabMilestone.findMany({ where: { userId }, orderBy: { achievedAt: 'desc' }, take: 50 }),
  ])
  const joined = new Set(memberships.map((m) => m.groupId))
  const personName = (u: { name: string | null; firstName: string | null; lastName: string | null } | null) => (u ? u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : null)
  return {
    intakes: intakes.map((i) => ({ id: i.id, concernArea: i.concernArea, goals: i.goals, status: i.status, reviewNotes: i.reviewNotes, submittedAt: i.submittedAt.toISOString() })),
    groups: groups.map((g) => ({ id: g.id, name: g.name, focus: g.focus, description: g.description, meetingCadence: g.meetingCadence, image: g.image, memberCount: g._count.members, joined: joined.has(g.id) })),
    sessions: sessions.map((s) => ({ id: s.id, dateTime: s.dateTime.toISOString(), focus: s.focus, status: s.status, groupName: s.group?.name ?? null, facilitator: personName(s.facilitator) })),
    milestones: milestones.map((m) => ({ id: m.id, title: m.title, description: m.description, achievedAt: m.achievedAt.toISOString() })),
  }
}

export type MemberRehab = Awaited<ReturnType<typeof getMemberRehab>>
