import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getCategoryDetail } from '@/lib/data/categories'
import { toPlain } from '@/lib/server/to-plain'
import { CategoryDetailView } from './_components/category-detail-view'
import type { Category } from '@/lib/kcs-taxonomy'

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const category = await getCategoryDetail(id)
  if (!category) notFound()
  return <CategoryDetailView initialCategory={toPlain<Category>(category)} />
}
