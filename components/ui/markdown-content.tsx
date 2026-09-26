'use client'

import dynamic from 'next/dynamic'
import 'md-editor-rt/lib/preview.css'
import { configureMarkdownEditor, parseDocumentStyle, sanitizeRichHtml, type DocumentAlign } from './markdown-editor-config'

const MdPreview = dynamic(() => import('md-editor-rt').then((m) => m.MdPreview), { ssr: false })

configureMarkdownEditor()

/**
 * Renders real lesson markdown through md-editor-rt's own MdPreview — the
 * exact renderer the admin editor (components/ui/markdown-editor.tsx) uses
 * for its live preview, so what an author sees while writing is what a
 * member sees while learning. A bare YouTube link on its own line still
 * renders as a real embedded <iframe> player, via the global markdown-it
 * renderer-rule override in markdown-editor-config.ts rather than a
 * per-component React override, since MdPreview renders raw HTML.
 */
export type ParagraphAlign = DocumentAlign

interface MarkdownContentProps {
  markdown: string
  /** Explicit paragraph alignment, such as the article-level setting. */
  align?: ParagraphAlign
}

export function MarkdownContent({ markdown, align }: MarkdownContentProps) {
  const parsed = parseDocumentStyle(markdown)
  const effectiveAlign = align ?? parsed.style.align ?? 'left'
  return (
    <div
      className="kcs-markdown-content"
      style={{
        fontFamily: parsed.style.fontFamily || undefined,
        fontSize: parsed.style.fontSize || undefined,
        textAlign: effectiveAlign,
        lineHeight: parsed.style.lineHeight || undefined,
      }}
    >
      <style>{`
        .kcs-markdown-content .md-editor-preview-wrapper { padding: 0; }
        /* Fix md-editor-rt's word-break: break-all which splits words mid-character.
           word-break: normal keeps whole words together; overflow-wrap handles
           genuinely unbreakable long strings (URLs, etc.) gracefully. */
        .kcs-markdown-content .md-editor-preview { font-size: 15px; color: var(--text-primary); line-height: 1.95; background: transparent; letter-spacing: 0.01em; word-break: normal !important; overflow-wrap: break-word !important; hyphens: none !important; }
        .kcs-markdown-content h1 { font-size: 21px; font-weight: 700; color: var(--text-primary); margin: 24px 0 12px; }
        .kcs-markdown-content h2 { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 22px 0 10px; }
        .kcs-markdown-content h3 { font-size: 15.5px; font-weight: 700; color: var(--gold); margin: 18px 0 8px; }
        .kcs-markdown-content p { margin-bottom: 15px; text-align: ${effectiveAlign}; }
        .kcs-markdown-content ul, .kcs-markdown-content ol { margin-bottom: 15px; padding-left: 22px; }
        /* Tailwind's preflight sets \`list-style: none\` on ol/ul/menu, which erases the
           bullets and numbers; restore them (outside markers sit in the padding above). */
        .kcs-markdown-content ul { list-style: disc outside; }
        .kcs-markdown-content ol { list-style: decimal outside; }
        .kcs-markdown-content ul ul { list-style: circle outside; }
        .kcs-markdown-content ul ul ul { list-style: square outside; }
        .kcs-markdown-content li { margin-bottom: 5px; }
        .kcs-markdown-content li::marker { color: var(--gold); }
        .kcs-markdown-content blockquote { border-left: 3px solid var(--gold); padding-left: 16px; margin: 16px 0; color: var(--text-secondary); font-style: italic; }
        .kcs-markdown-content pre { background: var(--bg-section); border-radius: 6px; padding: 14px; overflow-x: auto; margin-bottom: 16px; }
        .kcs-markdown-content code { font-size: 13px; }
        .kcs-markdown-content table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
        .kcs-markdown-content th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--border); color: var(--text-primary); font-weight: 700; }
        .kcs-markdown-content td { padding: 8px 12px; border-bottom: 1px solid var(--border-light); }
        .kcs-markdown-content a { color: var(--gold); text-decoration: underline; text-underline-offset: 2px; }
        .kcs-markdown-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; display: block; }
        .kcs-markdown-content .kcs-img { border-radius: 8px; }
        .kcs-markdown-content .kcs-img-center { margin-left: auto; margin-right: auto; }
        .kcs-markdown-content .kcs-img-wrap { box-sizing: border-box; }
        .kcs-markdown-content .kcs-img-wrap img { width: 100%; height: auto; margin: 0; display: block; border-radius: 8px; }
        /* Author-set caption under an image (cap= DSL), centered in its column. */
        .kcs-markdown-content .kcs-figure { margin: 16px 0; }
        .kcs-markdown-content .kcs-figure .kcs-img-wrap { max-width: 100%; }
        .kcs-markdown-content .kcs-figure figcaption { font-size: 12px; color: var(--text-secondary); text-align: center; margin-top: 6px; font-style: italic; }
        .kcs-markdown-content .kcs-figure.kcs-figure-left figcaption { text-align: left; }
        .kcs-markdown-content .kcs-figure.kcs-figure-right figcaption { text-align: right; }
        .kcs-markdown-content :is(h1,h2,h3,h4,h5,h6,table,blockquote,pre,ul,ol,hr,figure,p) { clear: both; }
        /* Rich-text spans the editor stores as markdown inline HTML. */
        .kcs-markdown-content u { text-decoration: underline; }
        .kcs-markdown-content s, .kcs-markdown-content del { text-decoration: line-through; }
        .kcs-markdown-content sup { vertical-align: super; font-size: 0.75em; }
        .kcs-markdown-content sub { vertical-align: sub; font-size: 0.75em; }
        .kcs-markdown-content .kcs-video-embed { position: relative; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; margin: 14px 0; }
        .kcs-markdown-content .kcs-video-embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
      `}</style>
      <MdPreview modelValue={parsed.content} sanitize={sanitizeRichHtml} />
    </div>
  )
}
