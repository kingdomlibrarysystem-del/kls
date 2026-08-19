'use client'

import { PageTransition } from '@/components/ui/page-transition'
import { useAuth } from '@/contexts/auth-context'
import { MessagesView } from '@/lib/messaging/messages-view'

export default function MemberMessagesPage() {
  const { user, isLoading } = useAuth()

  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          Messages
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Course channels with your lecturers and direct messages
        </div>
      </div>
      {!isLoading && user && <MessagesView userId={user.id} />}
    </PageTransition>
  )
}
