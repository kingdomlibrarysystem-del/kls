'use client'

import Link from 'next/link'
import { BookOpen, ChevronLeft, ChevronRight, FileText, GraduationCap, Leaf, Lock, Newspaper, Search, SearchX } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import type { SearchResponse, SearchResult } from '@/lib/search/query'
import type { SearchSourceType } from '@/lib/search/indexer'
import type { SnippetPart } from '@/lib/search/text'

const TYPE_ORDER: SearchSourceType[] = ['BOOK', 'LIFE_SCIENCE', 'NEWS', 'COURSE', 'LESSON']
const TYPE_ICON: Record<SearchSourceType, typeof BookOpen> = {
  BOOK: BookOpen,
  LIFE_SCIENCE: Leaf,
  NEWS: Newspaper,
  COURSE: GraduationCap,
  LESSON: FileText,
}

interface Props {
  query: string
  type: SearchSourceType | null
  data: SearchResponse | null
}

/** /search?q=… — the search box, filters per kind (with counts), results with the words highlighted, and paging. */
export function SearchResultsView({ query, type, data }: Props) {
  const { t } = useLanguage()
  const fill = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key))
  const href = (params: { type?: SearchSourceType | null; page?: number }) => {
    const sp = new URLSearchParams({ q: query })
    if (params.type) sp.set('type', params.type)
    if (params.page && params.page > 1) sp.set('page', String(params.page))
    return `/search?${sp.toString()}`
  }
  const allCount = data ? TYPE_ORDER.reduce((s, k) => s + data.counts[k], 0) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Search header */}
      <section className="bg-gradient-to-br from-[#1a3d5c] via-[#12304a] to-[#0b2136] px-4 pb-10 pt-12 text-[#f6efe0] sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-cinzel text-3xl font-bold sm:text-4xl">{t('search.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#f6efe0]/75 sm:text-base">{t('search.subtitle')}</p>
          <form action="/search" method="get" role="search" className="mt-6 flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">{t('search.placeholder')}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#12304a]/60" />
              <input
                name="q"
                defaultValue={query}
                placeholder={t('search.placeholder')}
                autoFocus={!query}
                maxLength={200}
                className="h-12 w-full rounded-full border-0 bg-white pl-12 pr-4 text-base text-[#12304a] shadow-lg outline-none ring-primary/60 placeholder:text-[#12304a]/45 focus:ring-2"
              />
            </label>
            {type && <input type="hidden" name="type" value={type} />}
            <button type="submit" className="h-12 shrink-0 rounded-full bg-primary px-6 text-sm font-bold text-[#0b2136] shadow-lg transition hover:bg-primary/90">
              {t('search.button')}
            </button>
          </form>
          <p className="mt-3 text-xs text-[#f6efe0]/60">{t('search.tip_phrase')}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {!data ? (
          <EmptyBox icon={<Search className="size-8" />} title={t('search.start_title')} text={t('search.start_hint')} />
        ) : (
          <>
            {/* Filters per kind, with how many results each has */}
            <nav aria-label={t('search.title')} className="mb-5 flex flex-wrap gap-2">
              <Chip href={href({})} active={!type} label={t('search.all')} count={allCount} />
              {TYPE_ORDER.filter((k) => data.counts[k] > 0 || type === k).map((k) => (
                <Chip key={k} href={href({ type: k })} active={type === k} label={t(`search.type_${k}`)} count={data.counts[k]} />
              ))}
            </nav>

            {data.total === 0 ? (
              <EmptyBox icon={<SearchX className="size-8" />} title={fill('search.no_results', { q: data.query })} text={t('search.no_results_hint')} />
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {data.total === 1 ? fill('search.one_result_for', { q: data.query }) : fill('search.results_for', { n: data.total, q: data.query })}
                </p>
                <ol className="flex flex-col gap-4">
                  {data.results.map((r) => <ResultCard key={`${r.sourceType}:${r.sourceId}`} result={r} query={data.query} t={t} fill={fill} />)}
                </ol>

                {data.pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    {data.page > 1 ? (
                      <Link href={href({ type, page: data.page - 1 })} className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><ChevronLeft className="size-4" /> {t('search.prev')}</Link>
                    ) : <span />}
                    <span className="text-sm text-muted-foreground">{fill('search.page_of', { p: data.page, t: data.pages })}</span>
                    {data.page < data.pages ? (
                      <Link href={href({ type, page: data.page + 1 })} className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">{t('search.next')} <ChevronRight className="size-4" /></Link>
                    ) : <span />}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Chip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition',
        active
          ? 'border-[#12304a] bg-[#12304a] text-[#f6efe0] dark:border-primary dark:bg-primary dark:text-[#0b2136]'
          : 'border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground',
      )}
    >
      {label}
      <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active ? 'bg-white/20' : 'bg-muted')}>{count}</span>
    </Link>
  )
}

/** Reader links carry the search, so the book opens with the words highlighted (?q=). */
function withQuery(url: string, query: string): string {
  if (!url.startsWith('/member/library/read/')) return url
  return `${url}${url.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`
}

function ResultCard({ result: r, query, t, fill }: { result: SearchResult; query: string; t: (k: string) => string; fill: (k: string, v: Record<string, string | number>) => string }) {
  const Icon = TYPE_ICON[r.sourceType]
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#12304a]/10 px-2.5 py-0.5 font-semibold text-[#12304a] dark:bg-primary/15 dark:text-primary">
          <Icon className="size-3.5" /> {t(`search.type_${r.sourceType}`)}
        </span>
        <span className="text-muted-foreground">{r.matchCount === 1 ? t('search.one_place') : fill('search.places', { n: r.matchCount })}</span>
      </div>
      <Link href={r.url} className="font-cinzel text-lg font-bold leading-snug text-[#12304a] hover:underline dark:text-[#f6efe0]">
        {r.title}
      </Link>
      {r.subtitle && (
        <p className="text-sm text-muted-foreground">{r.sourceType === 'LESSON' ? fill('search.in_lesson', { course: r.subtitle }) : r.subtitle}</p>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {r.matches.map((m, i) => (
          <li key={i}>
            <Link href={withQuery(m.url, query)} className="group block rounded-xl border border-border/70 bg-muted/30 px-4 py-3 transition hover:border-primary/50 hover:bg-muted/60">
              {(m.page || m.section) && (
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#a07830] dark:text-primary">
                  {m.page ? fill('search.page_n', { n: m.page }) : m.section}
                </span>
              )}
              {m.snippet ? (
                <Snippet parts={m.snippet} />
              ) : (
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="size-3.5" /> {t('search.locked')}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  )
}

function Snippet({ parts }: { parts: SnippetPart[] }) {
  return (
    <span className="block text-sm leading-relaxed text-foreground/85">
      {parts.map((p, i) =>
        p.hit ? <mark key={i} className="rounded bg-primary/30 px-0.5 font-semibold text-foreground">{p.text}</mark> : <span key={i}>{p.text}</span>,
      )}
    </span>
  )
}

function EmptyBox({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
