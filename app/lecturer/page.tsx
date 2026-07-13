import { PageTransition } from '@/components/ui/page-transition'
import { DashboardView } from './_components/dashboard-view'

export default function LecturerDashboardPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        Lecturer Dashboard
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Your courses, session requests, and upcoming sessions at a glance
      </p>
      <DashboardView />
    </PageTransition>
  )
}
