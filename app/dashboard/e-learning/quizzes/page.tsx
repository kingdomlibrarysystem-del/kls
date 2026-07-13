import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { QuizzesView } from './_components/quizzes-view'

export default function QuizzesManagementPage() {
  return (
    <PageTransition>
      <PageHeader title="Quizzes & Exams" subtitle="Manage quizzes and formal examinations across the KLS e-learning catalog" />
      <QuizzesView />
    </PageTransition>
  )
}
