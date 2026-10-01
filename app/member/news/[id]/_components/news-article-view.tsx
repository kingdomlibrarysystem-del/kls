'use client'

import { ArrowLeft, Calendar, User, FileText, BookOpen, Globe2 } from 'lucide-react'
import { LocalDate } from '@/components/ui/local-date'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { RemoteImage } from '@/components/ui/remote-image'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { useLanguage } from '@/contexts/language-context'
import type { NewsArticle } from '@/app/dashboard/news/_shared/news-data'
import { DEFAULT_CATEGORY_COLOR } from '@/app/dashboard/news/_shared/news-data'
import type { ArticleEngagement } from '@/lib/news-engagement-shared'
import { ArticleEngagementSection } from './article-engagement'
import { MoreArticles } from './more-articles'
import type { MoreArticleItem } from '@/lib/data/news-articles'

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
}

/**
 * Full reading view of one published article — the page the email
 * "Read Article" buttons point at (/news/[id] when public, /member/news/[id]
 * inside the member portal). Only ever displays articles the news API
 * exposes, and works on the public site with no login required. The
 * article and its category color are loaded on the server by the page
 * (null = not found / not visible to this viewer), so it arrives
 * already rendered — no skeleton, and readable by search engines.
 *
 * Layout: [more articles | article | likes + comments] on xl screens,
 * [article | likes + comments] with more articles below on lg, one column
 * on small screens. The article stays first in the DOM (reading order /
 * SEO); grid placement moves the rails. Side rails are sticky.
 */
export function NewsArticleView({ article, categoryColor, engagement, moreArticles = [], backPath = '/member/news' }: { article: NewsArticle | null; categoryColor?: string | null; engagement?: ArticleEngagement | null; moreArticles?: MoreArticleItem[]; backPath?: string }) {
  const { t } = useLanguage()

  if (!article) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={FileText}
          title={t('m_news.not_found')}
          description={t('m_news.not_found_desc')}
          style={cardStyle}
        />
        <div>
          <UniversalButton href={backPath} variant="gold-outline" size="sm" icon={<ArrowLeft size={14} />}>
            {t('m_news.back')}
          </UniversalButton>
        </div>
      </div>
    )
  }

  const color = categoryColor || DEFAULT_CATEGORY_COLOR
  // Published articles always get the reactions/comments rail. If the server
  // could not load existing engagement, start empty (the buttons and comment
  // box still render) and tell the reader existing comments are unavailable.
  const isPublished = article.status === 'PUBLISHED'
  const engagementData: ArticleEngagement | null = engagement ?? (isPublished ? { likes: 0, dislikes: 0, myReaction: null, comments: [] } : null)

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[260px_minmax(0,1fr)_360px]">
    <article className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1 xl:col-start-2">
      <div
        style={{
          background: 'linear-gradient(135deg, #2c2416 0%, #6b5020 100%)',
          borderRadius: 12,
          padding: 20,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <h1 className="cinzel" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>
          {article.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <User size={12} /> {article.authorName}
          </span>
          {article.publishedAt && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={12} /> <LocalDate value={article.publishedAt} />
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Globe2 size={12} /> {article.language?.toUpperCase() ?? 'EN'}
          </span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', padding: '2px 9px', borderRadius: 999 }}>
            {article.isEdition ? t('m_news.edition') : article.category}
          </span>
          {article.featured && (
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, background: '#fff', color: '#8a5a1a', padding: '2px 9px', borderRadius: 999 }}>
              {t('m_news.featured')}
            </span>
          )}
        </div>
      </div>

      {article.coverImage && (
        <div style={{ ...cardStyle, position: 'relative', width: '100%', aspectRatio: '16 / 7', overflow: 'hidden' }}>
          <RemoteImage
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            style={{ objectFit: 'cover' }}
            fallback={
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <BookOpen size={32} />
              </div>
            }
          />
        </div>
      )}

      {article.summary && (
        <div style={{ ...cardStyle, padding: 14, borderLeft: `3px solid ${color}` }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
            {article.summary}
          </p>
        </div>
      )}

     <div style={{ ...cardStyle, padding: 18 }}>
        <MarkdownContent markdown={article.content ?? ''} align={(article as NewsArticle & { align?: 'left' | 'center' | 'right' | 'justify' }).align ?? 'left'} />
      </div>


    </article>

    {/* Right rail: likes + comments (sticky, scrolls on its own when long) */}
    {engagementData && (
      <aside className="min-w-0 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto xl:col-start-3">
        <ArticleEngagementSection articleId={article.id} initial={engagementData} loadFailed={!engagement} />
      </aside>
    )}

    {/* Left rail: other articles (below the article on lg, left column on xl) */}
    <aside className="min-w-0 lg:col-start-1 lg:row-start-2 xl:sticky xl:top-4 xl:col-start-1 xl:row-start-1 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
      <MoreArticles items={moreArticles} basePath={backPath} />
    </aside>
    </div>
  )
}