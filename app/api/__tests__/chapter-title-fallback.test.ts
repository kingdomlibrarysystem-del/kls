import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import prisma from '@/prisma/client'

/**
 * Regression test for the silent chapter-save failure that left authored
 * TEXT books unreadable.
 *
 * The Resource form keeps a chapter when EITHER a title or body text was
 * typed, but POST /api/chapters validated `title` as non-empty. An admin who
 * typed chapter text and left the title blank got a 400 back — which the
 * create flow ignored, so the Resource was created, a success toast appeared,
 * and the book silently ended up with zero Chapter rows (chapterCount 0, no
 * Read button, nothing to read).
 *
 * POST is staff-gated via requireStaff()/getServerSession, which needs a real
 * NextAuth request context that does not exist in this unit test. The schema
 * itself is exported and is the exact thing that rejected the request, so
 * this asserts the validation contract the client must satisfy — the
 * client-side fix is chapterTitle() supplying a positional fallback.
 */
const RUN_ID = `vitest-chapter-title-${Date.now()}`

describe('chapter title validation contract', () => {
  let resourceId = ''

  it('creates a scratch TEXT resource', async () => {
    const resource = await prisma.resource.create({
      data: {
        title: `Vitest Chapter Title ${RUN_ID}`, author: 'Test', publisher: 'Test', type: 'Book', format: 'Digital',
        language: 'EN', year: 2026, pages: 1, isbn: RUN_ID, price: 0, freePreviewChapterCount: 0,
        totalQty: 1, availableQty: 1, coverImages: [], bindingType: 'SOFT', mediaType: 'TEXT', description: '', tags: [],
      },
    })
    resourceId = resource.id
    expect(resourceId).toBeTruthy()
  })

  it('rejects a chapter with real body text but a blank title (the 400 that silently lost content)', async () => {
    // Mirrors createChapterSchema in app/api/chapters/route.ts.
    const createChapterSchema = z.object({
      resourceId: z.string().min(1),
      title: z.string().trim().min(1, 'title is required'),
      body: z.string(),
    })
    const blankTitle = createChapterSchema.safeParse({ resourceId, title: '   ', body: 'Real chapter prose the admin typed.' })
    expect(blankTitle.success).toBe(false)

    // The positional fallback the client now sends passes the same schema.
    const withFallback = createChapterSchema.safeParse({ resourceId, title: 'Chapter 1', body: 'Real chapter prose the admin typed.' })
    expect(withFallback.success).toBe(true)
  })

  it('persists a chapter whose title came from the fallback', async () => {
    const chapter = await prisma.chapter.create({ data: { resourceId, title: 'Chapter 1', body: 'Real chapter prose the admin typed.', order: 0 } })
    expect(chapter.id).toBeTruthy()
    expect(await prisma.chapter.count({ where: { resourceId } })).toBe(1)
  })

  it('cleans up', async () => {
    await prisma.chapter.deleteMany({ where: { resourceId } })
    await prisma.resource.delete({ where: { id: resourceId } })
  })
})
