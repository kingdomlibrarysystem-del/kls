import { PageTransition } from '@/components/ui/page-transition'
import { MyCoursesView } from './_components/my-courses-view'

/**
 * "Add Course" reuses the existing admin course form at
 * /dashboard/e-learning/add rather than a contributor-specific duplicate —
 * the form itself has no admin-only fields, so building a second copy here
 * would just be the same form maintained twice. Courses created there are
 * attributed to this contributor's persona, so they immediately appear in
 * this page's own list too (both read the same shared admin catalog store).
 */
export default function MyCoursesPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        My Courses
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Courses you&apos;ve created, with enrollment counts
      </p>
      <MyCoursesView />
    </PageTransition>
  )
}
