import { PageTransition } from '@/components/ui/page-transition'
import { SessionRoomView } from '@/components/session-room/session-room-view'

interface MemberSessionRoomPageProps {
  params: Promise<{ id: string }>
}

export default async function MemberSessionRoomPage({ params }: MemberSessionRoomPageProps) {
  const { id } = await params
  return (
    <PageTransition>
      <SessionRoomView sessionId={id} viewer="learner" />
    </PageTransition>
  )
}
