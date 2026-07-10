import { ClipboardList } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'
import { PhasePlaceholder } from '../../_components/phase-placeholder'

export default function SessionRequestsPage() {
  return (
    <PageTransition>
      <PhasePlaceholder
        icon={ClipboardList}
        title="Session Requests"
        description="Learners who complete a course will be able to request a live session here. Approve/reject a request queue lands in a later build phase."
      />
    </PageTransition>
  )
}
