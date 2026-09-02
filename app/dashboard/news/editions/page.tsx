import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { EditionsView } from './_components/editions-view'

export default function NewsEditionsPage() {
  return (
    <PageTransition>
      <PageHeader title="Editions" subtitle="Approved articles and editions ready to publish" />
      <EditionsView />
    </PageTransition>
  )
}
