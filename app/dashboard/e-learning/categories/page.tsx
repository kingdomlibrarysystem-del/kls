import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ElearningTabs } from '../_components/elearning-tabs'
import { CourseCategoriesView } from './_components/course-categories-view'

export default function CourseCategoriesPage() {
  return (
    <PageTransition>
      <PageHeader title="Course Categories" subtitle="Manage the category list shown in the course Add/Edit forms" />
      <ElearningTabs active="categories" />
      <CourseCategoriesView />
    </PageTransition>
  )
}
