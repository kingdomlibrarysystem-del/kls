import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { CatalogView } from './_components/catalog-view'

export default function CourseCatalogPage() {
  return (
    <PageTransition>
      <PageHeader title="Course Catalog" subtitle="All courses in the KLS e-learning catalog" />
      <CatalogView />
    </PageTransition>
  )
}
