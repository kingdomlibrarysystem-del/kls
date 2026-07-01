import { PageTransition } from '@/components/ui/page-transition'
import { MyResearchView } from './_components/my-research-view'

/**
 * "Submit Paper" reuses the existing admin form at
 * /dashboard/research/submit rather than a contributor-specific duplicate —
 * the form itself has no admin-only fields, so building a second copy here
 * would just be the same form maintained twice.
 */
export default function MyResearchPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        My Research
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Projects you&apos;re contributing to, with linked papers
      </p>
      <MyResearchView />
    </PageTransition>
  )
}
