'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Newspaper, FileText, Calendar, User, BookOpen, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import type { NewsArticle } from '@/app/dashboard/news/_shared/news-data'
import { resolveCategoryColor } from '@/app/dashboard/news/_shared/news-data'
import { useNewsCategories } from '@/app/dashboard/news/_shared/use-news-categories'

/** The table of contents card style used across the member portal. */
const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 14,
}

/**
 * Published, reading-only view of the news system: lists newest editions
 * first (newspaper covers), then a filterable list of every published
 * article. Used both in the member portal (/member/news) and on the public
 * site (/news) — `detailPath` controls where article cards link so the
 * public copy needs no login.
 */
export function NewsFeedView({ detailPath = '/member/news' }: { detailPath?: string }) {
  const { t } = useLanguage()
  const managedCategories = useNewsCategories()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    fetch('/api/news/articles?pageSize=100')
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || !Array.isArray(json.data)) { setError(json.message ?? 'Failed to load news'); return }
        setArticles(json.data)
      })
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton style={{ height: 140, width: '100%', borderRadius: 12 }} />
        <Skeleton style={{ height: 80, width: '100%', borderRadius: 12 }} />
        <Skeleton style={{ height: 80, width: '100%', borderRadius: 12 }} />
      </div>
    )
  }

  if (error || articles.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title={t('m_news.no_news')}
        description={error || t('m_news.no_news_desc')}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
      />
    )
  }

  const editions = articles.filter((a) => a.isEdition)
  const featured = articles.find((a) => a.featured) ?? null
  const rest = articles.filter((a) => !a.isEdition && a.id !== featured?.id)
  const categories = managedCategories.length > 0
    ? ['All', ...managedCategories.map((c) => c.name)]
    : ['All', ...Array.from(new Set(rest.map((a) => a.category).filter(Boolean)))]
  const visible = category === 'All' ? [...rest] : rest.filter((a) => a.category === category)

  const dateLabel = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  const meta = (a: NewsArticle) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <User size={11} /> {a.authorName}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Calendar size={11} /> {dateLabel(a.publishedAt)}
      </span>
      {a.language && <span style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>· {a.language}</span>}
    </span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {(editions.length > 0 || featured) && (
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-section)', color: 'var(--gold)' }}>
              <Newspaper size={15} />
            </span>
            <h2 className="cinzel" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('m_news.latest_editions')}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
            {featured && (
              <Link
                href={`${detailPath}/${featured.id}`}
                style={{ flex: '0 0 auto', width: 170, textDecoration: 'none', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ position: 'relative', width: '100%', height: 90, background: 'var(--bg-section)' }}>
                  <RemoteImage
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    sizes="170px"
                    style={{ objectFit: 'cover' }}
                    fallback={
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Newspaper size={20} />
                      </div>
                    }
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <span style={{ background: 'var(--welcome-gradient)', color: 'var(--text-primary)', padding: '1px 7px', borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('m_news.featured')}
                  </span>
                  <p style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{featured.title}</p>
                  <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featured.summary}</p>
                </div>
              </Link>
            )}

            {editions.map((a) => (
              <Link
                key={`ed-${a.id}`}
                href={`${detailPath}/${a.id}`}
                style={{ flex: '0 0 auto', width: 170, textDecoration: 'none', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ position: 'relative', width: '100%', height: 90, background: 'var(--bg-section)' }}>
                  <RemoteImage
                    src={a.coverImage}
                    alt={a.title}
                    fill
                    sizes="170px"
                    style={{ objectFit: 'cover' }}
                    fallback={
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Newspaper size={20} />
                      </div>
                    }
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <span style={{ background: 'var(--bg-dashboard)', border: '1px solid var(--border)', color: 'var(--gold)', padding: '1px 7px', borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('m_news.edition')}
                  </span>
                  <p style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{a.title}</p>
                  <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-section)', color: 'var(--gold)' }}>
            <FileText size={15} />
          </span>
          <h2 className="cinzel" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('m_news.latest_articles')}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {categories.map((c) => {
            const active = c === category
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  border: active ? '1px solid var(--gold)' : '1px solid var(--border)',
                  background: active ? 'var(--welcome-gradient)' : 'var(--bg-section)',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                }}
              >
                {c}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((a) => {
            const color = resolveCategoryColor(a.category, managedCategories)
            return (
              <Link
                key={a.id}
                href={`${detailPath}/${a.id}`}
                style={{ display: 'flex', gap: 14, textDecoration: 'none', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, transition: 'border-color .2s ease' }}
              >
                {a.coverImage ? (
                  <div style={{ position: 'relative', width: 74, height: 74, borderRadius: 10, overflow: 'hidden', flex: '0 0 auto', background: 'var(--bg-section)' }}>
                    <RemoteImage
                      src={a.coverImage}
                      alt={a.title}
                      fill
                      sizes="74px"
                      style={{ objectFit: 'cover' }}
                      fallback={
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <BookOpen size={18} />
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div style={{ width: 74, height: 74, borderRadius: 10, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-section)', border: '1px solid var(--border)', color: color }}>
                    <BookOpen size={22} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: a.isEdition ? 'var(--gold)' : color }}>
                      {a.isEdition ? t('m_news.edition') : a.category}
                    </span>
                    {a.featured && (
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, background: 'var(--welcome-gradient)', color: 'var(--text-primary)', padding: '1px 6px', borderRadius: 5 }}>
                        {t('m_news.featured')}
                      </span>
                    )}
                  </div>
                  <p style={{ marginTop: 3, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{a.title}</p>
                  <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.summary}</p>
                  <div style={{ marginTop: 6 }}>{meta(a)}</div>
                </div>
                <ChevronRight size={18} style={{ flex: '0 0 auto', alignSelf: 'center', color: 'var(--text-muted)' }} />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}