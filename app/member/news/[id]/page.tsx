import { NewsArticleView } from './_components/news-article-view'

export default async function MemberNewsArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NewsArticleView id={id} />
}