import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { requireStaffPage } from '@/lib/server/page-session'
import { listPendingCertificates, type PendingCertificate } from '@/lib/certificates/issue'
import { toPlain } from '@/lib/server/to-plain'
import { VerifyByCode } from './_components/verify-by-code'
import { CertificatesTable } from './_components/certificates-table'
import { IssueCompletedCertificates } from './_components/issue-completed-certificates'

/** Certificates: issue them to everyone who completed a course (list loaded on the server), verify a code, and the issued list. */
export default async function CertificatesPage() {
  await requireStaffPage()
  const pending = await listPendingCertificates()
  return (
    <PageTransition>
      <PageHeader title="Certificates" subtitle="Issue certificates to members who completed a course, verify a code, and manage issued certificates" />
      <IssueCompletedCertificates initialPending={toPlain<PendingCertificate[]>(pending)} />
      <VerifyByCode />
      <CertificatesTable />
    </PageTransition>
  )
}
