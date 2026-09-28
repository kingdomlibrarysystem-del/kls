import { config } from 'md-editor-rt'
import type MarkdownIt from 'markdown-it'

export function extractYouTubeId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Image layout — encoded as a small DSL inside the markdown image's
 * `title` attribute so it round-trips through the raw text (and survives
 * copy/paste), and read by the image renderer rule below in BOTH the
 * admin editor's live preview and the member-facing renderer (they share
 * this markdown-it config).
 *
 *   ![alt](url)             — default block image (max-width 100%)
 *   ![alt](url "kcs-right w40")   — floats right, 40% width, text wraps left
 *   ![alt](url "kcs-left w35")    — floats left, 35% width, text wraps right
 *   ![alt](url "kcs-center w60")  — centered standalone block, 60% width
 *   ![alt](url "w60")             — plain block, 60% width
 *
 * A caption can be attached with `cap=...` (carried along with the layout
 * tokens, so captions survive resize/alignment edits). A rendered caption
 * becomes a <figcaption> under the image in both preview and reader.
 */
export interface ImgLayout {
  /** left/right float the image so book text wraps around it; center = standalone centered; none = default block. */
  align: 'left' | 'right' | 'center' | 'none'
  /** Width as a percentage of the text column (10–100). */
  width: number
}

/** Cap token embedded in an image title — e.g. `cap=Our%20annual%20report`. */
const CAP_RE = /\bcap=([01]?[a-zA-Z0-9%_./+=-]+)/

/** Reads the optional `cap=...` caption token out of an image title. */
export function parseImgCaption(title: string | null | undefined): string {
  const t = title ?? ''
  const m = CAP_RE.exec(t)
  if (!m) return ''
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

export function parseImgLayout(title: string | null | undefined): ImgLayout {
  const t = title ?? ''
  const align = /kcs-(left|right|center)/.exec(t)?.[1] as 'left' | 'right' | 'center' | undefined
  const w = /w(\d+)/.exec(t)?.[1]
  return { align: align ?? 'none', width: w ? Math.min(100, Math.max(10, Number(w))) : 100 }
}

/** Rebuilds a markdown image with the given layout DSL (or plain if default). An optional caption is encoded into the same title token. */
export function encodeImgLayout(alt: string, url: string, layout: ImgLayout, caption?: string | null): string {
  const parts: string[] = []
  if (layout.align !== 'none') parts.push(`kcs-${layout.align}`)
  if (layout.width < 100) parts.push(`w${layout.width}`)
  if (caption && caption.trim()) parts.push(`cap=${encodeURIComponent(caption.trim())}`)
  if (parts.length === 0) return `![${alt}](${url})`
  return `![${alt}](${url} "${parts.join(' ')}")`
}

export type DocumentAlign = 'left' | 'center' | 'right' | 'justify'

export interface DocumentStyle {
  fontFamily?: string
  fontSize?: string
  align?: DocumentAlign
  /** Unitless CSS line-height for the whole document (e.g. "1.5"). */
  lineHeight?: string
}

const STYLE_MARKER = /^\s*<!-- kcs-style:(\{.*?\}) -->\s*/

function isDocumentStyle(value: unknown): value is DocumentStyle {
  if (!value || typeof value !== 'object') return false
  const style = value as Record<string, unknown>
  return (style.fontFamily === undefined || (typeof style.fontFamily === 'string' && /^[\w\s,"'-]+$/.test(style.fontFamily)))
    && (style.fontSize === undefined || (typeof style.fontSize === 'string' && /^\d{1,3}px$/.test(style.fontSize)))
    && (style.align === undefined || ['left', 'center', 'right', 'justify'].includes(style.align as string))
    && (style.lineHeight === undefined || (typeof style.lineHeight === 'string' && /^\d+(\.\d+)?$/.test(style.lineHeight)))
}

export function parseDocumentStyle(value: string): { style: DocumentStyle; content: string } {
  const match = value.match(STYLE_MARKER)
  if (!match) return { style: {}, content: value }
  try {
    const parsed: unknown = JSON.parse(match[1])
    return isDocumentStyle(parsed) ? { style: parsed, content: value.slice(match[0].length) } : { style: {}, content: value }
  } catch {
    return { style: {}, content: value }
  }
}

export function encodeDocumentStyle(content: string, style: DocumentStyle): string {
  const current = parseDocumentStyle(content).content
  const clean = Object.fromEntries(Object.entries(style).filter(([, value]) => value))
  return Object.keys(clean).length === 0 ? current : `<!-- kcs-style:${JSON.stringify(clean)} -->\n${current}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Overrides markdown-it's link_open/link_close renderer rules so a bare
 * YouTube link renders as a real iframe embed. Exported separately from
 * configureMarkdownEditor so it can be unit-tested directly against a bare
 * markdown-it instance, without booting md-editor-rt's own component tree.
 */
export function applyYouTubeEmbedRule(md: MarkdownIt): void {
  const defaultLinkOpen =
    md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  const defaultLinkClose =
    md.renderer.rules.link_close ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet('href')
    const videoId = href ? extractYouTubeId(href) : null
    tokens[idx].meta = { ...tokens[idx].meta, kcsYouTubeId: videoId }
    if (videoId) {
      return `<div class="kcs-video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><a style="display:none">`
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
    let depth = 0
    for (let i = idx - 1; i >= 0; i--) {
      if (tokens[i].type === 'link_close') depth++
      else if (tokens[i].type === 'link_open') {
        if (depth === 0) {
          return tokens[i].meta?.kcsYouTubeId ? '</a>' : defaultLinkClose(tokens, idx, options, env, self)
        }
        depth--
      }
    }
    return defaultLinkClose(tokens, idx, options, env, self)
  }
}

/**
 * Overrides markdown-it's image renderer so an image whose title carries
 * the kcs-* layout DSL is emitted with real book-layout HTML: a centered
 * block (width %) or a floated, text-wrapping span (float left/right,
 * defined in CSS as `.kcs-img` / `.kcs-img-wrap`). Images without the DSL
 * keep the plain markdown behavior. Inline styled width keeps the exact
 * size the author chose on both small and large screens. A `cap=...`
 * caption token renders as a <figcaption> under the image.
 */
export function applyImageLayoutRule(md: MarkdownIt): void {
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]
    const src = token.attrGet('src') ?? ''
    const alt = token.content
    const title = token.attrGet('title')
    const { align, width } = parseImgLayout(title)
    const caption = parseImgCaption(title)
    const base = `<img src="${esc(src)}" alt="${esc(alt)}"`
    const figCaption = caption ? `<figcaption>${esc(caption)}</figcaption>` : ''

    if (align === 'center') {
      const img = `${base} class="kcs-img kcs-img-center" style="width:${width}%" />`
      return caption ? `<figure class="kcs-figure kcs-figure-center">${img}${figCaption}</figure>` : img
    }
    if (align === 'left' || align === 'right') {
      const inline = align === 'left' ? 'float:left;margin:4px 16px 12px 0' : 'float:right;margin:4px 0 12px 16px'
      const wrap = `<span class="kcs-img-wrap kcs-img-${align}" style="width:${width}%;${inline}">${base} class="kcs-img" /></span>`
      return caption ? `<figure class="kcs-figure kcs-figure-${align}">${wrap}${figCaption}</figure>` : wrap
    }
    return caption
      ? `<figure class="kcs-figure">${base} class="kcs-img" />${figCaption}</figure>`
      : `${base} class="kcs-img" />`
  }
}

/**
 * Per-selection rich text stored as a compact, non-HTML DSL in the markdown
 * source so the editor never has to write raw `<span>`/`<mark>` tags into the
 * author's text (image sizing already works this way via the kcs-* title
 * tokens). The editor toolbar writes these tokens; this inline rule renders
 * them back to the same styled spans the preview sanitizer allowlists:
 *
 *   [[c:#0ea5e9|colored]]            → <span style="color:#0ea5e9">colored</span>
 *   [[h:#3b82f6|highlighted]]        → <mark style="background-color:#3b82f6">highlighted</mark>
 *   [[ff:Georgia, serif|text]]       → <span style="font-family:Georgia, serif">text</span>
 *   [[fs:18px|text]]                 → <span style="font-size:18px">text</span>
 *
 * Values are strict (hex colors, px sizes, word/quote font stacks) so a token
 * can never smuggle attributes or HTML; anything malformed simply stays as
 * literal text. Old content authored with the previous inline-HTML format
 * keeps rendering (the sanitizer allowlists spans/marks), so the DSL is purely
 * additive for new authoring.
 */
export type RichSpan = 'c' | 'h' | 'ff' | 'fs'

const RICH_DSL_RE = /\[\[(c|h|ff|fs):([^|\]\n]*)\|([^\]\n]*)\]\]/

const INLINE_STYLE_PROPS: ReadonlySet<string> = new Set(['color', 'background-color', 'font-family', 'font-size'])

const RICH_VALID: Record<RichSpan, (value: string) => boolean> = {
  c: (v) => /^#[0-9a-f]{3,8}$/i.test(v),
  h: (v) => /^#[0-9a-f]{3,8}$/i.test(v),
  fs: (v) => /^\d{1,3}px$/.test(v),
  ff: (v) => v.length > 0 && v.length <= 80 && /^[\w\s,.'"-]+$/.test(v),
}

export function applyRichTextRule(md: MarkdownIt): void {
  md.inline.ruler.before('emphasis', 'kcs_rich', (state, silent) => {
    const m = RICH_DSL_RE.exec(state.src.slice(state.pos))
    if (!m) return false
    const kind = m[1] as RichSpan
    const value = m[2].trim()
    if (!RICH_VALID[kind](value)) return false
    if (silent) return true
    const tag = kind === 'h' ? 'mark' : 'span'
    const css = kind === 'h' ? `background-color:${value}` : kind === 'c' ? `color:${value}` : kind === 'ff' ? `font-family:${value}` : `font-size:${value}`
    const open = state.push('kcs_rich', tag, 1)
    open.meta = { css }
    const text = state.push('text', '', 0)
    text.content = m[3]
    const close = state.push('kcs_rich', tag, -1)
    close.meta = { css }
    state.pos += m[0].length
    return true
  })

  md.renderer.rules.kcs_rich = (tokens, idx) => {
    const css = (tokens[idx].meta as { css: string }).css
    return tokens[idx].nesting === 1 ? `<${tokens[idx].tag} style="${esc(css)}">` : `</${tokens[idx].tag}>`
  }
}

/* ---------------------------------------------------------------------------
 * Selection-aware rich text (inline HTML spans)
 *
 * When the author selects text, the toolbar applies font family / font size /
 * color / highlight by wrapping the selection in a `<span style="...">`
 * element inside the markdown source. md-editor-rt renders markdown with
 * `html: true`, so these spans appear in the live preview verbatim, and the
 * shared sanitizer (sanitizeRichHtml) allowlists exactly the four style
 * properties used here — which is what lets the same formatting reach the
 * published article/chapter readers through MarkdownContent.
 *
 * The helpers are pure string functions over the raw markdown so they can be
 * unit-tested without a DOM or CodeMirror. No quotes ever appear inside a
 * style attribute (they break the double-quoted attribute), so the legacy
 * `[[ff:...]]` token rule and the old DSL toolbar (which kept padded quoted
 * stacks) are the only producers of quoted font stacks; the new writer
 * normalizes them away.
 * ------------------------------------------------------------------------- */

export type InlineStyleProp = 'color' | 'background-color' | 'font-family' | 'font-size'

export interface SpanEditResult {
  /** The rewritten markdown document. */
  text: string
  /** New selection start inside `text` (the formatted inner text, tags excluded). */
  from: number
  /** New selection end inside `text`. */
  to: number
  /** Whether the document actually changed. */
  applied: boolean
}

const SPAN_TAG_RE = /<span\b[^>]*>|<\/span>/g

interface ParsedSpan {
  open: number
  openEnd: number
  closeStart: number
  close: number
}

/** Parses every matched `<span …>…</span>` pair in the source. */
function parseStyledSpans(text: string): ParsedSpan[] {
  const opens: number[] = []
  const spans: ParsedSpan[] = []
  let m: RegExpExecArray | null
  while ((m = SPAN_TAG_RE.exec(text))) {
    if (m[0].startsWith('</span>')) {
      const openIdx = opens.pop()
      if (openIdx === undefined) continue
      const span = spans.find((s) => s.open === openIdx)
      if (span) {
        span.closeStart = m.index
        span.close = m.index + m[0].length
      }
    } else {
      opens.push(m.index)
      spans.push({ open: m.index, openEnd: m.index + m[0].length, closeStart: -1, close: -1 })
    }
  }
  return spans.filter((s) => s.close !== -1)
}

/** Reads the `style="…"` declarations out of a `<span …>` open tag. */
function spanStyleMap(openTag: string): Map<string, string> {
  const map = new Map<string, string>()
  const m = /<span\b[^>]*style="([^"]*)"[^>]*>/i.exec(openTag)
  if (!m) return map
  for (const decl of m[1].split(';')) {
    const idx = decl.indexOf(':')
    if (idx <= 0) continue
    const prop = decl.slice(0, idx).trim().toLowerCase()
    const value = decl.slice(idx + 1).trim()
    if (prop && value) map.set(prop, value)
  }
  return map
}

function splitCss(css: string): [string, string] {
  const idx = css.indexOf(':')
  if (idx <= 0) return ['', '']
  const prop = css.slice(0, idx).trim().toLowerCase()
  const value = css.slice(idx + 1).trim()
  return INLINE_STYLE_PROPS.has(prop) && value ? [prop, value] : ['', '']
}

/**
 * Normalizes a CSS font-family value: trims each comma-separated member,
 * strips surrounding quotes, drops empty / duplicate members and rejoins
 * with ", ". `"Times New Roman", Times, serif` keeps its members, but stray
 * empty slots like `Times New Roman, , ,` collapse to `Times New Roman`, and
 * an unusable value (no surviving members) becomes `''`.
 */
export function cleanFontFamily(value: string): string {
  const seen = new Set<string>()
  const members: string[] = []
  for (const member of value.split(',')) {
    const trimmed = member.trim().replace(/^["']+|["']+$/g, '').trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    members.push(trimmed)
  }
  return members.join(', ')
}

/** Serializes one allowlisted style property (font-family members are cleaned). */
function styleToken(prop: string, value: string): string {
  return prop === 'font-family' ? `font-family:${cleanFontFamily(value)}` : `${prop}:${value}`
}

/**
 * True when `from` sits at the start of a line whose first token opens a block
 * scope (ordered/bullet list item, heading, blockquote, fenced code, raw HTML).
 * Wrapping there would make markdown-it swallow the block marker as span text,
 * so e.g. `1. sostene\n2. bananayo` stops rendering as numbered items.
 */
const BLOCK_OPEN_RE = /^(?:>\s?|[-*+]\s|\d{1,3}[.)]\s|#{1,6}\s|```|~{3,}|<[a-zA-Z][\w-]*|\|{1,2}\s)/

function isBlockStart(text: string, from: number): boolean {
  const lineStart = from > 0 ? text.lastIndexOf('\n', from - 1) + 1 : 0
  const lineEnd = text.indexOf('\n', lineStart)
  const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
  if (from - lineStart > line.length) return false
  const trimmed = line.trimStart()
  if (!BLOCK_OPEN_RE.test(trimmed)) return false
  const lead = line.length - trimmed.length
  return from - lineStart <= lead // selection begins at/inside the block marker
}

/**
 * Wraps `[from, to)` in an inline span with the given `css` (e.g.
 * `color:#ef4444`, `font-size:18px`). No-op when the selection is already
 * fully wrapped by a span carrying the exact same style, so re-clicking a
 * color never stacks duplicate spans.
 */
export function wrapSelectionInSpan(text: string, from: number, to: number, css: string): SpanEditResult {
  if (!(from < to)) return { text, from, to, applied: false }
  const [prop, value] = splitCss(css)
  if (!prop || !value) return { text, from, to, applied: false }
  // Never wrap across a newline or at the start of a block (list item, heading,
  // blockquote, fenced code, raw HTML): markdown-it renders that inner markdown
  // as raw HTML text, which breaks list markers and block structure.
  if (/[\r\n]/.test(text.slice(from, to))) return { text, from, to, applied: false }
  if (isBlockStart(text, from)) return { text, from, to, applied: false }
  for (const s of parseStyledSpans(text)) {
    if (s.open <= from && to <= s.close && spanStyleMap(text.slice(s.open, s.openEnd)).get(prop) === value) {
      return { text, from, to, applied: false }
    }
  }
  const cssValue = prop === 'font-family' ? cleanFontFamily(value) : value
  if (!cssValue) return { text, from, to, applied: false }
  const openTag = `<span style="${prop}:${cssValue}">`
  const closeTag = '</span>'
  return {
    text: text.slice(0, from) + openTag + text.slice(from, to) + closeTag + text.slice(to),
    from: from + openTag.length,
    to: to + openTag.length,
    applied: true,
  }
}

/**
 * Removes the given style properties from every `<span>` intersecting the
 * selection. A span that still has other styles after removal keeps its tags
 * (only the style attributes are rewritten); a span that ends up with no
 * style at all is unwrapped entirely. Returns adjusted selection offsets.
 */
export function stripSelectionStyles(text: string, from: number, to: number, props: ReadonlySet<InlineStyleProp>): SpanEditResult {
  if (!(from < to)) return { text, from, to, applied: false }
  interface Edit { start: number; end: number; insert: string }
  const edits: Edit[] = []
  for (const s of parseStyledSpans(text)) {
    if (!(s.open < to && s.close > from)) continue
    const styles = spanStyleMap(text.slice(s.open, s.openEnd))
    const present = [...styles.keys()].filter((p) => props.has(p as InlineStyleProp))
    if (!present.length) continue
    for (const p of present) styles.delete(p)
    if (styles.size === 0) {
      edits.push({ start: s.open, end: s.openEnd, insert: '' })
      edits.push({ start: s.closeStart, end: s.close, insert: '' })
    } else {
      const rebuilt = `<span style="${Array.from(styles.entries()).map(([p, v]) => styleToken(p, v)).join(';')}">`
      edits.push({ start: s.open, end: s.openEnd, insert: rebuilt })
    }
  }
  if (!edits.length) return { text, from, to, applied: false }
  // Build the rewritten document by applying edits back-to-front so their
  // offsets stay valid, then map the selection through the same edits (front
  // to back): endpoints before an edit are untouched, endpoints after a
  // deletion/replacement shift by its length delta, and endpoints landing
  // inside a removed tag collapse onto the tag's leading boundary.
  edits.sort((a, b) => b.start - a.start)
  let next = text
  for (const e of edits) {
    next = next.slice(0, e.start) + e.insert + next.slice(e.end)
  }
  const asc = [...edits].sort((a, b) => a.start - b.start)
  const mapPos = (pos: number): number => {
    let acc = 0
    for (const e of asc) {
      if (pos >= e.end) acc += e.insert.length - (e.end - e.start)
      else if (pos >= e.start) return e.start + acc
    }
    return pos + acc
  }
  return { text: next, from: Math.max(0, mapPos(from)), to: Math.max(0, mapPos(to)), applied: true }
}

let configured = false

/**
 * One-time global md-editor-rt setup so a bare YouTube link on its own line
 * renders as a real playable iframe, images honor the kcs-* size/float DSL,
 * and per-selection rich text renders from its compact [[…]] tokens — all in
 * both the admin editor's live preview and the member-facing MdPreview.
 * Matching what the old custom react-markdown renderer used to do, now done
 * via markdown-it's own renderer rules so MdEditor/MdPreview stay the single
 * source of truth for everything else (headings, tables, code blocks, images).
 */
export function configureMarkdownEditor(): void {
  if (configured) return
  configured = true

  config({
    markdownItConfig(md) {
      applyYouTubeEmbedRule(md)
      applyImageLayoutRule(md)
      applyRichTextRule(md)
    },
  })
}

/* ---------------------------------------------------------------------------
 * Preview sanitization
 *
 * md-editor-rt's default `sanitize` (applied to the rendered preview HTML)
 * is the identity function — raw author HTML (including pasted <script>,
 * onerror handlers or javascript: URLs) would be injected into previews and
 * published reading views. The editor emits raw inline HTML for rich-text
 * spans (<span style="color|background|font…">, <sup>, <mark>…) which are
 * part of the markdown authoring format, plus the kcs-* layout markup the
 * renderer rules above produce. `sanitizeRichHtml` allowlists exactly that
 * surface and strips everything else. It runs client-side (MdEditor/MdPreview
 * are both ssr:false).
 * ------------------------------------------------------------------------- */

const SAFE_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption',
  'span', 'mark', 'sup', 'sub', 'strong', 'em', 'u', 's', 'del', 'b', 'i', 'code', 'br',
  'a', 'img', 'div', 'iframe',
])

/** Tags that may carry an inline `style` attribute (the only way markdown stores colors/fonts). */
const SAFE_STYLE_TAGS = new Set(['span', 'mark', 'sup', 'sub', 'u', 's', 'del', 'b', 'i', 'code', 'img', 'a', 'div'])

/** Contributors' own classes plus what the renderer rules / task-list plugin emit. */
const SAFE_CLASS_RE = /^(kcs-|md-)[a-zA-Z0-9_-]*$|^(contains-task-list|task-list-item)$|^language-[a-zA-Z0-9+_-]+$|^[a-z0-9]+-mermaid$|^katex[a-zA-Z0-9_-]*$/

const SAFE_STYLE_PROPS = new Set([
  'color', 'background-color', 'font-family', 'font-size', 'font-style', 'font-weight',
  'text-decoration', 'text-align', 'line-height', 'width', 'max-width', 'height', 'float',
  'margin', 'box-sizing', 'border-radius', 'display',
])

/** Covers hex colors, named colors, rgb()/rgba()/hsl()/hsla() and simple lengths; rejects url(), expression(). */
const SAFE_CSS_VALUE_RE = /^[\w\s.#%(),"'/+:-]+$/
const FONT_FAMILY_RE = /^[\w\s,"'-]+$/

function sanitizeStyleValue(prop: string, value: string): boolean {
  if (!SAFE_CSS_VALUE_RE.test(value)) return false
  if (prop === 'font-family') return FONT_FAMILY_RE.test(value)
  if (/\burl\s*\(|expression\s*\(|javascript:|@import|behavior|progid:/i.test(value)) return false
  return true
}

function sanitizeStyle(el: Element): string {
  try {
    const style = (el as HTMLElement).style
    const out: string[] = []
    for (let i = 0; i < style.length; i++) {
      const prop = style.item(i).toLowerCase()
      if (!SAFE_STYLE_PROPS.has(prop)) continue
      const value = style.getPropertyValue(prop).trim()
      if (!value || !sanitizeStyleValue(prop, value)) continue
      out.push(`${prop}: ${value}`)
    }
    if (!out.length) return ''
    // Browsers re-serialize font-family values from CSSOM WITH quotes; those
    // must stay valid inside the double-quoted style attribute, so escape
    // them here (and the ampersands cssNormalizers may introduce).
    return `style="${out.join('; ').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`
  } catch {
    return ''
  }
}

function attrValue(el: Element, name: string): string | null {
  const v = el.getAttribute(name)
  return v == null ? null : v.trim()
}

/** Keeps only allowlisted class tokens (safe classes can appear together, e.g. "kcs-img kcs-img-center"). */
function safeClass(v: string): string {
  const tokens = v.split(/\s+/).filter((c) => SAFE_CLASS_RE.test(c))
  return tokens.join(' ')
}

const isHttpUrl = (u: string) => /^https?:\/\/[^\s"'<>]+$/i.test(u)
const isYoutubeEmbed = (u: string) => /^https:\/\/www\.youtube\.com\/embed\/[\w-]{6,}$/i.test(u)
const isInt = (u: string | null) => !!u && /^\d{1,4}$/.test(u)

/** Serializes a parsed node as sanitized HTML. Node constants kept as literals so the sanitizer runs in any DOM (jsdom/happy-dom/browser). */
function sanitizeNode(node: Node): string {
  if (node.nodeType === 3) return node.textContent ?? ''
  if (node.nodeType !== 1) return ''
  const el = node as Element
  const tag = el.tagName.toLowerCase()

  if (!SAFE_TAGS.has(tag)) return ''
  if (tag === 'script' || tag === 'style') return ''

  const attrs: string[] = []
  const klass = attrValue(el, 'class')
  const klassSafe = klass && klass.trim() ? safeClass(klass) : ''

  if (tag === 'iframe') {
    const src = attrValue(el, 'src') ?? ''
    if (!isYoutubeEmbed(src)) return ''
    attrs.push(`src="${src}"`)
    const title = attrValue(el, 'title')
    if (title) attrs.push(`title="${title.replace(/"/g, '&quot;')}"`)
    attrs.push('allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"')
    attrs.push('allowfullscreen="true"')
  } else if (tag === 'a') {
    const href = attrValue(el, 'href') ?? ''
    if (!/^(https?:|mailto:)/i.test(href)) return sanitizeChildren(el)
    attrs.push(`href="${href.replace(/["']/g, '')}"`)
    attrs.push('target="_blank" rel="noopener noreferrer"')
    const title = attrValue(el, 'title')
    if (title) attrs.push(`title="${title.replace(/"/g, '&quot;')}"`)
  } else if (tag === 'img') {
    const src = attrValue(el, 'src') ?? ''
    if (!isHttpUrl(src)) return ''
    attrs.push(`src="${src}"`)
    const alt = attrValue(el, 'alt')
    if (alt) attrs.push(`alt="${alt.replace(/"/g, '&quot;')}"`)
    const title = attrValue(el, 'title')
    if (title) attrs.push(`title="${title.replace(/"/g, '&quot;')}"`)
    if (isInt(attrValue(el, 'width'))) attrs.push(`width="${el.getAttribute('width')}"`)
    if (isInt(attrValue(el, 'height'))) attrs.push(`height="${el.getAttribute('height')}"`)
  } else if (tag === 'th' || tag === 'td') {
    if (isInt(attrValue(el, 'colspan'))) attrs.push(`colspan="${el.getAttribute('colspan')}"`)
    if (isInt(attrValue(el, 'rowspan'))) attrs.push(`rowspan="${el.getAttribute('rowspan')}"`)
  }

  const styleAttr = SAFE_STYLE_TAGS.has(tag) ? sanitizeStyle(el) : ''
  if (styleAttr) attrs.push(styleAttr)
  if (klassSafe) attrs.push(`class="${klassSafe}"`)

  const attrStr = attrs.length ? ` ${attrs.join(' ')}` : ''
  const inner = sanitizeChildren(el)
  if (tag === 'br' || tag === 'hr') return `<${tag}${attrStr}>`
  return `<${tag}${attrStr}>${inner}</${tag}>`
}

function sanitizeChildren(el: Element): string {
  let out = ''
  for (const child of el.childNodes) out += sanitizeNode(child)
  return out
}

/**
 * Strict allowlist sanitizer applied to the rendered markdown HTML in both
 * the editor preview and the published reading views. Keeps rich-text
 * inline spans (color/background/font — the markdown authoring format),
 * structural blocks, the kcs-* layout markup, Cloudinary images and the
 * YouTube embed, and drops everything else (scripts, event handlers,
 * javascript: URLs, arbitrary style).
 */
export function sanitizeRichHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return sanitizeChildren(doc.body)
}
