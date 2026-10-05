import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/app/member/_shared/use-readable-content', () => ({
  refreshReadableContent: vi.fn(async () => {}),
}))
vi.mock('@/app/dashboard/library/_components/use-resources', () => ({
  refetchResources: vi.fn(async () => {}),
}))

import { createResourceChapters, syncResourceChapters, realChaptersFrom } from '@/app/dashboard/library/_components/sync-resource-chapters'
import { refetchResources } from '@/app/dashboard/library/_components/use-resources'

/**
 * Regression tests for the authoring flow that produced content-less TEXT
 * books.
 *
 * Two separate defects combined here:
 *
 * 1. A chapter with typed body text but a BLANK title was kept by the form
 *    (it filters on "title OR content") but rejected by POST /api/chapters,
 *    which validates `title` as non-empty. The old code fired that request
 *    without checking the response, so the 400 vanished and the admin got a
 *    success toast for a book with zero chapters.
 * 2. Every chapter request was fire-and-forget, so ANY failure (401, 500,
 *    network) was silently swallowed the same way.
 */

type Call = { url: string; method: string; body: unknown }

function jsonResponse(payload: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => payload }
}

describe('realChaptersFrom', () => {
  it('keeps a chapter that has content but no title (it is authored text, not an empty row)', () => {
    const chapters = realChaptersFrom({ chapters: [{ title: '', content: 'Real prose.' }] }, true)
    expect(chapters).toHaveLength(1)
  })

  it('drops a chapter the admin clicked "Add Chapter" on but never typed into', () => {
    const chapters = realChaptersFrom({ chapters: [{ title: '', content: '   ' }] }, true)
    expect(chapters).toHaveLength(0)
  })

  it('returns nothing for a non-TEXT resource, which has no chapter editor at all', () => {
    const chapters = realChaptersFrom({ chapters: [{ title: 'X', content: 'Y' }] }, false)
    expect(chapters).toHaveLength(0)
  })
})

describe('createResourceChapters', () => {
  let calls: Call[]

  beforeEach(() => {
    vi.clearAllMocks()
    calls = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
      return jsonResponse({ code: 'success', data: {} })
    }))
  })

  it('sends a positional title when the admin typed content but left the title blank', async () => {
    await createResourceChapters('res1', [{ title: '', content: 'Real prose.' }])
    expect(calls).toHaveLength(1)
    expect(calls[0].body).toEqual({ resourceId: 'res1', title: 'Chapter 1', body: 'Real prose.' })
  })

  it('preserves the admin\'s own title when they gave one', async () => {
    await createResourceChapters('res1', [{ title: '  Genesis 1  ', content: 'In the beginning...' }])
    expect((calls[0].body as { title: string }).title).toBe('Genesis 1')
  })

  it('refreshes the resource catalog after creating chapters so chapterCount updates', async () => {
    await createResourceChapters('res1', [{ title: 'Genesis 1', content: 'In the beginning...' }])
    expect(refetchResources).toHaveBeenCalledOnce()
  })

  it('posts chapters sequentially so server-assigned order matches typed order', async () => {
    await createResourceChapters('res1', [
      { title: '', content: 'one' },
      { title: '', content: 'two' },
      { title: '', content: 'three' },
    ])
    expect(calls.map((c) => (c.body as { title: string }).title)).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3'])
  })

  it('REJECTS when the API refuses a chapter, instead of silently reporting success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'title is required' }, false, 400)))
    await expect(createResourceChapters('res1', [{ title: 'ok', content: 'x' }]))
      .rejects.toThrow(/400/)
  })
})

describe('syncResourceChapters', () => {
  let calls: Call[]

  beforeEach(() => {
    calls = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET') {
        return jsonResponse({ code: 'success', data: { resourceId: 'res1', chapters: [{ id: 'c1' }, { id: 'c2' }] } })
      }
      calls.push({ url: String(url), method, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      return jsonResponse({ code: 'success', data: {} })
    }))
  })

  it('updates the overlapping chapters in place rather than recreating them', async () => {
    await syncResourceChapters('res1', [{ title: 'One', content: 'a' }, { title: 'Two', content: 'b' }])
    expect(calls).toHaveLength(2)
    expect(calls.every((c) => c.method === 'PATCH')).toBe(true)
    expect(calls[0].url).toContain('/api/chapters/c1')
    expect(calls[1].url).toContain('/api/chapters/c2')
  })

  it('creates only the chapters beyond the existing rows, and deletes the removed ones', async () => {
    await syncResourceChapters('res1', [{ title: 'One', content: 'a' }, { title: 'New', content: 'b' }, { title: 'Extra', content: 'c' }])
    const creates = calls.filter((c) => c.method === 'POST')
    expect(creates).toHaveLength(1)
    expect((creates[0].body as { title: string }).title).toBe('Extra')
  })

  it('deletes a trailing chapter the admin removed from the editor', async () => {
    await syncResourceChapters('res1', [{ title: 'Only one now', content: 'a' }])
    const deletes = calls.filter((c) => c.method === 'DELETE')
    expect(deletes).toHaveLength(1)
    expect(deletes[0].url).toContain('/api/chapters/c2')
  })

  it('falls back to a positional title on the in-place PATCH too', async () => {
    await syncResourceChapters('res1', [{ title: '', content: 'body only' }, { title: 'Named', content: 'b' }])
    expect((calls[0].body as { title: string }).title).toBe('Chapter 1')
    expect((calls[1].body as { title: string }).title).toBe('Named')
  })

  it('REJECTS when a chapter PATCH fails, so the admin is not told the book saved', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'GET') {
        return jsonResponse({ code: 'success', data: { resourceId: 'res1', chapters: [{ id: 'c1' }] } })
      }
      return jsonResponse({ message: 'Chapter not found' }, false, 404)
    }))
    await expect(syncResourceChapters('res1', [{ title: 'One', content: 'a' }])).rejects.toThrow(/404/)
  })
})
