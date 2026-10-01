import { loadReadableArticle } from '@/lib/server/news-article-page'
import { NewsArticleView } from './_components/news-article-view'

export default async function MemberNewsArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { article, categoryColor, engagement, moreArticles } = await loadReadableArticle(id)
  return <NewsArticleView article={article} categoryColor={categoryColor} engagement={engagement} moreArticles={moreArticles} />
}
