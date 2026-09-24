'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import 'md-editor-rt/lib/style.css'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Image as ImageIcon, SpellCheck2, X } from 'lucide-react'
import { StateEffect } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import type { ExposeParam } from 'md-editor-rt'
import { configureMarkdownEditor, encodeDocumentStyle, encodeImgLayout, parseDocumentStyle, parseImgLayout, type DocumentAlign, type ImgLayout } from './markdown-editor-config'
import { cmSpellDecorations, setSpellMisspellings, spellcheckContentAttributes } from './spellcheck/cm-spellcheck'
import { normalizeWord, scanSpellIssues, suggestFor, type SpellIssue, type SpellLanguage } from './spellcheck/spellchecker'

const MdEditor = dynamic(() => import('md-editor-rt').then((m) => m.MdEditor), { ssr: false })

configureMarkdownEditor()

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
  /**
   * Language code driving native spellcheck and (for EN/FR) the offline
   * dictionary checker. Accepts the article/resource codes (EN, FR, RW, SW,
   * HE, GR, LA, AR, PT, ES, ...). Offline checking is active for EN and FR;
   * every other code relies on the browser's native spellcheck only.
   */
  language?: string
}

const SPELL_LOCALE: Record<string, string> = {
  EN: 'en-US',
  FR: 'fr-FR',
  RW: 'rw-RW',
  SW: 'sw-KE',
  PT: 'pt-BR',
  ES: 'es-ES',
  HE: 'he',
  GR: 'el',
  LA: 'la',
  AR: 'ar',
}

/** Matches `![alt](url "title")` — title may be in single or double quotes. */
const IMG_RE = /!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+(["'])([\s\S]*?)\3)?\s*\)/g

interface FoundImage {
  alt: string
  url: string
  title: string
  raw: string
  /** Global character offset of the matched markdown segment in the document. */
  offset: number
}

function scanImages(value: string): FoundImage[] {
  const out: FoundImage[] = []
  const re = new RegExp(IMG_RE.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(value))) {
    out.push({ alt: m[1], url: m[2], title: m[4] ?? '', raw: m[0], offset: m.index })
  }
  return out
}

function replaceAt(value: string, start: number, end: number, next: string): string {
  return value.slice(0, start) + next + value.slice(end)
}

type AlignOption = ImgLayout['align']

const ALIGN_OPTIONS: { value: AlignOption; label: string; icon: typeof AlignLeft }[] = [
  { value: 'none', label: 'Block', icon: AlignJustify },
  { value: 'left', label: 'Text right of image', icon: AlignLeft },
  { value: 'right', label: 'Text left of image', icon: AlignRight },
  { value: 'center', label: 'Centered', icon: AlignCenter },
]

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Garamond', value: 'Garamond, "EB Garamond", serif' },
  { label: 'Palatino', value: '"Palatino Linotype", Palatino, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
]

const FONT_SIZES = [
  { label: 'Default', value: '' },
  { label: '12px', value: '12px' },
  { label: '13px', value: '13px' },
  { label: '14px', value: '14px' },
  { label: '15px', value: '15px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '22px', value: '22px' },
  { label: '24px', value: '24px' },
]

const EDITOR_ALIGNMENTS: { value: DocumentAlign; label: string; icon: typeof AlignLeft }[] = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
  { value: 'justify', label: 'Justify', icon: AlignJustify },
]

/**
 * A real book lets the author place an image where they want and wrap the
 * prose around it: size + alignment picker for any image already in the
 * document. Rewrites the image's markdown title to the kcs-* layout DSL
 * (see markdown-editor-config.ts), which the shared renderer reads to emit
 * a centered block or a text-wrapping float in both the editor preview and
 * the member reader.
 */
function ImageLayoutDialog({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const images = scanImages(value)
  const [selected, setSelected] = useState(0)
  const [layout, setLayout] = useState<ImgLayout>(() => parseImgLayout(images[selected]?.title))

  const pick = (i: number) => {
    setSelected(i)
    setLayout(parseImgLayout(images[i].title))
  }

  const apply = () => {
    const target = images[selected]
    if (!target) return
    onChange(replaceAt(value, target.offset, target.offset + target.raw.length, encodeImgLayout(target.alt, target.url, layout)))
  }

  return (
    <div className="kcs-img-layout fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-w-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-cinzel text-sm font-bold uppercase tracking-widest text-w-950">Image size &amp; alignment</h4>
          <button type="button" onClick={onClose} aria-label="Close image layout" className="text-w-600 hover:text-w-950 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {images.length === 0 ? (
          <p className="font-lato text-sm text-w-700">
            No images in this document yet. Upload one with the <ImageIcon size={12} className="inline-block align-[-2px]" /> image toolbar button, or paste an image, then open this again.
          </p>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {images.map((img, i) => (
                <button
                  key={`${img.offset}-${img.url}`}
                  type="button"
                  onClick={() => pick(i)}
                  title={img.alt || img.url}
                  className={`relative shrink-0 w-16 h-12 rounded overflow-hidden border-2 cursor-pointer transition ${i === selected ? 'border-w-600 shadow-md' : 'border-w-300 hover:border-w-400'}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute top-0.5 left-1 text-[9px] font-lato font-bold text-white bg-black/50 rounded px-1">{i + 1}</span>
                </button>
              ))}
            </div>

            <div className="mb-3">
              <p className="font-lato text-xs font-semibold text-w-800 mb-1.5">Alignment</p>
              <div className="grid grid-cols-4 gap-2">
                {ALIGN_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLayout((l) => ({ ...l, align: opt.value }))}
                      className={`flex flex-col items-center gap-1 rounded border px-1 py-2 text-[11px] font-lato cursor-pointer transition ${
                        layout.align === opt.value ? 'border-w-600 bg-w-100 text-w-950 font-semibold' : 'border-w-300 text-w-700 hover:border-w-400'
                      }`}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-lato text-xs font-semibold text-w-800">Width</p>
                <span className="font-lato text-xs text-w-600">{layout.width}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={layout.width}
                onChange={(e) => setLayout((l) => ({ ...l, width: Number(e.target.value) }))}
                className="w-full accent-w-950"
              />
              <p className="font-lato text-[11px] text-w-600 mt-1">
                {layout.align === 'left' || layout.align === 'right'
                  ? 'The image floats beside the paragraph and your text wraps around it — like a real book.'
                  : layout.align === 'center'
                    ? 'The image stands alone in the middle of the page at this width.'
                    : 'The image sits on its own line at this width.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-w-200">
              <span className="font-lato text-[11px] text-w-600">Image {selected + 1} of {images.length}</span>
              <div className="flex gap-2">
                <button type="button" onClick={apply} className="rounded-lg bg-w-950 text-white px-4 py-1.5 text-xs font-lato font-semibold hover:opacity-90 transition cursor-pointer">
                  Apply
                </button>
                <button type="button" onClick={onClose} className="rounded-lg border border-w-300 text-w-800 px-4 py-1.5 text-xs font-lato hover:bg-w-100 transition cursor-pointer">
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Real markdown authoring editor with:
 * - Spellcheck enabled on the CodeMirror input area
 * - Font family picker (Times New Roman, Georgia, etc.)
 * - Font size picker
 * - Image size & alignment dialog
 *
 * Font family/size apply to the editor preview only (what the author sees
 * while writing). The reader-side MarkdownContent uses its own CSS — to
 * persist font choices into the published output, the author should set
 * paragraph alignment via the alignment toolbar in the article/chapter form.
 */
export function MarkdownEditor({ value, onChange, height = 360, language = 'EN' }: MarkdownEditorProps) {
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [spellOpen, setSpellOpen] = useState(false)
  const [spellIssues, setSpellIssues] = useState<SpellIssue[]>([])
  const initialStyle = parseDocumentStyle(value).style
  const [fontFamily, setFontFamily] = useState(initialStyle.fontFamily ?? '')
  const [fontSize, setFontSize] = useState(initialStyle.fontSize ?? '')
  const [align, setAlign] = useState<DocumentAlign>(initialStyle.align ?? 'left')
  const editorRef = useRef<HTMLDivElement>(null)
  const mdEditorRef = useRef<ExposeParam | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const cmReadyRef = useRef(false)
  const contentRef = useRef(parseDocumentStyle(value).content)
  const ignoreRef = useRef<ReadonlySet<string>>(new Set())
  const scanTimerRef = useRef<number | undefined>(undefined)

  const locale = SPELL_LOCALE[language] ?? (language.length === 2 ? language.toLowerCase() : 'en-US')
  /** Offline dictionary checking covers English and French; other languages use native spellcheck only. */
  const spellLang: SpellLanguage = language === 'FR' ? 'FR' : 'EN'
  const offlineActive = language === 'EN' || language === 'FR'

  // Restore the per-language ignore list from localStorage once per locale.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`kcs:spellignore:${locale}`)
      ignoreRef.current = raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    } catch {
      ignoreRef.current = new Set()
    }
  }, [locale])

  // CodeMirror hard-codes `spellcheck="false"`/`autocorrect="off"` on every
  // content refresh, which is why a MutationObserver can never win. We append
  // the real contentAttributes facet through the editor's own view instead.
  useEffect(() => {
    const attach = (): boolean => {
      const view = mdEditorRef.current?.getEditorView?.()
      if (!view) return false
      if (!cmReadyRef.current) {
        view.dispatch({ effects: StateEffect.appendConfig.of([cmSpellDecorations, spellcheckContentAttributes(locale)]) })
        cmReadyRef.current = true
      } else {
        // Language switched — re-assert native spellcheck on the new locale.
        view.dispatch({ effects: StateEffect.appendConfig.of([spellcheckContentAttributes(locale)]) })
      }
      viewRef.current = view
      const doc = view.state.doc.toString()
      contentRef.current = doc
      if (offlineActive) {
        const issues = scanSpellIssues(doc, ignoreRef.current, spellLang)
        view.dispatch({ effects: setSpellMisspellings.of(issues.map((i) => ({ from: i.start, to: i.end }))) })
        setSpellIssues(issues)
      } else {
        // Non-dictionary language: clear any squiggles left from a previous pass.
        view.dispatch({ effects: setSpellMisspellings.of([]) })
        setSpellIssues([])
      }
      return true
    }
    if (attach()) return
    const poll = window.setInterval(() => {
      if (attach()) window.clearInterval(poll)
    }, 80)
    const stop = window.setTimeout(() => window.clearInterval(poll), 6000)
    return () => {
      window.clearInterval(poll)
      window.clearTimeout(stop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  // Re-sync decorations when the value changes externally (e.g. the parent
  // modal switches to another article). Echoes of our own keystrokes already
  // match contentRef and are skipped.
  useEffect(() => {
    const doc = parseDocumentStyle(value).content
    if (doc === contentRef.current) return
    const view = viewRef.current
    contentRef.current = doc
    if (view && cmReadyRef.current && offlineActive) {
      const issues = scanSpellIssues(doc, ignoreRef.current, spellLang)
      view.dispatch({ effects: setSpellMisspellings.of(issues.map((i) => ({ from: i.start, to: i.end }))) })
      window.clearTimeout(scanTimerRef.current)
      scanTimerRef.current = window.setTimeout(() => setSpellIssues(issues), 320)
    }
  }, [value, offlineActive, spellLang])

  const applyStyle = (next: { fontFamily?: string; fontSize?: string; align?: DocumentAlign }) => {
    const style = { fontFamily, fontSize, align, ...next }
    setFontFamily(style.fontFamily ?? '')
    setFontSize(style.fontSize ?? '')
    setAlign(style.align ?? 'left')
    onChange(encodeDocumentStyle(value, style))
  }

  const previewStyle = [
    fontFamily ? `font-family: ${fontFamily} !important;` : '',
    fontSize ? `font-size: ${fontSize} !important;` : '',
  ].filter(Boolean).join(' ')

  const handleEditorChange = (next: string) => {
    contentRef.current = next
    const view = viewRef.current
    if (view && cmReadyRef.current && offlineActive) {
      const issues = scanSpellIssues(next, ignoreRef.current, spellLang)
      view.dispatch({ effects: setSpellMisspellings.of(issues.map((i) => ({ from: i.start, to: i.end }))) })
    }
    window.clearTimeout(scanTimerRef.current)
    scanTimerRef.current = window.setTimeout(() => {
      if (offlineActive) setSpellIssues(scanSpellIssues(contentRef.current, ignoreRef.current, spellLang))
    }, 350)
    onChange(encodeDocumentStyle(next, { fontFamily, fontSize, align }))
  }

  const persistIgnore = (next: ReadonlySet<string>) => {
    try {
      window.localStorage.setItem(`kcs:spellignore:${locale}`, JSON.stringify([...next]))
    } catch {
      // Storage disabled — ignore set still lives for this session.
    }
  }

  const ignoreWord = (word: string) => {
    const next = new Set(ignoreRef.current)
    next.add(word)
    ignoreRef.current = next
    const view = viewRef.current
    const doc = view ? view.state.doc.toString() : contentRef.current
    if (view && cmReadyRef.current && offlineActive) {
      const issues = scanSpellIssues(doc, next, spellLang)
      view.dispatch({ effects: setSpellMisspellings.of(issues.map((i) => ({ from: i.start, to: i.end }))) })
    }
    setSpellIssues(scanSpellIssues(doc, next, spellLang).filter((i) => normalizeWord(i.word) !== word))
    persistIgnore(next)
  }

  const replaceAll = (word: string, replacement: string) => {
    const view = viewRef.current
    const doc = view ? view.state.doc.toString() : contentRef.current
    const positions = scanSpellIssues(doc, new Set(), spellLang)
      .filter((i) => normalizeWord(i.word) === word)
      // Replace in reverse order so earlier offsets stay valid.
      .sort((a, b) => b.start - a.start)
      .map((i) => ({ from: i.start, to: i.end, insert: replacement }))
    if (!positions.length) return
    if (view) {
      view.dispatch({ changes: positions })
    } else {
      let next = doc
      for (const p of positions) next = next.slice(0, p.from) + replacement + next.slice(p.to)
      handleEditorChange(next)
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, { count: number; word: string }>()
    for (const issue of spellIssues) {
      const key = normalizeWord(issue.word)
      const existing = map.get(key)
      if (existing) existing.count += 1
      else map.set(key, { count: 1, word: issue.word })
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
  }, [spellIssues])

  const suggestions = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!offlineActive || !spellOpen) return map
    for (const [word] of groups.slice(0, 40)) map.set(word, suggestFor(word, 4, spellLang))
    return map
  }, [groups, spellOpen, offlineActive, spellLang])

  return (
    <>
      <style>{`
        .md-editor-preview .kcs-img { max-width: 100%; border-radius: 8px; display: block; margin: 14px 0; }
        .md-editor-preview .kcs-img-center { margin-left: auto; margin-right: auto; }
        .md-editor-preview .kcs-img-wrap { box-sizing: border-box; }
        .md-editor-preview .kcs-img-wrap .kcs-img { width: 100%; height: auto; margin: 0; }
        .md-editor-preview :is(h1,h2,h3,h4,h5,table,blockquote,pre,ul,ol,hr) { clear: both; }
        .md-editor-preview img:not(.kcs-img) { max-width: 100%; }
        /* Keep the editor readable while the browser draws its native spelling underline. */
        .md-editor .cm-content { text-decoration: none; }
        .md-editor .cm-line .kcs-spell-error { text-decoration: underline wavy #e11d48; text-decoration-skip-ink: none; text-underline-offset: 2px; }
        ${previewStyle ? `.md-editor-preview { ${previewStyle} }` : ''}
      `}</style>

      {/* Font family + size toolbar row */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="font-lato text-xs text-w-600 whitespace-nowrap">Font:</label>
          <select
            value={fontFamily}
            onChange={(e) => applyStyle({ fontFamily: e.target.value })}
            className="font-lato text-xs border border-w-300 rounded px-2 py-1 bg-white text-w-950 focus:outline-none focus:border-w-500 cursor-pointer"
            aria-label="Font family"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.label} value={f.value} style={{ fontFamily: f.value || undefined }}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="font-lato text-xs text-w-600 whitespace-nowrap">Size:</label>
          <select
            value={fontSize}
            onChange={(e) => applyStyle({ fontSize: e.target.value })}
            className="font-lato text-xs border border-w-300 rounded px-2 py-1 bg-white text-w-950 focus:outline-none focus:border-w-500 cursor-pointer"
            aria-label="Font size"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.label} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="font-lato text-xs text-w-600 whitespace-nowrap">Paragraph:</label>
          <select
            value={align}
            onChange={(e) => applyStyle({ align: e.target.value as DocumentAlign })}
            className="font-lato text-xs border border-w-300 rounded px-2 py-1 bg-white text-w-950 focus:outline-none focus:border-w-500 cursor-pointer"
            aria-label="Paragraph alignment"
          >
            {EDITOR_ALIGNMENTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        {offlineActive && (
          <button
            type="button"
            onClick={() => setSpellOpen((open) => !open)}
            aria-pressed={spellOpen}
            className={`flex items-center gap-1 font-lato text-xs px-2 py-1 rounded border cursor-pointer transition ${
              spellOpen ? 'border-w-600 bg-w-100 text-w-950 font-semibold' : 'border-w-300 text-w-700 hover:border-w-400'
            }`}
            title="Open spelling report"
          >
            <SpellCheck2 size={14} />
            Spelling
            {spellIssues.length > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {spellIssues.length}
              </span>
            )}
          </button>
        )}
        <span className="font-lato text-[10px] text-w-500 italic">
          {offlineActive ? `Spellcheck + offline ${spellLang === 'FR' ? 'French' : 'English'} dictionary active` : 'Native spellcheck for the selected language'}
        </span>
      </div>

      {spellOpen && offlineActive && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50/60 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-100">
            <p className="font-lato text-xs font-semibold text-red-800 flex items-center gap-1.5">
              <SpellCheck2 size={13} />
              Spelling — {spellIssues.length} issue{spellIssues.length === 1 ? '' : 's'}
            </p>
            <button type="button" onClick={() => setSpellOpen(false)} aria-label="Close spelling report" className="text-w-600 hover:text-w-950 transition cursor-pointer">
              <X size={14} />
            </button>
          </div>
          {groups.length === 0 ? (
            <p className="px-3 py-2 font-lato text-xs text-w-700">No spelling issues found in this document.</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto divide-y divide-red-100">
              {groups.slice(0, 60).map(([word, group]) => (
                <li key={word} className="flex items-start gap-2 px-3 py-1.5 flex-wrap">
                  <code className="font-lato text-xs font-bold text-red-700 mt-0.5">{group.word}</code>
                  <span className="font-lato text-[10px] text-w-500 mt-1">×{group.count}</span>
                  <div className="flex flex-wrap gap-1">
                    {(suggestions.get(word) ?? []).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => replaceAll(word, s)}
                        className="font-lato text-[11px] px-2 py-0.5 rounded border border-w-300 bg-white text-w-900 hover:border-w-500 cursor-pointer transition"
                        title={`Replace every “${group.word}” with “${s}”`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => ignoreWord(word)}
                    className="ml-auto font-lato text-[11px] px-2 py-0.5 rounded border border-w-300 bg-white text-w-700 hover:border-w-500 cursor-pointer transition"
                    title={`Ignore “${group.word}” for this session`}
                  >
                    Ignore
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="px-3 py-1.5 font-lato text-[10px] text-w-500 border-t border-red-100">
            {spellLang === 'FR'
              ? 'Offline French dictionary with the browser’s own spellcheck. Click a suggestion to replace every occurrence; Ignore silences a word for this session.'
              : 'Offline English dictionary with the browser’s own spellcheck. Click a suggestion to replace every occurrence; Ignore silences a word for this session.'}
          </p>
        </div>
      )}

      <div ref={editorRef}>
        <MdEditor
          ref={mdEditorRef}
          modelValue={parseDocumentStyle(value).content}
          onChange={handleEditorChange}
          language={locale}
          style={{ height }}
          defToolbars={[
          <button
            key="kcs-img-layout"
            type="button"
            title="Image size & alignment"
            aria-label="Set image size and alignment"
            onClick={() => setLayoutOpen(true)}
            className="flex h-full items-center px-2 cursor-pointer hover:opacity-75"
          >
            <ImageIcon size={16} />
          </button>,
          ]}
          onUploadImg={async (files, callback) => {
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
          if (!cloudName || !uploadPreset) {
            throw new Error('Cloudinary is not configured (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)')
          }
          const uploaded = await Promise.all(
            files.map(async (file) => {
              const formData = new FormData()
              formData.append('file', file)
              formData.append('upload_preset', uploadPreset)
              formData.append('folder', 'kcs-resources/image')
              const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
              const json = await res.json()
              if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? 'Upload failed')
              return json.secure_url as string
            })
          )
          callback(uploaded)
          }}
        />
      </div>
      {layoutOpen && <ImageLayoutDialog value={value} onChange={onChange} onClose={() => setLayoutOpen(false)} />}
    </>
  )
}
