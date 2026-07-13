import { PageTransition } from '@/components/ui/page-transition'
import { LecturerSessionsView } from './_components/lecturer-sessions-view'

export default function MySessionsPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          My Sessions
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Your approved, rejected, and completed live sessions
        </div>
      </div>
      <LecturerSessionsView />
    </PageTransition>
  )
}
