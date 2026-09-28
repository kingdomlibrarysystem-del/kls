import { afterEach, describe, expect, it, vi } from 'vitest'
import { maskMarkdownForSpellcheck, ONLINE_MAX_CHARS, runSpellingCheck } from '../online-spellcheck'

const EMPTY_IGNORE: ReadonlySet<string> = new Set()

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('maskMarkdownForSpellcheck', () => {
  it('blanks fenced code blocks but keeps word offsets intact', () => {
    const text = 'hello world\n```js\nconst teh = 1\n```\nsecond line'
    const masked = maskMarkdownForSpellcheck(text)
    expect(masked).toHaveLength(text.length)
    expect(masked.startsWith('hello world')).toBe(true)
    expect(masked.endsWith('second line')).toBe(true)
    expect(masked).not.toContain('const')
    expect(masked).not.toContain('teh')
    // The offline-flagged words on prose lines must have identical offsets.
    expect(text.indexOf('world')).toBe(masked.indexOf('world'))
    expect(text.indexOf('second')).toBe(masked.indexOf('second'))
  })

  it('blanks inline code, image destinations, links, autolinks and HTML tags', () => {
    const text = 'see `teh code` and ![alt](http://x.com/img.png) and a <span>tag</span>'
    const masked = maskMarkdownForSpellcheck(text)
    expect(masked).toHaveLength(text.length)
    expect(masked).toContain('see')
    expect(masked).not.toContain('teh code')
    expect(masked).not.toContain('x.com')
    expect(masked).not.toContain('<span>')
    expect(text.indexOf('and a')).toBe(masked.indexOf('and a'))
  })

  it('returns the text unchanged when there is nothing to mask', () => {
    expect(maskMarkdownForSpellcheck('plain english words only')).toBe('plain english words only')
  })
})

describe('runSpellingCheck — online path', () => {
  it('maps the route response into issues + suggestions with source online', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          matches: [
            { from: 0, to: 3, word: 'teh', suggestions: ['the', 'tea'] },
            { from: 12, to: 23, word: 'recieve', suggestions: ['receive'] },
          ],
        },
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await runSpellingCheck('teh cat did recieve it', 'EN', EMPTY_IGNORE)
    expect(result.source).toBe('online')
    expect(result.issues.map((i) => i.word)).toEqual(['teh', 'recieve'])
    expect(result.issues[0].start).toBe(0)
    expect(result.issues[0].end).toBe(3)
    expect(result.suggestions.get('teh')).toEqual(['the', 'tea'])
    expect(result.suggestions.get('recieve')).toEqual(['receive'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/spellcheck')
    expect(JSON.parse(String(init.body)).language).toBe('EN')
  })

  it('skips ignored words even when the online service flags them', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { matches: [{ from: 0, to: 3, word: 'teh', suggestions: ['the'] }] } }),
    })))

    const result = await runSpellingCheck('teh cat', 'EN', new Set(['teh']))
    expect(result.source).toBe('online')
    expect(result.issues).toHaveLength(0)
  })

  it('uses the same markdown masking the offsets are measured against', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { matches: [] } }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const text = '```\nteh\n```\nplain teh'
    await runSpellingCheck(text, 'EN', EMPTY_IGNORE)
    const init = (fetchMock.mock.calls[0] as unknown as [unknown, RequestInit])[1]
    const sent = JSON.parse(String(init.body)).text as string
    expect(sent).toHaveLength(text.length)
    // Only the prose "teh" survives the mask, so late offsets map back cleanly.
    expect(sent.indexOf('teh')).toBe(text.lastIndexOf('teh'))
  })
})

describe('runSpellingCheck — offline fallback', () => {
  it('falls back when the network request throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }))

    const result = await runSpellingCheck('the teh cat recieve it', 'EN', EMPTY_IGNORE)
    expect(result.source).toBe('offline')
    expect(result.issues.map((i) => i.word)).toContain('teh')
    // Offline suggestions come from the bundled dictionary (limit 4, matching the panel).
    const tehSuggestions = result.suggestions.get('teh')
    expect(tehSuggestions?.length).toBeGreaterThan(0)
    expect(tehSuggestions!.every((s) => s !== 'teh')).toBe(true)
  })

  it('falls back when the proxy responds non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 })))

    const result = await runSpellingCheck('teh cat', 'EN', EMPTY_IGNORE)
    expect(result.source).toBe('offline')
    expect(result.issues.map((i) => i.word)).toEqual(['teh'])
  })

  it('falls back for documents larger than the online limit', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const big = `${'word '.repeat(ONLINE_MAX_CHARS / 5)}teh`
    const result = await runSpellingCheck(big, 'EN', EMPTY_IGNORE)
    expect(result.source).toBe('offline')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not call the online service for prose-free text', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const result = await runSpellingCheck('`code only`', 'EN', EMPTY_IGNORE)
    expect(result.source).toBe('offline')
    expect(result.issues).toHaveLength(0)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rethrows when the signal aborts so superseded scans never apply', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      await new Promise((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    }))
    const controller = new AbortController()
    const pending = runSpellingCheck('teh cat', 'EN', EMPTY_IGNORE, controller.signal)
    controller.abort()
    await expect(pending).rejects.toThrow()
  })
})