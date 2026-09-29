import type { Metadata } from 'next'
import { PageTransition } from '@/components/ui/page-transition'
import { NewsArticleView } from '@/app/member/news/[id]/_components/news-article-view'
import { loadReadableArticle } from '@/lib/server/news-article-page'

interface PublicNewsArticlePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PublicNewsArticlePageProps): Promise<Metadata> {
  const { id } = await params
  const { article } = await loadReadableArticle(id)
  return article ? { title: article.title, description: article.summary || undefined } : {}
}

/**
 * Public single-article reader (/news/[id]) — the no-login destination the
 * email "Read Article" buttons link to. Back button returns to /news.
 * Rendered on the server so the article arrives with the HTML.
 */
export default async function PublicNewsArticlePage({ params }: PublicNewsArticlePageProps) {
  const { id } = await params
  const { article, categoryColor } = await loadReadableArticle(id)
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <PageTransition>
          <NewsArticleView article={article} categoryColor={categoryColor} backPath="/news" />
        </PageTransition>
      </div>
    </div>
  )
}
