import { PageTransition } from '@/components/ui/page-transition'
import { LecturerSessionsView } from './_components/lecturer-sessions-view'
import { StartInstantSessionButton } from './_components/start-instant-session-button'

export default function MySessionsPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
            My Sessions
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Your approved, rejected, and completed live sessions
          </div>
        </div>
        <StartInstantSessionButton />
      </div>
      <LecturerSessionsView />
    </PageTransition>
  )
}
