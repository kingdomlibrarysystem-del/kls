import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { EnrollmentsView } from './_components/enrollments-view'

export default function EnrollmentsPage() {
  return (
    <PageTransition>
      <PageHeader title="Enrollments" subtitle="Member course enrollments and progress" />
      <EnrollmentsView />
    </PageTransition>
  )
}
