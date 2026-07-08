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

/**
 * Review lifecycle, independent of pass/fail: AUTO_GRADED means every
 * question was auto-gradable (no OPEN questions) so `status`/`score` are
 * final at submission time. PENDING_REVIEW means at least one OPEN answer
 * still needs a manager's score — `score` is a partial total (auto-gradable
 * questions only) and `status` is not yet meaningful for pass/fail purposes
 * until a manager grades it and flips this to GRADED.
 */
export type AttemptStatus = 'AUTO_GRADED' | 'PENDING_REVIEW' | 'GRADED'

export interface AssessmentAttempt {
  /** Matches TakeableAssessment.id from assessment-data.ts. */
  assessmentId: string
  /** Pass/fail outcome. Only authoritative once reviewStatus !== 'PENDING_REVIEW'. */
  status: AssessmentAttemptStatus
  reviewStatus: AttemptStatus
  /** Auto-gradable score while PENDING_REVIEW; final score once GRADED/AUTO_GRADED. */
  score: number
  totalMarks: number
  /** ISO date, stamped at submission time. */
  takenAt: string
  /** Raw OPEN-question answer text, keyed by Question.id — the data a manager reviews. */
  openAnswers?: Record<string, string>
  /** Manager-entered per-question scores for OPEN questions, keyed by Question.id — populated once GRADED. */
  openScores?: Record<string, number>
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
  { assessmentId: '1', status: 'PASSED', reviewStatus: 'AUTO_GRADED', score: 17, totalMarks: 20, takenAt: '2026-06-20' },
  { assessmentId: '3', status: 'PASSED', reviewStatus: 'AUTO_GRADED', score: 14, totalMarks: 20, takenAt: '2026-06-15' },
]
