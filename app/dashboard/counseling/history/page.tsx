import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { HistoryView } from './_components/history-view'

export default function CounselingHistoryPage() {
  return (
    <PageTransition>
      <PageHeader title="Session History" subtitle="Notes and follow-up recommendations from your past sessions" />
      <HistoryView />
    </PageTransition>
  )
}
