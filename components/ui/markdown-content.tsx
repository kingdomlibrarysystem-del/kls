'use client'

import dynamic from 'next/dynamic'
import 'md-editor-rt/lib/preview.css'
import { configureMarkdownEditor } from './markdown-editor-config'

const MdPreview = dynamic(() => import('md-editor-rt').then((m) => m.MdPreview), { ssr: false })

configureMarkdownEditor()

interface MarkdownContentProps {
  markdown: string
}

/**
 * Renders real lesson markdown through md-editor-rt's own MdPreview — the
 * exact renderer the admin editor (components/ui/markdown-editor.tsx) uses
 * for its live preview, so what an author sees while writing is what a
 * member sees while learning. A bare YouTube link on its own line still
 * renders as a real embedded <iframe> player, via the global markdown-it
 * renderer-rule override in markdown-editor-config.ts rather than a
 * per-component React override, since MdPreview renders raw HTML.
 */
export function MarkdownContent({ markdown }: MarkdownContentProps) {
  return (
    <div className="kcs-markdown-content">
      <style>{`
        .kcs-markdown-content .md-editor-preview-wrapper { padding: 0; }
        .kcs-markdown-content .md-editor-preview { font-size: 13px; color: var(--text-secondary); line-height: 1.7; background: transparent; }
        .kcs-markdown-content h1 { font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 20px 0 10px; }
        .kcs-markdown-content h2 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 18px 0 8px; }
        .kcs-markdown-content h3 { font-size: 14px; font-weight: 700; color: var(--gold); margin: 14px 0 6px; }
        .kcs-markdown-content p { margin-bottom: 12px; }
        .kcs-markdown-content ul, .kcs-markdown-content ol { margin-bottom: 12px; padding-left: 20px; }
        .kcs-markdown-content li { margin-bottom: 4px; }
        .kcs-markdown-content blockquote { border-left: 3px solid var(--gold); padding-left: 14px; margin: 14px 0; color: var(--text-muted); font-style: italic; }
        .kcs-markdown-content pre { background: var(--bg-section); border-radius: 6px; padding: 12px; overflow-x: auto; margin-bottom: 14px; }
        .kcs-markdown-content code { font-size: 12px; }
        .kcs-markdown-content table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px; }
        .kcs-markdown-content th { text-align: left; padding: 6px 10px; border-bottom: 2px solid var(--border); color: var(--text-primary); font-weight: 700; }
        .kcs-markdown-content td { padding: 6px 10px; border-bottom: 1px solid var(--border-light); }
        .kcs-markdown-content a { color: var(--gold); }
        .kcs-markdown-content img { max-width: 100%; border-radius: 8px; margin: 14px 0; display: block; }
        .kcs-markdown-content .kcs-video-embed { position: relative; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; margin: 14px 0; }
        .kcs-markdown-content .kcs-video-embed iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
      `}</style>
      <MdPreview modelValue={markdown} />
    </div>
  )
}
