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

let configured = false

/**
 * One-time global md-editor-rt setup so a bare YouTube link on its own line
 * renders as a real playable iframe in both the admin editor's live preview
 * and the member-facing MdPreview — matching what the old custom
 * react-markdown renderer used to do, now done via markdown-it's own
 * renderer rules so MdEditor/MdPreview stay the single source of truth for
 * everything else (headings, tables, code blocks, images).
 */
export function configureMarkdownEditor(): void {
  if (configured) return
  configured = true

  config({
    markdownItConfig(md) {
      applyYouTubeEmbedRule(md)
    },
  })
}
