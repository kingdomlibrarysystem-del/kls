import { CalendarClock } from 'lucide-react'
import { PageTransition } from '@/components/ui/page-transition'
import { PhasePlaceholder } from '../_components/phase-placeholder'

export default function MySessionsPage() {
  return (
    <PageTransition>
      <PhasePlaceholder
        icon={CalendarClock}
        title="My Sessions"
        description="Your approved and upcoming live sessions will appear here, including the mock session room. This lands in a later build phase."
      />
    </PageTransition>
  )
}
