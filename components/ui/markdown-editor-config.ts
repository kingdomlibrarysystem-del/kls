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
 */
export interface ImgLayout {
  /** left/right float the image so book text wraps around it; center = standalone centered; none = default block. */
  align: 'left' | 'right' | 'center' | 'none'
  /** Width as a percentage of the text column (10–100). */
  width: number
}

export function parseImgLayout(title: string | null | undefined): ImgLayout {
  const t = title ?? ''
  const align = /kcs-(left|right|center)/.exec(t)?.[1] as 'left' | 'right' | 'center' | undefined
  const w = /w(\d+)/.exec(t)?.[1]
  return { align: align ?? 'none', width: w ? Math.min(100, Math.max(10, Number(w))) : 100 }
}

/** Rebuilds a markdown image with the given layout DSL (or plain if default). */
export function encodeImgLayout(alt: string, url: string, layout: ImgLayout): string {
  const parts: string[] = []
  if (layout.align !== 'none') parts.push(`kcs-${layout.align}`)
  if (layout.width < 100) parts.push(`w${layout.width}`)
  if (parts.length === 0) return `![${alt}](${url})`
  return `![${alt}](${url} "${parts.join(' ')}")`
}

export type DocumentAlign = 'left' | 'center' | 'right' | 'justify'

export interface DocumentStyle {
  fontFamily?: string
  fontSize?: string
  align?: DocumentAlign
}

const STYLE_MARKER = /^\s*<!-- kcs-style:(\{.*?\}) -->\s*/

function isDocumentStyle(value: unknown): value is DocumentStyle {
  if (!value || typeof value !== 'object') return false
  const style = value as Record<string, unknown>
  return (style.fontFamily === undefined || (typeof style.fontFamily === 'string' && /^[\w\s,"'-]+$/.test(style.fontFamily)))
    && (style.fontSize === undefined || (typeof style.fontSize === 'string' && /^\d{1,3}px$/.test(style.fontSize)))
    && (style.align === undefined || ['left', 'center', 'right', 'justify'].includes(style.align as string))
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
 * size the author chose on both small and large screens.
 */
export function applyImageLayoutRule(md: MarkdownIt): void {
  md.renderer.rules.image = (tokens, idx, _options, _env, _self) => {
    const token = tokens[idx]
    const src = token.attrGet('src') ?? ''
    const alt = token.content
    const title = token.attrGet('title')
    const { align, width } = parseImgLayout(title)
    const base = `<img src="${esc(src)}" alt="${esc(alt)}"`

    if (align === 'center') {
      return `${base} class="kcs-img kcs-img-center" style="width:${width}%" />`
    }
    if (align === 'left' || align === 'right') {
      const inline = align === 'left' ? 'float:left;margin:4px 16px 12px 0' : 'float:right;margin:4px 0 12px 16px'
      return `<span class="kcs-img-wrap kcs-img-${align}" style="width:${width}%;${inline}">${base} class="kcs-img" /></span>`
    }
    return `${base} class="kcs-img" />`
  }
}

let configured = false

/**
 * One-time global md-editor-rt setup so a bare YouTube link on its own line
 * renders as a real playable iframe AND images honor the kcs-* size/float
 * layout DSL in both the admin editor's live preview and the member-facing
 * MdPreview — matching what the old custom react-markdown renderer used to
 * do, now done via markdown-it's own renderer rules so MdEditor/MdPreview
 * stay the single source of truth for everything else (headings, tables,
 * code blocks, images).
 */
export function configureMarkdownEditor(): void {
  if (configured) return
  configured = true

  config({
    markdownItConfig(md) {
      applyYouTubeEmbedRule(md)
      applyImageLayoutRule(md)
    },
  })
}
