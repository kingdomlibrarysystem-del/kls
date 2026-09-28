import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/spellcheck/route'

vi.mock('@/lib/auth/require-role', () => ({
  requireStaff: vi.fn(async () => ({ response: null })),
}))

function postRequest(body: string): Promise<Response> {
  return POST(new NextRequest('http://localhost/api/spellcheck', { method: 'POST', body }))
}

function jsonRequest(text: string | undefined, language = 'EN'): Promise<Response> {
  return postRequest(JSON.stringify(text === undefined ? {} : { text, language }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/spellcheck', () => {
  it('maps LanguageTool matches to compact offsets, words and suggestions', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        matches: [
          { offset: 5, length: 3, replacements: [{ value: 'the' }] },
          { offset: 19, length: 7, replacements: [{ value: 'sentence' }] },
          { offset: 27, length: 4, replacements: [] },
          { offset: 32, length: 4, replacements: [{ value: 'not now' }] },
          { offset: 5, length: 9, replacements: [{ value: 'ignored' }] },
          { offset: 300, length: 5, replacements: [{ value: 'x' }] },
        ],
      }),
    })))

    const text = 'this teh is a fine sentnce here now.'
    const res = await jsonRequest(text)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.code).toBe('success')
    expect(json.data.matches).toEqual([
      { from: 5, to: 8, word: 'teh', suggestions: ['the'] },
      { from: 19, to: 26, word: 'sentnce', suggestions: ['sentence'] },
      { from: 27, to: 31, word: 'here', suggestions: [] },
      { from: 32, to: 36, word: 'now.', suggestions: ['not now'] },
    ])
  })

  it('forwards the mapped language code and maps EN → en-US', async () => {
    let sentUrl = ''
    let sentLanguage = ''
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      sentUrl = url
      sentLanguage = String(init?.body)
      return { ok: true, status: 200, json: async () => ({ matches: [] }) }
    })
    vi.stubGlobal('fetch', fetchMock)

    await jsonRequest('teh cat', 'EN')
    expect(sentLanguage).toContain('language=en-US')
    expect(sentUrl).toBe('https://api.languagetool.org/v2/check')
  })

  it('uses the premium endpoint only when both credential env vars are set', async () => {
    let sentUrl = ''
    let sentBody = ''
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      sentUrl = url
      sentBody = String(init?.body ?? '')
      return { ok: true, status: 200, json: async () => ({ matches: [] }) }
    })
    vi.stubGlobal('fetch', fetchMock)
    const beforeKey = process.env.LANGUAGETOOL_API_KEY
    const beforeUser = process.env.LANGUAGETOOL_USERNAME
    process.env.LANGUAGETOOL_API_KEY = 'secret'
    process.env.LANGUAGETOOL_USERNAME = 'writer'
    try {
      await jsonRequest('teh cat')
      expect(sentUrl).toBe('https://api.languagetoolplus.com/v2/check')
      expect(sentBody).toContain('apiKey=secret')
    } finally {
      if (beforeKey === undefined) delete process.env.LANGUAGETOOL_API_KEY
      else process.env.LANGUAGETOOL_API_KEY = beforeKey
      if (beforeUser === undefined) delete process.env.LANGUAGETOOL_USERNAME
      else process.env.LANGUAGETOOL_USERNAME = beforeUser
    }
  })

  it('short-circuits whitespace-only text without calling the online service', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const res = await jsonRequest('   \n  ')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.matches).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects text over the online service limit', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const res = await jsonRequest('a'.repeat(20_001))
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a request without text', async () => {
    const res = await postRequest('{}')
    expect(res.status).toBe(400)
  })

  it('returns 502 when the online service is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('ENOTFOUND')
    }))
    const res = await jsonRequest('teh cat')
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.message).toContain('could not be reached')
  })

  it('returns 502 when the online service rejects the request', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 })))
    const res = await jsonRequest('teh cat')
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.message).toContain('rejected the request')
  })
})