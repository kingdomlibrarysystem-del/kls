// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useReadingProgress, startReading, markChapterRead, markBookComplete, getReadingProgressPercent } from '../use-reading-progress'

function makeRow(resourceId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    resourceId,
    status: 'READING',
    startedAt: '2026-01-01',
    completedChapterIds: [],
    totalChapters: 3,
    lastChapterId: 'chapter-1',
    lastReadAt: '2026-01-01',
    ...overrides,
  }
}

describe('useReadingProgress / markChapterRead race condition', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('getReadingProgressPercent computes percentage from completed chapters', () => {
    expect(getReadingProgressPercent(makeRow('r', { completedChapterIds: [], totalChapters: 4 }) as any)).toBe(0)
    expect(getReadingProgressPercent(makeRow('r', { completedChapterIds: ['a', 'b'], totalChapters: 4 }) as any)).toBe(50)
    expect(getReadingProgressPercent(makeRow('r', { completedChapterIds: [], totalChapters: 0 }) as any)).toBe(0)
  })

  it('waits for the ReadingProgress row to exist before marking a chapter read, instead of silently no-oping', async () => {
    // Simulates a member jumping straight to chapter 3 via the chapter list —
    // no ReadingProgress row exists yet server-side. GET returns empty, the
    // hook's mount triggers no automatic POST (that's startReading's job),
    // and markChapterRead itself must create the row before it can persist.
    const userId = 'user-a'
    const resourceId = 'resource-a'

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET') {
        return Promise.resolve({ json: () => Promise.resolve({ data: [] }) })
      }
      if (method === 'POST') {
        return Promise.resolve({ json: () => Promise.resolve({ code: 'success', data: makeRow(resourceId) }) })
      }
      if (method === 'PATCH') {
        return Promise.resolve({ json: () => Promise.resolve({ code: 'success', data: makeRow(resourceId, { completedChapterIds: ['chapter-3'] }) }) })
      }
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })

    const { result } = renderHook(() => useReadingProgress(userId))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/reading-progress?userId='))
    })

    // No row exists yet locally — this is the exact state that used to make
    // markChapterRead's optimistic .map() a silent no-op, because it only
    // updates an entry that already exists in the array.
    expect(result.current).toHaveLength(0)

    markChapterRead(resourceId, 'chapter-3')

    // The fix: markChapterRead must first POST to create the row...
    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
      expect(postCall).toBeTruthy()
    })

    // ...and then PATCH to persist the chapter completion, rather than
    // dropping the write entirely because the row didn't exist yet.
    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
      expect(patchCall).toBeTruthy()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body).toMatchObject({ userId, resourceId, chapterId: 'chapter-3' })
    })
  })

  it('does not send duplicate POSTs when startReading and markChapterRead race for the same resource', async () => {
    const userId = 'user-b'
    const resourceId = 'resource-b'
    let resolvePost: (() => void) | undefined
    const postPromise = new Promise<void>((resolve) => {
      resolvePost = resolve
    })

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET') return Promise.resolve({ json: () => Promise.resolve({ data: [] }) })
      if (method === 'POST') {
        return postPromise.then(() => ({ json: () => Promise.resolve({ code: 'success', data: makeRow(resourceId) }) }))
      }
      if (method === 'PATCH') {
        return Promise.resolve({ json: () => Promise.resolve({ code: 'success', data: makeRow(resourceId) }) })
      }
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })

    renderHook(() => useReadingProgress(userId))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    // Fire both calls back-to-back, before the in-flight POST resolves —
    // this is the exact race: startReading fires on mount, markChapterRead
    // fires immediately after from a fast chapter navigation.
    startReading(resourceId)
    markChapterRead(resourceId, 'chapter-1')

    resolvePost?.()

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
      expect(patchCall).toBeTruthy()
    })

    const postCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
    expect(postCalls).toHaveLength(1)
  })

  it('markBookComplete marks every chapter complete, including ones skipped along the way', async () => {
    const userId = 'user-c'
    const resourceId = 'resource-c'

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method === 'GET') {
        return Promise.resolve({
          json: () => Promise.resolve({ data: [makeRow(resourceId, { completedChapterIds: ['chapter-3'], lastChapterId: 'chapter-3' })] }),
        })
      }
      if (method === 'PATCH') {
        return Promise.resolve({ json: () => Promise.resolve({ code: 'success', data: makeRow(resourceId) }) })
      }
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })

    const { result } = renderHook(() => useReadingProgress(userId))
    await waitFor(() => expect(result.current).toHaveLength(1))

    markBookComplete(resourceId, ['chapter-1', 'chapter-2', 'chapter-3'])

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
      expect(patchCall).toBeTruthy()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body.markAllComplete).toBe(true)
    })

    await waitFor(() => {
      expect(result.current[0].completedChapterIds).toEqual(['chapter-1', 'chapter-2', 'chapter-3'])
      expect(result.current[0].status).toBe('COMPLETED')
    })
  })
})
