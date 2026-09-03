import { CalendarClock } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { getJoinWindowState } from '@/lib/sessions/join-window'
import type { SessionRequest } from '@/lib/sessions/use-session-requests'

interface RoomAccessGuardProps {
  loading: boolean
  request: SessionRequest | undefined
  waitingForHost: boolean
}

/**
 * The three real reasons a room isn't renderable yet — not found, outside
 * its scheduled join window, or (a real, server-enforced gate) the host
 * hasn't joined yet for a SCHEDULED session — split out of
 * session-room-view.tsx to keep that file under the 200-line cap. Returns
 * null once none of these block access, so the caller renders the actual
 * room.
 */
export function RoomAccessGuard({ loading, request, waitingForHost }: RoomAccessGuardProps) {
  if (!loading && !request) return <EmptyState icon={CalendarClock} title="Session not found" description="This session request doesn't exist." style={{ color: 'var(--text-secondary)' }} />
  if (!request) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton style={{ height: 180, width: '100%', borderRadius: 10 }} />
        <Skeleton style={{ height: 16, width: '40%', borderRadius: 6 }} />
      </div>
    )
  }

  const joinWindow = getJoinWindowState(request)
  if (!joinWindow.canJoin) {
    return <EmptyState
      icon={CalendarClock}
      title={joinWindow.reason === 'too-early' ? 'This session hasn\'t opened yet' : 'This session\'s window has passed'}
      description={joinWindow.reason === 'too-early' ? `The room opens at ${joinWindow.opensAt.toLocaleString()}.` : 'This scheduled session is no longer joinable — ask to reschedule if you still need it.'}
      style={{ color: 'var(--text-secondary)' }}
    />
  }

  if (waitingForHost) {
    return <EmptyState icon={CalendarClock} title="Waiting for the host to join" description="This room opens once the lecturer or an admin joins — it'll connect automatically the moment they arrive." style={{ color: 'var(--text-secondary)' }} />
  }

  return null
}
