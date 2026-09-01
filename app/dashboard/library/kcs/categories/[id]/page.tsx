import { CategoryDetailView } from './_components/category-detail-view'

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { id } = await params
  return <CategoryDetailView id={id} />
}
