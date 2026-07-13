import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { PaperFormView } from './_components/paper-form-view'

export default function SubmitPaperPage() {
  return (
    <PageTransition>
      <PageHeader title="Submit Paper" subtitle="Submit a research paper linked to one of your projects" />
      <PaperFormView />
    </PageTransition>
  )
}
