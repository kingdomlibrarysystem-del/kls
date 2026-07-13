import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { CourseFormView } from './_components/course-form-view'

export default function AddCoursePage() {
  return (
    <PageTransition>
      <PageHeader title="Add / Edit Course" subtitle="Create or update a course in the KLS e-learning catalog" />
      <CourseFormView />
    </PageTransition>
  )
}
