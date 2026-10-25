import { requirePageAuth } from '@/lib/server/page-session'
import { getMemberRehab, type MemberRehab } from '@/lib/care/data'
import { toPlain } from '@/lib/server/to-plain'
import { RehabView } from './_components/rehab-view'

/** The member's recovery programme: intake, support groups, sessions and milestones (one parallel server load). */
export default async function MemberRehabPage() {
  const session = await requirePageAuth()
  const data = await getMemberRehab(session.userId)
  return <RehabView userId={session.userId} initial={toPlain<MemberRehab>(data)} />
}
