import { CourseLessonsPanel } from './course-lessons-panel'
import { CourseEnrollmentsPanel } from './course-enrollments-panel'
import { CourseQuizzesPanel } from './course-quizzes-panel'

interface CourseRelatedPanelsProps {
  courseId: string
}

/** Lessons/Enrollments/Quizzes side-by-side, so an admin can jump into any related record without leaving the course detail page. */
export function CourseRelatedPanels({ courseId }: CourseRelatedPanelsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-form-highlight border border-w-300 rounded p-4">
        <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Lessons</h2>
        <CourseLessonsPanel courseId={courseId} />
      </div>
      <div className="bg-form-highlight border border-w-300 rounded p-4">
        <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Enrollments</h2>
        <CourseEnrollmentsPanel courseId={courseId} />
      </div>
      <div className="bg-form-highlight border border-w-300 rounded p-4">
        <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Quizzes & Exams</h2>
        <CourseQuizzesPanel courseId={courseId} />
      </div>
    </div>
  )
}
