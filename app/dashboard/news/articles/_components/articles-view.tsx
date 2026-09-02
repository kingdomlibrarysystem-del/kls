'use client'

import { useState } from 'react'
import { PlusCircle, Eye, Pencil, Trash2, Send, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { UniversalButton } from '@/components/ui/universal-button'
import { articleStatusConfig, type NewsArticle } from '../../_shared/news-data'
import { useArticles, submitArticle } from '../../_shared/use-articles'
import { ArticleFormModal } from './article-form-modal'
import { DeleteArticleModal } from './delete-article-modal'

/** Authoring list — every NewsArticle regardless of status, mirrors Publishing's Submissions page shape driving off usePublications(). */
export function ArticlesView() {
  const { data, loading, error } = useArticles()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NewsArticle | null>(null)
  const [deleting, setDeleting] = useState<NewsArticle | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading articles" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load articles" description={error} />

  const handleSubmit = async (a: NewsArticle) => {
    try { await submitArticle(a.id); showToast(`Submitted "${a.title}" for review`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not submit this article') }
  }

  const columns: Column<NewsArticle>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (a) => <span className="font-semibold text-w-950 max-w-55 truncate block">{a.title}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (a) => <span className="text-w-700">{a.category}</span> },
    { key: 'isEdition', label: 'Type', render: (a) => <span className="text-xs px-2 py-0.5 bg-w-100 rounded font-lato text-w-700">{a.isEdition ? 'Edition' : 'Article'}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (a) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${articleStatusConfig[a.status].cls}`}>{articleStatusConfig[a.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton href={`/dashboard/news/articles/${a.id}`} aria-label={`View ${a.title}`} variant="secondary" size="sm" icon={<Eye size={12} />} className="!px-2.5 !py-1 !text-xs">View</UniversalButton>
          {a.status === 'DRAFT' && (
            <>
              <button onClick={() => { setEditing(a); setFormOpen(true) }} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"><Pencil size={12} /> Edit</button>
              <button onClick={() => handleSubmit(a)} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-lato hover:bg-blue-100 transition-colors"><Send size={12} /> Submit</button>
              <button onClick={() => setDeleting(a)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors"><Trash2 size={12} /> Delete</button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <div className="flex justify-end mb-4">
        <ElegantButton variant="primary" onClick={() => { setEditing(null); setFormOpen(true) }} className="flex items-center gap-1.5"><PlusCircle size={15} /> New Article</ElegantButton>
      </div>
      <DataTable<NewsArticle>
        data={data}
        columns={columns}
        rowKey={(a) => a.id}
        searchPlaceholder="Search title or category..."
        searchFilter={(a, q) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)}
        emptyMessage="No articles yet."
      />
      <ArticleFormModal open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} />
      <DeleteArticleModal article={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}
