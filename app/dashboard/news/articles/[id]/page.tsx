import { ArticleDetailView } from './_components/article-detail-view'

interface NewsArticleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function NewsArticleDetailPage({ params }: NewsArticleDetailPageProps) {
  const { id } = await params
  return <ArticleDetailView id={id} />
}
