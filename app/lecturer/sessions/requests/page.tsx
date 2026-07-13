import { PageTransition } from '@/components/ui/page-transition'
import { SessionRequestsView } from './_components/session-requests-view'

export default function SessionRequestsPage() {
  return (
    <PageTransition>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Cinzel',serif" }}>
          Session Requests
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Approve or reject live-session requests from learners who completed your courses
        </div>
      </div>
      <SessionRequestsView />
    </PageTransition>
  )
}
