import { PageTransition } from '@/components/ui/page-transition'
import { MessagesView } from '@/lib/messaging/messages-view'

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const CURRENT_MEMBER_NAME = 'John Doe'

export default function MemberMessagesPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          Messages
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Course channels with your lecturers and direct messages
        </div>
      </div>
      <MessagesView personName={CURRENT_MEMBER_NAME} personRole="member" />
    </PageTransition>
  )
}
