import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Server-side proxy for the editor's online professional dictionary check.
 * Forwards a masked markdown fragment to LanguageTool's proofreading API and
 * normalizes its matches into a compact form the editor can squiggle and
 * offer replace-all suggestions from:
 *
 *   { data: { matches: [{ from, to, word, suggestions }] } }
 *
 * Offsets refer to the exact `text` string the client sent (which it has
 * pre-masked — markdown code fences, inline code, image/link destinations
 * and HTML are replaced by spaces — so every offset lines up with the
 * CodeMirror document). The client falls back to its offline dictionary when
 * this route is unreachable or rejects, so a network outage or a language
 * outside EN/FR never breaks the editor's Spelling panel.
 *
 * Why a proxy instead of a direct browser call: the LanguageTool API key
 * (optional premium access) must never reach the client, and the request gets
 * the session cookie for staff-authorisation. The public endpoint is free and
 * keyless but rate-limited (~20 requests, 75KB/min, 20KB per request); set
 * LANGUAGETOOL_API_KEY + LANGUAGETOOL_USERNAME to route to the premium
 * endpoint with higher limits.
 */

const MAX_CHARS = 20_000

const bodySchema = z.object({
  text: z.string().min(1, 'No text to check').max(MAX_CHARS, `Text exceeds the ${MAX_CHARS.toLocaleString()}-character spellcheck limit`),
  language: z.string().min(1).max(20).default('EN'),
})

/** Our article/locale codes → LanguageTool language codes. */
const LT_LANGUAGE: Record<string, string> = {
  EN: 'en-US',
  FR: 'fr',
  en: 'en-US',
  fr: 'fr',
  'fr-FR': 'fr',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
}

interface OnlineMatch {
  from: number
  to: number
  word: string
  suggestions: string[]
}

interface LanguageToolResponse {
  matches?: Array<{
    offset: number
    length: number
    replacements?: Array<{ value: string }>
  }>
}

const PUBLIC_ENDPOINT = 'https://api.languagetool.org/v2/check'
const PREMIUM_ENDPOINT = 'https://api.languagetoolplus.com/v2/check'

export const POST = withErrorHandling('/api/spellcheck', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)

  const text = parsed.data.text
  const ltLanguage = LT_LANGUAGE[parsed.data.language] ?? (parsed.data.language.length === 2 ? parsed.data.language.toLowerCase() : 'en-US')

  // Short-circuit empty whitespace so the rate-limited online service is never
  // called for an empty check.
  if (!text.trim()) return NextResponse.json({ data: { matches: [] as OnlineMatch[] }, message: 'Checked', code: 'success', status: 200 })

  const params = new URLSearchParams({ text, language: ltLanguage })
  const apiKey = process.env.LANGUAGETOOL_API_KEY
  const username = process.env.LANGUAGETOOL_USERNAME
  const endpoint = apiKey && username ? PREMIUM_ENDPOINT : PUBLIC_ENDPOINT
  if (apiKey) params.set('apiKey', apiKey)
  if (username) params.set('username', username)

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
  } catch {
    throw new ApiError('The online dictionary could not be reached', 502)
  }
  if (!res.ok) throw new ApiError('The online dictionary service rejected the request', 502)

  const json = (await res.json()) as LanguageToolResponse

  const matches: OnlineMatch[] = (json.matches ?? [])
    .map((m) => ({
      from: m.offset,
      to: m.offset + m.length,
      word: text.slice(m.offset, m.offset + m.length),
      suggestions: (m.replacements ?? []).map((r) => r.value).filter(Boolean).slice(0, 5),
    }))
    // Guard against out-of-range/empty matches and drop multi-token flags
    // (e.g. "the the") — the editor's replace-all maps single word tokens.
    .filter((m) => m.from >= 0 && m.to <= text.length && m.from < m.to && !/\s/.test(m.word) && /\p{L}/u.test(m.word))

  return NextResponse.json({ data: { matches }, message: 'Checked', code: 'success', status: 200 })
})