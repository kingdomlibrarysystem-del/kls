import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { CounselorsView } from './_components/counselors-view'

export default function CounselorsPage() {
  return (
    <PageTransition>
      <PageHeader title="Counselor Directory" subtitle="Browse counselors by specialty" />
      <CounselorsView />
    </PageTransition>
  )
}
