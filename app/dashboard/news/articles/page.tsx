import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ArticlesView } from './_components/articles-view'

export default function NewsArticlesPage() {
  return (
    <PageTransition>
      <PageHeader title="Articles" subtitle="Draft, submit, and manage every article and edition" />
      <ArticlesView />
    </PageTransition>
  )
}
