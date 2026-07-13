import { PageTransition } from '@/components/ui/page-transition'
import { MyCoursesView } from './_components/my-courses-view'

export default function LecturerCoursesPage() {
  return (
    <PageTransition>
      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>
        My Courses
      </h1>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Courses you teach in the Kingdom Library System
      </p>
      <MyCoursesView />
    </PageTransition>
  )
}
