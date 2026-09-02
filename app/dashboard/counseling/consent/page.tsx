import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ConsentForm } from './_components/consent-form'

export default function CounselingConsentPage() {
  return (
    <PageTransition>
      <PageHeader title="Privacy & Consent" subtitle="Manage consent settings and confidentiality preferences" />
      <ConsentForm />
    </PageTransition>
  )
}
