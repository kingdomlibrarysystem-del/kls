'use client'

import { PageTransition } from '@/components/ui/page-transition'
import { useAuth } from '@/contexts/auth-context'
import { MessagesView } from '@/lib/messaging/messages-view'

/**
 * Admin-side messaging inbox — reuses the exact same MessagesView the
 * member portal uses (real Channel/Message API, DM channels keyed by
 * real participantIds work for any real user, admin included). Course
 * channels will simply show empty for an admin with no enrolled
 * courses, handled gracefully by ChannelListPanel already; DMs with any
 * real member/lecturer/contributor work today.
 */
export default function AdminMessagesPage() {
  const { user, isLoading } = useAuth()

  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          Messages
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Direct messages with members and lecturers
        </div>
      </div>
      {!isLoading && user && <MessagesView userId={user.id} />}
    </PageTransition>
  )
}
