import { MessageSquare } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'
import { PhasePlaceholder } from '../_components/phase-placeholder'

export default function LecturerMessagesPage() {
  return (
    <PageTransition>
      <PhasePlaceholder
        icon={MessageSquare}
        title="Messages"
        description="Per-course channels with your learners and direct messages will appear here. This lands in a later build phase."
      />
    </PageTransition>
  )
}
