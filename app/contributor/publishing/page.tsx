import { PageTransition } from '@/components/ui/page-transition'
import { MySubmissionsView } from './_components/my-submissions-view'

export default function MySubmissionsPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        My Submissions
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Track your publications from draft through published
      </p>
      <MySubmissionsView />
    </PageTransition>
  )
}
