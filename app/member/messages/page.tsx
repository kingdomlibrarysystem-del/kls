'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageTransition } from '@/components/ui/page-transition'
import { useAuth } from '@/contexts/auth-context'
import { MessagesView } from '@/lib/messaging/messages-view'

/** ?to=<userId> opens (or starts) the conversation with that person — used by "Message your counselor". */
function MessagesWithLink({ userId }: { userId: string }) {
  const to = useSearchParams().get('to')
  return <MessagesView userId={userId} initialDmUserId={to && /^[a-f0-9]{24}$/i.test(to) ? to : null} />
}

export default function MemberMessagesPage() {
  const { user, isLoading } = useAuth()

  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          Messages
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Course channels with your lecturers, and direct messages with staff and counselors
        </div>
      </div>
      {!isLoading && user && (
        <Suspense fallback={<MessagesView userId={user.id} />}>
          <MessagesWithLink userId={user.id} />
        </Suspense>
      )}
    </PageTransition>
  )
}
