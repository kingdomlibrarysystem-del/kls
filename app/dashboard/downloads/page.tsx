import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { DOWNLOAD_REPORTS } from '@/lib/data/download-reports'
import { DownloadsView } from './_components/downloads-view'

/** Download Center: issued certificates, and live reports exported as CSV (role permission "reports:view"). */
export default async function DownloadCenterPage() {
  await requireStaffPage()
  const canDownloadReports = await pageHasPermission('reports:view')
  return (
    <PageTransition>
      <PageHeader title="Download Center" subtitle="Certificates, reports, and statements" />
      <DownloadsView reports={DOWNLOAD_REPORTS.map((r) => ({ ...r }))} canDownloadReports={canDownloadReports} />
    </PageTransition>
  )
}
