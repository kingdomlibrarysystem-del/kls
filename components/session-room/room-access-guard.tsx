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
  if (!loading && !request) return <EmptyState icon={CalendarClock} title="Class not found" description="This open class does not exist." style={{ color: 'var(--text-secondary)' }} />
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
      title={joinWindow.reason === 'too-early' ? 'The class room is not open yet' : 'This open class has ended'}
      description={joinWindow.reason === 'too-early' ? `The class room opens at ${joinWindow.opensAt.toLocaleString()}.` : 'You can no longer join this class. Ask for a new open class if you still need one.'}
      style={{ color: 'var(--text-secondary)' }}
    />
  }

  if (waitingForHost) {
    return <EmptyState icon={CalendarClock} title="Waiting for the teacher" description="The class starts when your teacher joins. You will be connected automatically." style={{ color: 'var(--text-secondary)' }} />
  }

  return null
}
