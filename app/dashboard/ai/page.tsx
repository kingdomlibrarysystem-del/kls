import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { AiToolsView } from './_components/ai-tools-view'

export default function AiToolsPage() {
  return (
    <PageTransition>
      <PageHeader title="AI & Tools" subtitle="Mocked semantic search and chat assistance" />
      <AiToolsView />
    </PageTransition>
  )
}
