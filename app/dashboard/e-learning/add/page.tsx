import { redirect } from 'next/navigation'

/**
 * Add Course is now a modal on the Course Catalog page (see
 * catalog/_components/add-course-modal.tsx) rather than a standalone route,
 * so this page redirects to the catalog where that modal lives.
 */
export default function AddCoursePage() {
  redirect('/dashboard/e-learning/catalog')
}
