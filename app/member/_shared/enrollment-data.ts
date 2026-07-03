export type EnrollmentStatus = 'ENROLLED' | 'COMPLETED'

export interface CourseEnrollment {
  /** Matches CatalogCourse.id from course-catalog-data.ts. */
  courseId: string
  status: EnrollmentStatus
  /** ISO date, stamped when the learner enrolls. */
  enrolledAt: string
  /** Subset of lesson.id from courseLessons[courseId].lessons. */
  completedLessonIds: string[]
  /** Snapshotted from courseLessons[courseId].lessons.length at enroll time. */
  totalLessons: number
  /** True once any assessment linked to this course (via TakeableAssessment.courseId) has been passed. */
  assessmentPassed: boolean
}

export type AssessmentAttemptStatus = 'PASSED' | 'FAILED'

export interface AssessmentAttempt {
  /** Matches TakeableAssessment.id from assessment-data.ts. */
  assessmentId: string
  status: AssessmentAttemptStatus
  score: number
  totalMarks: number
  /** ISO date, stamped at submission time. */
  takenAt: string
}

/**
 * Seed enrollments so My Courses isn't empty on first load — mirrors the
 * "already in progress" state the old static mockCourses array represented,
 * now backed by the real completedLessonIds the lesson viewer reads/writes.
 */
export const initialEnrollments: CourseEnrollment[] = [
  { courseId: '1', status: 'ENROLLED', enrolledAt: '2026-06-01', completedLessonIds: ['l-1', 'l-2'], totalLessons: 4, assessmentPassed: false },
  { courseId: '2', status: 'ENROLLED', enrolledAt: '2026-06-05', completedLessonIds: ['l-1'], totalLessons: 4, assessmentPassed: false },
  { courseId: '3', status: 'ENROLLED', enrolledAt: '2026-06-10', completedLessonIds: ['l-1'], totalLessons: 4, assessmentPassed: false },
  { courseId: '4', status: 'COMPLETED', enrolledAt: '2026-05-20', completedLessonIds: ['l-1', 'l-2', 'l-3', 'l-4'], totalLessons: 4, assessmentPassed: false },
]

/** Seed attempt history so Assessments' history section isn't empty on first load. */
export const initialAssessmentAttempts: AssessmentAttempt[] = [
  { assessmentId: '1', status: 'PASSED', score: 17, totalMarks: 20, takenAt: '2026-06-20' },
  { assessmentId: '3', status: 'PASSED', score: 14, totalMarks: 20, takenAt: '2026-06-15' },
]
