import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { RepositoryView } from './_components/repository-view'

export default function RepositoryPage() {
  return (
    <PageTransition>
      <PageHeader title="Paper Repository" subtitle="Published research papers, searchable by title or keyword" />
      <RepositoryView />
    </PageTransition>
  )
}
