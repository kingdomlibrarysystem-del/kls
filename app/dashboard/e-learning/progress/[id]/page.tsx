import { CourseAnalyticsDetailView } from './_components/course-analytics-detail-view'

interface CourseAnalyticsDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CourseAnalyticsDetailPage({ params }: CourseAnalyticsDetailPageProps) {
  const { id } = await params
  return <CourseAnalyticsDetailView id={id} />
}
