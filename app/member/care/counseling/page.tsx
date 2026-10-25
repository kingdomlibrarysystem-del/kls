import prisma from '@/prisma/client'
import { requirePageAuth } from '@/lib/server/page-session'
import { listCounselors, listMemberSessions, type CareSession, type CounselorItem } from '@/lib/care/data'
import { toPlain } from '@/lib/server/to-plain'
import { CounselingView } from './_components/counseling-view'

/** Book a counseling session (phone, video or in person), see your sessions, message your counselor. Server-loaded. */
export default async function MemberCounselingPage() {
  const session = await requirePageAuth()
  const [counselors, sessions, user] = await Promise.all([
    listCounselors(true),
    listMemberSessions(session.userId),
    prisma.user.findUnique({ where: { id: session.userId }, select: { phonenumber: true } }),
  ])
  return (
    <CounselingView
      userId={session.userId}
      counselors={toPlain<CounselorItem[]>(counselors)}
      initialSessions={toPlain<CareSession[]>(sessions)}
      defaultPhone={user?.phonenumber ?? ''}
    />
  )
}
