import { PageTransition } from '@/components/ui/page-transition'
import { MySessionsView } from './_components/my-sessions-view'
import { StartInstantSessionButton } from './_components/start-instant-session-button'

export default function MemberSessionsPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
            My Sessions
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Live sessions you've requested with your course lecturers
          </div>
        </div>
        <StartInstantSessionButton />
      </div>
      <MySessionsView />
    </PageTransition>
  )
}
