import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { VerifyByCode } from './_components/verify-by-code'
import { CertificatesTable } from './_components/certificates-table'

export default function CertificatesPage() {
  return (
    <PageTransition>
      <PageHeader title="Certificates" subtitle="Issued course-completion certificates and verification lookup" />
      <VerifyByCode />
      <CertificatesTable />
    </PageTransition>
  )
}
