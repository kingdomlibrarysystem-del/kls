'use client'

import { useState } from 'react'
import { BookOpen, Send, Star, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { articleStatusConfig, type NewsArticle } from '../../_shared/news-data'
import { useArticles, publishArticle, toggleFeaturedArticle } from '../../_shared/use-articles'

/** APPROVED/PUBLISHED articles/editions grid, mirrors Publishing's catalog-view.tsx shape. APPROVED rows get a real "Publish" action — the actual APPROVED -> PUBLISHED transition. */
export function EditionsView() {
  const { data, loading, error } = useArticles()
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading editions">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}</div>
  }
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load editions" description={error} />

  const catalog = data.filter((a) => a.status === 'APPROVED' || a.status === 'PUBLISHED')

  const handlePublish = async (a: NewsArticle) => {
    try { await publishArticle(a.id); showToast(`Published "${a.title}"`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not publish this article') }
  }
  const handleToggleFeatured = async (a: NewsArticle) => {
    try { await toggleFeaturedArticle(a.id) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not update this article') }
  }

  if (catalog.length === 0) {
    return <EmptyState icon={BookOpen} title="No approved articles yet" description="Approve an article in the Review Queue to see it here." />
  }

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map((a) => (
          <div key={a.id} className="border border-w-300 rounded-lg overflow-hidden bg-white">
            {a.coverImage && (
              <div className="relative w-full h-32 bg-w-200">
                <RemoteImage src={a.coverImage} alt={a.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><BookOpen size={24} className="text-w-400" /></div>} />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-cinzel text-sm font-semibold text-w-950 truncate">{a.title}</h3>
                <button onClick={() => handleToggleFeatured(a)} aria-label={a.featured ? 'Unfeature' : 'Feature'}>
                  <Star size={14} className={a.featured ? 'text-yellow-500' : 'text-w-300'} fill={a.featured ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="font-lato text-xs text-w-600 mb-2 px-2 py-0.5 bg-w-100 rounded inline-block">{a.category}</p>
              <p className="font-lato text-xs text-w-700 mb-3">{a.summary}</p>
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${articleStatusConfig[a.status].cls}`}>{articleStatusConfig[a.status].label}</span>
                {a.status === 'APPROVED' && (
                  <button onClick={() => handlePublish(a)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors"><Send size={12} /> Publish</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
