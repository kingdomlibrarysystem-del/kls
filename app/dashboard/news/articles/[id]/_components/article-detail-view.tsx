'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, User, Tag, Globe, Calendar, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { articleStatusConfig, type NewsArticle } from '../../../_shared/news-data'

interface ArticleDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Real details page for a single article, mirrors this migration's established detail-view pattern. */
export function ArticleDetailView({ id }: ArticleDetailViewProps) {
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/news/articles/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || !json.data) { setError(json.message ?? 'Article not found'); return }
        setArticle(json.data)
      })
      .catch(() => setError('Failed to load article'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Article Details" />
        <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-40 w-full rounded-lg" /></div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div>
        <PageHeader title="Article Details" />
        <EmptyState icon={FileText} title="Article not found" description={error || 'This article does not exist.'} />
        <div className="mt-4"><UniversalButton href="/dashboard/news/articles" variant="outline" icon={<ArrowLeft size={14} />}>Back to Articles</UniversalButton></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6"><UniversalButton href="/dashboard/news/articles" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to Articles</UniversalButton></div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{article.title}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${articleStatusConfig[article.status].cls}`}>{articleStatusConfig[article.status].label}</span>
        </div>

        <p className="font-lato text-sm text-w-700 leading-relaxed">{article.summary}</p>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Author" value={article.authorName} />
          <DetailRow icon={<Tag size={13} />} label="Category" value={article.category} />
          <DetailRow icon={<Globe size={13} />} label="Language" value={article.language.toUpperCase()} />
          {article.publishedAt && <DetailRow icon={<Calendar size={13} />} label="Published" value={new Date(article.publishedAt).toLocaleDateString()} />}
        </div>

        <div className="bg-w-100 border border-w-300 rounded p-4">
          <p className="font-lato text-sm text-w-950 whitespace-pre-wrap">{article.content}</p>
        </div>
      </div>
    </div>
  )
}
