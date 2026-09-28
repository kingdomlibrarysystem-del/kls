/**
 * Online-first spelling checks for the markdown editor.
 *
 * Preferred path: the professional online dictionary (LanguageTool, see
 * app/api/spellcheck/route.ts). The markdown document is "masked" so code
 * fences, inline code, image/link destinations, autolinks and HTML are
 * replaced by spaces — offsets keep lining up with the CodeMirror document
 * while the remote checker never sees (or flags) markup. When the online
 * service is unreachable, rate-limited, or rejects the request, the offline
 * dictionary-backed check (scanSpellIssues/suggestFor) takes over, so the
 * Spelling panel keeps working with no network at all.
 */

import { markdownSkipRanges, normalizeWord, scanSpellIssues, suggestFor, type SpellIssue, type SpellLanguage } from './spellchecker'

export type SpellSource = 'online' | 'offline'

export interface SpellCheckResult {
  issues: SpellIssue[]
  suggestions: Map<string, string[]>
  source: SpellSource
}

/** Below this the online service is used; above it we go straight to the offline dictionary (the public API caps requests at 20KB). */
export const ONLINE_MAX_CHARS = 20_000

interface OnlineMatch {
  from: number
  to: number
  word: string
  suggestions: string[]
}

/** Replaces markdown non-prose ranges with spaces, preserving every offset. */
export function maskMarkdownForSpellcheck(text: string): string {
  const ranges = markdownSkipRanges(text)
  if (ranges.length === 0) return text
  const chars = text.split('')
  for (const [from, to] of ranges) {
    for (let i = from; i < to; i++) chars[i] = ' '
  }
  return chars.join('')
}

function offlineResult(text: string, ignore: ReadonlySet<string>, language: SpellLanguage): SpellCheckResult {
  const issues = scanSpellIssues(text, ignore, language)
  const suggestions = new Map<string, string[]>()
  const seen = new Set<string>()
  for (const issue of issues) {
    const key = normalizeWord(issue.word)
    if (!key || seen.has(key)) continue
    seen.add(key)
    suggestions.set(key, suggestFor(issue.word, 4, language))
  }
  return { issues, suggestions, source: 'offline' }
}

/**
 * Checks `text` first against the online professional dictionary and falls
 * back to the offline dictionary on any failure. `signal` lets the caller
 * cancel an in-flight request when a newer scan supersedes it.
 */
export async function runSpellingCheck(
  text: string,
  language: SpellLanguage,
  ignore: ReadonlySet<string>,
  signal?: AbortSignal,
): Promise<SpellCheckResult> {
  const masked = maskMarkdownForSpellcheck(text)

  if (!masked.trim() || masked.length > ONLINE_MAX_CHARS) return offlineResult(text, ignore, language)

  try {
    const res = await fetch('/api/spellcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: masked, language }),
      signal,
    })
    if (!res.ok) return offlineResult(text, ignore, language)
    const json = (await res.json()) as { data?: { matches?: OnlineMatch[] } }
    const matches = json.data?.matches ?? []

    const issues: SpellIssue[] = []
    const suggestions = new Map<string, string[]>()
    for (const match of matches) {
      const key = normalizeWord(match.word)
      if (!key || ignore.has(key)) continue
      issues.push({ word: match.word, start: match.from, end: match.to })
      const existing = suggestions.get(key) ?? []
      suggestions.set(key, [...new Set([...existing, ...match.suggestions])])
    }
    return { issues, suggestions, source: 'online' }
  } catch (error) {
    if (signal?.aborted) throw error
    return offlineResult(text, ignore, language)
  }
}