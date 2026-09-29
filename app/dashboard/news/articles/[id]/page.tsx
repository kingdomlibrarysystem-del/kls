import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getNewsArticleDetail } from '@/lib/data/news-articles'
import { toPlain } from '@/lib/server/to-plain'
import { ArticleDetailView } from './_components/article-detail-view'
import type { NewsArticle } from '../../_shared/news-data'

interface NewsArticleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function NewsArticleDetailPage({ params }: NewsArticleDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getNewsArticleDetail(id)
  if (!detail) notFound()
  return <ArticleDetailView initialArticle={toPlain<NewsArticle>(detail.article)} />
}
