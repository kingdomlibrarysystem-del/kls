import { PageHeader } from '@/components/ui/page-header'
import { DownloadsView } from './_components/downloads-view'

export default function DownloadCenterPage() {
  return (
    <div>
      <PageHeader title="Download Center" subtitle="Certificates, reports, and statements" />
      <DownloadsView />
    </div>
  )
}
