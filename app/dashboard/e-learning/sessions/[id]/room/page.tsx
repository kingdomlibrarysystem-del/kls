import { PageTransition } from '@/components/ui/page-transition'
import { SessionRoomView } from '@/components/session-room/session-room-view'

interface AdminSessionRoomPageProps {
  params: Promise<{ id: string }>
}

/**
 * Admin's real entry point into the session room — previously the only
 * two callers of SessionRoomView were the lecturer and member room
 * pages; there was no admin-side way to enter the actual real-media room
 * at all. Uses viewer="admin", a genuine third mode (see
 * SessionRoomView's `viewer` prop docstring), not a reuse of "lecturer".
 */
export default async function AdminSessionRoomPage({ params }: AdminSessionRoomPageProps) {
  const { id } = await params
  return (
    <PageTransition>
      <SessionRoomView sessionId={id} viewer="admin" />
    </PageTransition>
  )
}
