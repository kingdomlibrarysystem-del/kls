import { CourseDetailView } from './_components/course-detail-view'

interface CourseDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params
  return <CourseDetailView id={id} />
}
