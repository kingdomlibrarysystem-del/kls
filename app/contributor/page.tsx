import { PageTransition } from '@/components/ui/page-transition'
import { DashboardView } from './_components/dashboard-view'
import { DashboardCharts } from './_components/dashboard-charts'

export default function ContributorDashboardPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        Contributor Dashboard
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Your submissions, courses, research, and earnings at a glance
      </p>
      <DashboardView />
      <div style={{ marginTop: 16 }}>
        <DashboardCharts />
      </div>
    </PageTransition>
  )
}
