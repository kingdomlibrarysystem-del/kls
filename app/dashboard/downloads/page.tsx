import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { DownloadsView } from './_components/downloads-view'

export default function DownloadCenterPage() {
  return (
    <PageTransition>
      <PageHeader title="Download Center" subtitle="Certificates, reports, and statements" />
      <DownloadsView />
    </PageTransition>
  )
}
