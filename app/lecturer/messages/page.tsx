import { PageTransition } from '@/components/ui/page-transition'
import { MessagesView } from '@/lib/messaging/messages-view'
import { LECTURER_NAME } from '@/lib/identity/lecturer-identity'

export default function LecturerMessagesPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          Messages
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Course channels with your learners and direct messages
        </div>
      </div>
      <MessagesView personName={LECTURER_NAME} personRole="lecturer" />
    </PageTransition>
  )
}
