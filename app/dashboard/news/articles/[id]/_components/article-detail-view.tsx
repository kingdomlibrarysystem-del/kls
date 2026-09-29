'use client'

import { useState } from 'react'
import { ArrowLeft, User, Tag, Globe, Calendar, FileText, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { LocalDate } from '@/components/ui/local-date'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { ElegantButton } from '@/components/ui/elegant-button'
import { articleStatusConfig, type NewsArticle } from '../../../_shared/news-data'
import { ArticleFormModal } from '../../_components/article-form-modal'
import { MarkdownContent } from '@/components/ui/markdown-content'

interface ArticleDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing). */
  initialArticle: NewsArticle
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/** Real details page for a single article — Edit is available on any status. The article arrives from the server page; it is re-read from the API only after an edit. */
export function ArticleDetailView({ initialArticle }: ArticleDetailViewProps) {
  const id = initialArticle.id
  const [article, setArticle] = useState<NewsArticle | null>(initialArticle)
  const [editOpen, setEditOpen] = useState(false)

  /** Re-reads the article after an edit; keeps the last known copy if that fails. */
  const loadArticle = () => {
    fetch(`/api/news/articles/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 'success' && json.data) setArticle(json.data) })
      .catch(() => {})
  }

  if (!article) {
    return (
      <div>
        <PageHeader title="Article Details" />
        <EmptyState icon={FileText} title="Article not found" description="This article does not exist." />
        <div className="mt-4"><UniversalButton href="/dashboard/news/articles" variant="outline" icon={<ArrowLeft size={14} />}>Back to Articles</UniversalButton></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <UniversalButton href="/dashboard/news/articles" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to Articles</UniversalButton>
        <ElegantButton
          variant="outline"
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 text-sm"
        >
          <Pencil size={13} /> Edit Article
        </ElegantButton>
      </div>

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
          {article.publishedAt && <DetailRow icon={<Calendar size={13} />} label="Published" value={<LocalDate value={article.publishedAt} />} />}
        </div>

        <div className="bg-w-100 border border-w-300 rounded p-4">
          <MarkdownContent markdown={article.content ?? ''} align={(article as NewsArticle & { align?: 'left' | 'center' | 'right' | 'justify' }).align ?? 'left'} />
        </div>
      </div>

      <ArticleFormModal
        open={editOpen}
        editing={article}
        onClose={() => {
          setEditOpen(false)
          loadArticle()
        }}
      />
    </div>
  )
}
