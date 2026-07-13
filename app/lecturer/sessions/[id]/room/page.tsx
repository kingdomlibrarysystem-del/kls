import { PageTransition } from '@/components/ui/page-transition'
import { SessionRoomView } from '@/components/session-room/session-room-view'

interface LecturerSessionRoomPageProps {
  params: Promise<{ id: string }>
}

export default async function LecturerSessionRoomPage({ params }: LecturerSessionRoomPageProps) {
  const { id } = await params
  return (
    <PageTransition>
      <SessionRoomView sessionId={id} viewer="lecturer" />
    </PageTransition>
  )
}
