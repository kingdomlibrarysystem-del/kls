/**
 * Site search over SearchDocument. Uses the Atlas Search index
 * "site_search" when it exists (spelling mistakes, word forms like
 * corrupt/corruption, best matches first, highlighted words); otherwise a
 * plain match on the words. Rows are grouped per book / article / lesson,
 * with up to three places (page or part) where the words appear.
 */
import prisma from '@/prisma/client'
import type { SearchSourceType } from './indexer'
import { makeSnippet, searchWords, wordsRegex, type SnippetPart } from './text'

export const SEARCH_INDEX_NAME = 'site_search'
export const SEARCH_TYPES: SearchSourceType[] = ['BOOK', 'LIFE_SCIENCE', 'NEWS', 'COURSE', 'LESSON']

/** Rows read per search, before grouping. */
const MAX_ROWS = 400
const MATCHES_PER_RESULT = 3
export const RESULTS_PER_PAGE = 10

export interface SearchMatch {
  page: number | null
  section: string
  url: string
  /** null for locked (paid) content: the place is named, the words are not shown. */
  snippet: SnippetPart[] | null
}

export interface SearchResult {
  sourceType: SearchSourceType
  sourceId: string
  title: string
  subtitle: string
  url: string
  locked: boolean
  /** How many pages/parts of it contain the words. */
  matchCount: number
  matches: SearchMatch[]
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  /** Results of the chosen type (for paging). */
  total: number
  /** Results per type, for the filter chips. */
  counts: Record<SearchSourceType, number>
  page: number
  pages: number
  engine: 'atlas' | 'basic'
}

interface Hit {
  sourceType: SearchSourceType
  sourceId: string
  title: string
  subtitle: string
  section: string
  page: number | null
  url: string
  locked: boolean
  score: number
  snippet: SnippetPart[] | null
}

export async function searchSite(query: string, opts: { type?: SearchSourceType | null; page?: number } = {}): Promise<SearchResponse> {
  const q = query.trim().slice(0, 200)
  const counts = Object.fromEntries(SEARCH_TYPES.map((t) => [t, 0])) as Record<SearchSourceType, number>
  const empty = { query: q, results: [], total: 0, counts, page: 1, pages: 1 }
  const words = searchWords(q)
  if (words.length === 0) return { ...empty, engine: 'basic' }

  const atlas = await hasSearchIndex()
  let hits: Hit[] = []
  if (atlas) {
    try { hits = await atlasHits(q, words) } catch (e) { console.error('[search] Atlas Search failed, using the basic search:', e) }
  }
  const engine = atlas && hits.length > 0 ? 'atlas' : 'basic'
  if (engine === 'basic') hits = await basicHits(words)

  // Group the rows per book / article / lesson, best first.
  const groups = new Map<string, { result: SearchResult; best: number; total: number }>()
  for (const h of hits) {
    const key = `${h.sourceType}:${h.sourceId}`
    let g = groups.get(key)
    if (!g) {
      g = { result: { sourceType: h.sourceType, sourceId: h.sourceId, title: h.title, subtitle: h.subtitle, url: resultUrl(h), locked: h.locked, matchCount: 0, matches: [] }, best: 0, total: 0 }
      groups.set(key, g)
    }
    g.best = Math.max(g.best, h.score)
    g.total += h.score
    g.result.matchCount++
    if (g.result.matches.length < MATCHES_PER_RESULT) {
      g.result.matches.push({ page: h.page, section: h.section, url: h.url, snippet: h.locked ? null : h.snippet })
    }
  }
  // The best part counts most; more places with the words lift it a little.
  const ranked = [...groups.values()]
    .map((g) => ({ ...g, rank: g.best + Math.log2(1 + g.result.matchCount) * 0.5 }))
    .sort((a, b) => b.rank - a.rank)
    .map((g) => g.result)

  for (const r of ranked) counts[r.sourceType]++
  const filtered = opts.type ? ranked.filter((r) => r.sourceType === opts.type) : ranked
  const pages = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE))
  const page = Math.min(Math.max(1, opts.page ?? 1), pages)
  return {
    query: q,
    results: filtered.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE),
    total: filtered.length,
    counts,
    page,
    pages,
    engine,
  }
}

/** A book's title opens the book page (its pages open the reader at that page); anything else opens its own page. */
function resultUrl(h: Hit): string {
  return h.sourceType === 'BOOK' ? `/library/${h.sourceId}` : h.url
}

/* ── Atlas Search ─────────────────────────────────────────────────────── */

let indexCheck: { ready: boolean; at: number } | null = null

/** True when the Atlas Search index exists and can be queried (checked at most once a minute). */
async function hasSearchIndex(): Promise<boolean> {
  if (indexCheck && Date.now() - indexCheck.at < 60_000) return indexCheck.ready
  let ready = false
  try {
    const list = (await prisma.searchDocument.aggregateRaw({ pipeline: [{ $listSearchIndexes: { name: SEARCH_INDEX_NAME } }] })) as unknown as { queryable?: boolean; status?: string }[]
    ready = list.some((i) => i.queryable || i.status === 'READY')
  } catch {
    ready = false // not an Atlas cluster (or no permission): the basic search still works
  }
  indexCheck = { ready, at: Date.now() }
  return ready
}

const TEXT_PATHS = ['text', { value: 'text', multi: 'english' }, { value: 'text', multi: 'french' }]

interface RawHighlight { score: number; texts: { value: string; type: 'hit' | 'text' }[] }
interface RawRow {
  sourceType: SearchSourceType
  sourceId: string
  title: string
  subtitle?: string
  section?: string
  page?: number | null
  url: string
  locked?: boolean
  text: string
  score: number
  highlights?: RawHighlight[]
}

async function atlasHits(q: string, words: string[]): Promise<Hit[]> {
  const longWords = words.filter((w) => w.length >= 5)
  const rows = (await prisma.searchDocument.aggregateRaw({
    pipeline: [
      {
        $search: {
          index: SEARCH_INDEX_NAME,
          compound: {
            should: [
              // The exact phrase first, then the words in any form, then the title.
              { phrase: { query: q, path: 'text', slop: 2, score: { boost: { value: 3 } } } },
              { text: { query: q, path: TEXT_PATHS, score: { boost: { value: 2 } } } },
              { text: { query: q, path: 'title', score: { boost: { value: 4 } } } },
              // One typo allowed, only in longer words ("salvaton" → salvation; "God" must not match "go").
              ...(longWords.length > 0 ? [{ text: { query: longWords.join(' '), path: 'text', fuzzy: { maxEdits: 1, prefixLength: 2 } } }] : []),
            ],
            minimumShouldMatch: 1,
          },
          highlight: { path: TEXT_PATHS, maxNumPassages: 1, maxCharsToExamine: 500_000 },
        },
      },
      { $limit: MAX_ROWS },
      {
        $project: {
          _id: 0, sourceType: 1, sourceId: 1, title: 1, subtitle: 1, section: 1, page: 1, url: 1, locked: 1, text: 1,
          score: { $meta: 'searchScore' }, highlights: { $meta: 'searchHighlights' },
        },
      },
    ],
  })) as unknown as RawRow[]

  return rows.map((r) => ({
    sourceType: r.sourceType,
    sourceId: r.sourceId,
    title: r.title,
    subtitle: r.subtitle ?? '',
    section: r.section ?? '',
    page: r.page ?? null,
    url: r.url,
    locked: !!r.locked,
    score: r.score,
    // Atlas marks the words it matched (incl. other forms and typos); fall back to our own marking.
    snippet: atlasSnippet(r.highlights) ?? makeSnippet(r.text, words) ?? makeSnippet(r.text, words.slice(0, 1)),
  }))
}

/** Atlas highlight passage → a short snippet around the first highlighted word. */
function atlasSnippet(highlights: RawHighlight[] | undefined): SnippetPart[] | null {
  const best = highlights?.slice().sort((a, b) => b.score - a.score)[0]
  if (!best || !best.texts.some((t) => t.type === 'hit')) return null
  const parts = best.texts.map((t) => ({ text: t.value.replace(/\s+/g, ' '), hit: t.type === 'hit' }))
  // Trim long text around the hits to ~110 characters each side.
  const firstHit = parts.findIndex((p) => p.hit)
  const out: SnippetPart[] = []
  let before = 0
  for (let i = firstHit - 1; i >= 0 && before < 110; i--) {
    const take = parts[i].text.slice(-(110 - before))
    before += take.length
    out.unshift({ text: take, hit: false })
  }
  if (before >= 110) out.unshift({ text: '…', hit: false })
  let after = 0
  for (let i = firstHit; i < parts.length && after < 220; i++) {
    const p = parts[i]
    const take = p.hit ? p.text : p.text.slice(0, 220 - after)
    after += take.length
    out.push({ text: take, hit: p.hit })
    if (!p.hit && take.length < p.text.length) { out.push({ text: '…', hit: false }); break }
  }
  return out
}

/* ── Basic search (no Atlas index) ────────────────────────────────────── */

async function basicHits(words: string[]): Promise<Hit[]> {
  if (!wordsRegex(words)) return []
  // Every word must appear in the text or the title.
  const rows = await prisma.searchDocument.findMany({
    where: {
      AND: words.map((w) => ({
        OR: [
          { text: { contains: w, mode: 'insensitive' as const } },
          { title: { contains: w, mode: 'insensitive' as const } },
        ],
      })),
    },
    take: MAX_ROWS,
  })
  return rows.map((r) => {
    const inText = r.text.match(wordsRegex(words)!)?.length ?? 0
    const inTitle = r.title.match(wordsRegex(words)!)?.length ?? 0
    return {
      sourceType: r.sourceType as SearchSourceType,
      sourceId: r.sourceId,
      title: r.title,
      subtitle: r.subtitle,
      section: r.section,
      page: r.page,
      url: r.url,
      locked: r.locked,
      score: inText + inTitle * 4,
      snippet: makeSnippet(r.text, words),
    }
  }).filter((h) => h.score > 0).sort((a, b) => b.score - a.score)
}
