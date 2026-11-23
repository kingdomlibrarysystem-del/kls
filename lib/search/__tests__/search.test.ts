import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import prisma from '@/prisma/client'
import { indexSource } from '../indexer'
import { searchSite } from '../query'
import { chunkText, makeSnippet, searchWords, toPlainText } from '../text'

/**
 * Site search: the text helpers, and real integration tests against the
 * test database (TEST_DATABASE_URL) — a published article and a paid course
 * are indexed, found by a word, hidden once unpublished, and a paid lesson
 * shows no text. The test database has no Atlas Search index, so this also
 * covers the basic (word match) search. Rows use a unique marker word and are
 * removed afterwards.
 */
const RUN = Date.now().toString(36)
// A made-up word nothing else in the database contains.
const MARK = `zorbulax${RUN}`
const ids = { user: '', article: '', course: '', freeLesson: '', paidLesson: '' }

beforeAll(async () => {
  const role = await prisma.role.findFirstOrThrow({ where: { name: 'Admin' } })
  ids.user = (await prisma.user.create({ data: { name: 'Vitest Writer', email: `${RUN}-search@vitest.local`, roleId: role.id, status: 'ACTIVE' } })).id
  ids.article = (await prisma.newsArticle.create({
    data: {
      title: `Vitest Article ${RUN}`, summary: 'A short summary.', category: 'General', authorId: ids.user, authorName: 'Vitest Writer', status: 'PUBLISHED', publishedAt: new Date(),
      content: `<p>Heal what is corrupted before it destroys what is valuable.</p><p>The greatest danger of corruption is ${MARK} accepting damage as normal.</p>`,
    },
  })).id
  ids.course = (await prisma.course.create({ data: { title: `Vitest Course ${RUN}`, description: `About ${MARK} and integrity.`, category: 'Test', author: 'Vitest', status: 'PUBLISHED', price: 1000 } })).id
  ids.freeLesson = (await prisma.lesson.create({ data: { courseId: ids.course, title: 'Open lesson', contentType: 'TEXT', durationMinutes: 5, content: '', contentMarkdown: `# Open\nThe ${MARK} free text.`, order: 1, access: 'FREE', status: 'PUBLISHED' } })).id
  ids.paidLesson = (await prisma.lesson.create({ data: { courseId: ids.course, title: 'Paid lesson', contentType: 'TEXT', durationMinutes: 5, content: '', contentMarkdown: `The ${MARK} paid secret.`, order: 2, access: 'COURSE', status: 'PUBLISHED' } })).id
}, 60_000)

afterAll(async () => {
  await prisma.searchDocument.deleteMany({ where: { OR: [{ sourceId: { in: [ids.article, ids.course, ids.freeLesson, ids.paidLesson] } }, { courseId: ids.course }] } })
  await prisma.lesson.deleteMany({ where: { courseId: ids.course } })
  await prisma.course.deleteMany({ where: { id: ids.course } })
  await prisma.newsArticle.deleteMany({ where: { id: ids.article } })
  await prisma.user.deleteMany({ where: { id: ids.user } })
}, 60_000)

describe('text helpers', () => {
  it('turns HTML and markdown into plain text', () => {
    expect(toPlainText('<!-- kcs-style:{} --><h2>Title</h2><p>One &amp; two</p>')).toBe('Title\nOne & two')
    expect(toPlainText('## Heading\n**Bold** and [a link](https://x.y)')).toBe('Heading\nBold and a link')
  })

  it('splits long text into parts no longer than the limit', () => {
    const text = Array.from({ length: 300 }, (_, i) => `Sentence number ${i}.`).join(' ')
    const parts = chunkText(text, 500)
    expect(parts.length).toBeGreaterThan(5)
    expect(parts.every((p) => p.length <= 500)).toBe(true)
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(text)
  })

  it('marks the searched words (and longer forms of them) in a snippet', () => {
    const parts = makeSnippet('The danger of Corruption is accepting it.', searchWords('corrupt'))!
    expect(parts.filter((p) => p.hit).map((p) => p.text)).toEqual(['Corruption'])
    expect(makeSnippet('Nothing here.', ['corrupt'])).toBeNull()
  })
})

describe('site search (test database, basic search)', () => {
  it('indexes a published article and finds it by a word, with the word highlighted', async () => {
    expect(await indexSource('NEWS', ids.article)).toBeGreaterThan(0)
    const res = await searchSite(MARK)
    const hit = res.results.find((r) => r.sourceId === ids.article)
    expect(hit).toMatchObject({ sourceType: 'NEWS', url: `/news/${ids.article}`, title: `Vitest Article ${RUN}` })
    expect(hit!.matches[0].snippet!.some((p) => p.hit && p.text.toLowerCase() === MARK)).toBe(true)
    expect(res.counts.NEWS).toBeGreaterThanOrEqual(1)
  })

  it('needs every word of the search to be present', async () => {
    expect((await searchSite(`${MARK} normal`)).results.some((r) => r.sourceId === ids.article)).toBe(true)
    expect((await searchSite(`${MARK} elephant`)).results.some((r) => r.sourceId === ids.article)).toBe(false)
  })

  it('shows a free lesson\'s words but only the title of a paid one', async () => {
    await indexSource('COURSE', ids.course)
    const res = await searchSite(MARK, { type: 'LESSON' })
    const free = res.results.find((r) => r.sourceId === ids.freeLesson)
    const paid = res.results.find((r) => r.sourceId === ids.paidLesson)
    expect(free?.matches[0].snippet).not.toBeNull()
    expect(paid).toMatchObject({ locked: true, title: 'Paid lesson' })
    expect(paid!.matches[0].snippet).toBeNull()
    // The type filter keeps only lessons; counts still cover every kind.
    expect(res.results.every((r) => r.sourceType === 'LESSON')).toBe(true)
    expect(res.counts.COURSE).toBeGreaterThanOrEqual(1)
  })

  it('drops an article from the results once it is no longer published', async () => {
    await prisma.newsArticle.update({ where: { id: ids.article }, data: { status: 'DRAFT' } })
    expect(await indexSource('NEWS', ids.article)).toBe(0)
    expect((await searchSite(MARK)).results.some((r) => r.sourceId === ids.article)).toBe(false)
  })
})
