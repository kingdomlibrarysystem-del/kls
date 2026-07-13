import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { CatalogView } from './_components/catalog-view'

export default function PublishedCatalogPage() {
  return (
    <PageTransition>
      <PageHeader title="Published Catalog" subtitle="All published books, filterable by language and contributor" />
      <CatalogView />
    </PageTransition>
  )
}
