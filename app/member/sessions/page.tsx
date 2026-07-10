import { PageTransition } from '@/components/ui/page-transition'
import { MySessionsView } from './_components/my-sessions-view'

export default function MemberSessionsPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          My Sessions
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Live sessions you've requested with your course lecturers
        </div>
      </div>
      <MySessionsView />
    </PageTransition>
  )
}
