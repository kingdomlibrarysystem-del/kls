import { PageTransition } from '@/components/ui/page-transition'
import { CoursePreviewView } from './_components/course-preview-view'

interface CoursePreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function CoursePreviewPage({ params }: CoursePreviewPageProps) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <PageTransition>
          <CoursePreviewView id={id} />
        </PageTransition>
      </div>
    </div>
  )
}
