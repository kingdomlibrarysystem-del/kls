/**
 * Builds the site-search rows (SearchDocument) for one source at a time.
 * Each call replaces that source's rows, so it is safe to run again after
 * every save; a source that is no longer public (draft, archived, deleted)
 * just loses its rows. `reindexSoon` runs it after the response is sent.
 */
import { after } from 'next/server'
import prisma from '@/prisma/client'
import { extractDocumentText } from './extract'
import { chunkText, toPlainText } from './text'

export type SearchSourceType = 'BOOK' | 'LIFE_SCIENCE' | 'NEWS' | 'COURSE' | 'LESSON'
/** What can be re-indexed on its own (a lesson is re-indexed with its course). */
export type IndexableSource = 'BOOK' | 'LIFE_SCIENCE' | 'NEWS' | 'COURSE'

interface Row {
  sourceType: SearchSourceType
  sourceId: string
  courseId?: string | null
  title: string
  subtitle: string
  section: string
  page: number | null
  text: string
  url: string
  locked: boolean
}

const PUBLIC_BOOK_STATUSES = ['AVAILABLE', 'OUT_OF_STOCK'] as const

/** Re-indexes one source. Returns how many rows it now has. */
export async function indexSource(type: IndexableSource, id: string): Promise<number> {
  const rows =
    type === 'BOOK' ? await bookRows(id)
    : type === 'LIFE_SCIENCE' ? await lifeScienceRows(id)
    : type === 'NEWS' ? await newsRows(id)
    : await courseRows(id)
  await removeSource(type, id)
  if (rows.length > 0) await prisma.searchDocument.createMany({ data: rows })
  return rows.length
}

/** Drops a source's rows (a course also drops its lessons). */
export async function removeSource(type: IndexableSource, id: string): Promise<void> {
  await prisma.searchDocument.deleteMany({
    where: type === 'COURSE' ? { OR: [{ sourceType: 'COURSE', sourceId: id }, { courseId: id }] } : { sourceType: type, sourceId: id },
  })
}

/**
 * Re-indexes after the response is sent (kept alive on Vercel by after()).
 * Errors are logged, never shown to the person saving. Skipped in tests,
 * which call indexSource themselves.
 */
export function reindexSoon(type: IndexableSource, id: string | null | undefined): void {
  if (!id || process.env.VITEST) return
  const run = () => indexSource(type, id).catch((e) => console.error(`[search] could not index ${type} ${id}:`, e))
  try { after(run) } catch { void run() }
}

/** Re-indexes every Life Sciences book of a folder after the reply (a folder archived/re-opened hides/shows them). */
export function reindexFolderSoon(folderId: string): void {
  if (process.env.VITEST) return
  const run = async () => {
    const books = await prisma.folderBook.findMany({ where: { folderId }, select: { id: true } })
    for (const b of books) await indexSource('LIFE_SCIENCE', b.id).catch((e) => console.error(`[search] could not index LIFE_SCIENCE ${b.id}:`, e))
  }
  try { after(run) } catch { void run() }
}

/** Everything, from scratch. `log` reports progress (used by `npm run search:reindex`). */
export async function reindexAll(log: (line: string) => void = () => {}): Promise<{ sources: number; rows: number; failed: number }> {
  const [books, lifeBooks, news, courses] = await Promise.all([
    prisma.resource.findMany({ where: { status: { in: [...PUBLIC_BOOK_STATUSES] } }, select: { id: true, title: true } }),
    prisma.folderBook.findMany({ where: { status: 'ACTIVE' }, select: { id: true, title: true } }),
    prisma.newsArticle.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true } }),
    prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true } }),
  ])
  // Start clean, so rows of things deleted long ago do not linger.
  await prisma.searchDocument.deleteMany({})
  const jobs: [IndexableSource, { id: string; title: string }][] = [
    ...books.map((b) => ['BOOK', b] as [IndexableSource, typeof b]),
    ...lifeBooks.map((b) => ['LIFE_SCIENCE', b] as [IndexableSource, typeof b]),
    ...news.map((n) => ['NEWS', n] as [IndexableSource, typeof n]),
    ...courses.map((c) => ['COURSE', c] as [IndexableSource, typeof c]),
  ]
  let rows = 0
  let failed = 0
  for (const [type, s] of jobs) {
    try {
      const n = await indexSource(type, s.id)
      rows += n
      log(`${type.padEnd(12)} ${String(n).padStart(5)} rows  ${s.title}`)
    } catch (e) {
      failed++
      log(`${type.padEnd(12)} FAILED      ${s.title} — ${e instanceof Error ? e.message : e}`)
    }
  }
  return { sources: jobs.length, rows, failed }
}

/* ── One source → rows ───────────────────────────────────────────────── */

/** Text without pages (description, article, lesson) → one row per part. */
function textRows(base: Omit<Row, 'text' | 'page'>, text: string): Row[] {
  return chunkText(text).map((part) => ({ ...base, page: null, text: part }))
}

async function bookRows(id: string): Promise<Row[]> {
  const book = await prisma.resource.findUnique({
    where: { id },
    select: { title: true, author: true, status: true, description: true, documentUrl: true, chapters: { select: { id: true, title: true, body: true }, orderBy: { order: 'asc' } } },
  })
  if (!book || !(PUBLIC_BOOK_STATUSES as readonly string[]).includes(book.status)) return []
  const base = { sourceType: 'BOOK' as const, sourceId: id, title: book.title, subtitle: book.author, locked: false }
  const rows = textRows({ ...base, section: 'About this book', url: `/library/${id}` }, toPlainText(book.description))

  if (book.chapters.length > 0) {
    // The reader shows the written chapters (not the file) when a book has them.
    for (const ch of book.chapters) {
      rows.push(...textRows({ ...base, section: ch.title, url: `/member/library/read/${id}?chapter=${ch.id}` }, toPlainText(ch.body)))
    }
  } else if (book.documentUrl) {
    for (const part of await extractDocumentText(book.documentUrl)) {
      rows.push({ ...base, section: '', page: part.page, text: part.text, url: `/member/library/read/${id}${part.page ? `?page=${part.page}` : ''}` })
    }
  }
  return rows
}

async function lifeScienceRows(id: string): Promise<Row[]> {
  const book = await prisma.folderBook.findUnique({
    where: { id },
    select: { title: true, author: true, description: true, documentUrl: true, status: true, folder: { select: { name: true, status: true } } },
  })
  if (!book || book.status !== 'ACTIVE' || book.folder?.status === 'ARCHIVED') return []
  const base = { sourceType: 'LIFE_SCIENCE' as const, sourceId: id, title: book.title, subtitle: book.author, locked: false, url: `/life-sciences/books/${id}` }
  const rows = textRows({ ...base, section: book.folder?.name ?? '' }, toPlainText(book.description))
  for (const part of await extractDocumentText(book.documentUrl)) {
    rows.push({ ...base, section: '', page: part.page, text: part.text })
  }
  return rows
}

async function newsRows(id: string): Promise<Row[]> {
  const article = await prisma.newsArticle.findUnique({ where: { id }, select: { title: true, summary: true, content: true, authorName: true, status: true } })
  if (!article || article.status !== 'PUBLISHED') return []
  const text = [toPlainText(article.summary), toPlainText(article.content)].filter(Boolean).join('\n\n')
  return textRows({ sourceType: 'NEWS', sourceId: id, title: article.title, subtitle: article.authorName, section: '', url: `/news/${id}`, locked: false }, text)
}

async function courseRows(id: string): Promise<Row[]> {
  const course = await prisma.course.findUnique({
    where: { id },
    select: { title: true, description: true, author: true, status: true, price: true, lessons: { where: { status: 'PUBLISHED' }, select: { id: true, title: true, content: true, contentMarkdown: true, access: true }, orderBy: { order: 'asc' } } },
  })
  if (!course || course.status !== 'PUBLISHED') return []
  const url = `/courses/${id}`
  const rows = textRows({ sourceType: 'COURSE', sourceId: id, courseId: id, title: course.title, subtitle: course.author, section: '', url, locked: false }, toPlainText(course.description))
  for (const lesson of course.lessons) {
    // In a paid course only FREE lessons show their words in results; the others show just the title.
    const locked = course.price > 0 && lesson.access !== 'FREE'
    rows.push(...textRows(
      { sourceType: 'LESSON', sourceId: lesson.id, courseId: id, title: lesson.title, subtitle: course.title, section: '', url, locked },
      toPlainText(lesson.contentMarkdown || lesson.content),
    ))
  }
  return rows
}
