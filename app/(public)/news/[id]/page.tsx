import { PageTransition } from '@/components/ui/page-transition'
import { NewsArticleView } from '@/app/member/news/[id]/_components/news-article-view'

interface PublicNewsArticlePageProps {
  params: Promise<{ id: string }>
}

/**
 * Public single-article reader (/news/[id]) — the no-login destination the
 * email "Read Article" buttons link to. Back button returns to /news.
 */
export default async function PublicNewsArticlePage({ params }: PublicNewsArticlePageProps) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <PageTransition>
          <NewsArticleView id={id} backPath="/news" />
        </PageTransition>
      </div>
    </div>
  )
}