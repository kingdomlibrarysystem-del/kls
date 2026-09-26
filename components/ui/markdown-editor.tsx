'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import 'md-editor-rt/lib/style.css'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Eraser, Highlighter, Image as ImageIcon, Minus, Palette, Pencil, SpellCheck2, X } from 'lucide-react'
import { StateEffect } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import type { ExposeParam } from 'md-editor-rt'
import { configureMarkdownEditor, encodeDocumentStyle, encodeImgLayout, parseDocumentStyle, parseImgLayout, sanitizeRichHtml, stripSelectionStyles, wrapSelectionInSpan, type DocumentAlign, type DocumentStyle, type ImgLayout, type InlineStyleProp, type SpanEditResult } from './markdown-editor-config'
import { DrawingDialog } from './markdown-editor-drawing'
import { cmSpellDecorations, setSpellMisspellings, spellcheckContentAttributes } from './spellcheck/cm-spellcheck'
import { normalizeWord, occurrencesOfRawWord, suggestFor, type SpellIssue, type SpellLanguage } from './spellcheck/spellchecker'
import { runSpellingCheck, type SpellSource } from './spellcheck/online-spellcheck'

const MdEditor = dynamic(() => import('md-editor-rt').then((m) => m.MdEditor), { ssr: false })

configureMarkdownEditor()

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
  /**
   * Language code driving native spellcheck and (for EN/FR) the dictionary
   * checker — online professional dictionary first (LanguageTool), with the
   * bundled offline dictionary as an automatic fallback. Accepts the
   * article/resource codes (EN, FR, RW, SW, HE, GR, LA, AR, PT, ES, ...).
   * Dictionary checking is active for EN and FR; every other code relies on
   * the browser's native spellcheck only.
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
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
]

const TEXT_COLORS = ['#111827', '#374151', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#2563eb', '#7c3aed', '#db2777']

const TEXT_HIGHLIGHTS = ['#fef08a', '#fde68a', '#fed7aa', '#fbcfe8', '#fca5a5', '#bbf7d0', '#a7f3d0', '#bae6fd', '#c7d2fe', '#ddd6fe']

const CLEAR_FORMAT_PROPS: ReadonlySet<InlineStyleProp> = new Set(['color', 'background-color', 'font-family', 'font-size'])

const EDITOR_ALIGNMENTS: { value: DocumentAlign; label: string; icon: typeof AlignLeft }[] = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
  { value: 'justify', label: 'Justify', icon: AlignJustify },
]

/**
 * Unwraps the transient rich-text DSL tokens (`[[c:…|text]]`, `[[h:…|text]]`,
 * `[[ff:…|text]]`, `[[fs:…|text]]`) that leaked into a few drafts while the
 * experimental per-selection toolbar existed. New authoring never produces
 * them; unwrapping keeps the editor source clean and the drafts editable.
 * Legacy inline-HTML spans from earlier authoring are left untouched.
 */
const RICH_DSL_TOKEN_RE = /\[\[(?:c|h|ff|fs):[^|\]\n]*\|([^\]\n]*)\]\]/gu
function unwrapRichDslTokens(text: string): string {
  return text.replace(RICH_DSL_TOKEN_RE, '$1')
}

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
 * Toolbar dropdown (color / highlight) that applies to the text selected in
 * the editor. The popover opens upward from the bottom toolbar and offers
 * preset swatches, a custom color input, and "remove" for that property.
 * Disabled until the author actually selects text in the editor.
 */
function StyleDropButton({
  kind,
  disabled,
  onPick,
  onRemove,
}: {
  kind: 'color' | 'highlight'
  disabled: boolean
  onPick: (value: string) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const Icon = kind === 'color' ? Palette : Highlighter
  const presets = kind === 'color' ? TEXT_COLORS : TEXT_HIGHLIGHTS
  const label = kind === 'color' ? 'Text color' : 'Highlight'
  const styleProp = kind === 'color' ? 'color' : 'background-color'
  return (
    <div className="relative flex items-center">
      <button
        type="button"
        title={disabled ? `${label} — select text in the editor first` : label}
        aria-label={label}
        aria-pressed={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-full items-center px-2 hover:opacity-75 transition ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Icon size={16} style={open ? { [styleProp]: '#0f172a' } : undefined} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[69]" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 z-[70] w-max max-w-56 rounded-lg border border-w-200 bg-white p-2 shadow-xl">
            <div className="grid grid-cols-5 gap-1.5">
              {presets.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={`${label} ${c}`}
                  onClick={() => { onPick(c); setOpen(false) }}
                  className="h-6 w-6 rounded-full border border-w-200 cursor-pointer transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 font-lato text-[11px] text-w-700 cursor-pointer">
              <input type="color" defaultValue={kind === 'color' ? '#2563eb' : '#fef08a'} onChange={(e) => onPick(e.target.value)} aria-label={`Custom ${label.toLowerCase()}`} className="h-6 w-8 cursor-pointer border border-w-300 rounded" />
              Custom
            </label>
            <button type="button" onClick={() => { onRemove(); setOpen(false) }} className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-w-300 px-2 py-1 font-lato text-[11px] text-w-700 hover:border-w-500 cursor-pointer transition">
              <Eraser size={12} /> Remove {label.toLowerCase()}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Real markdown authoring editor:
 * - Spellcheck on the CodeMirror input area (online professional dictionary
 *   with offline fallback)
 * - Font family / font size — applied to the selected text when a selection
 *   exists, otherwise to the whole document (the classic behavior) via the
 *   `<!-- kcs-style -->` block
 * - Text color and highlight pickers (selection-aware, stored as sanitized
 *   inline `<span style>` and rendered by preview + every published reader)
 * - Clear formatting for the selected text, horizontal rule, drawing tool
 * - Image size & alignment dialog
 */
export function MarkdownEditor({ value, onChange, height = 360, language = 'EN' }: MarkdownEditorProps) {
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [drawingOpen, setDrawingOpen] = useState(false)
  const [selectionActive, setSelectionActive] = useState(false)
  const [spellOpen, setSpellOpen] = useState(false)
  const [spellIssues, setSpellIssues] = useState<SpellIssue[]>([])
  const [spellSuggestions, setSpellSuggestions] = useState<Map<string, string[]>>(new Map())
  const [spellSource, setSpellSource] = useState<SpellSource>('offline')
  const initialStyle = parseDocumentStyle(value).style
  const [fontFamily, setFontFamily] = useState(initialStyle.fontFamily ?? '')
  const [fontSize, setFontSize] = useState(initialStyle.fontSize ?? '')
  const [align, setAlign] = useState<DocumentAlign>(initialStyle.align ?? 'left')
  const [lineHeight, setLineHeight] = useState(initialStyle.lineHeight ?? '')
  const editorRef = useRef<HTMLDivElement>(null)
  const mdEditorRef = useRef<ExposeParam | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const cmReadyRef = useRef(false)
  const contentRef = useRef(unwrapRichDslTokens(parseDocumentStyle(value).content))
  const ignoreRef = useRef<ReadonlySet<string>>(new Set())
  const scanTimerRef = useRef<number | undefined>(undefined)
  const spellAbortRef = useRef<AbortController | null>(null)

  const locale = SPELL_LOCALE[language] ?? (language.length === 2 ? language.toLowerCase() : 'en-US')
  /** Dictionary checking (online-first) covers English and French; other languages use native spellcheck only. */
  const spellLang: SpellLanguage = language === 'FR' ? 'FR' : 'EN'
  const dictionaryActive = language === 'EN' || language === 'FR'

  /** Runs the online+offline spelling scan and applies its results when still current. */
  const runSpelling = async (doc: string) => {
    if (!dictionaryActive) return
    spellAbortRef.current?.abort()
    const controller = new AbortController()
    spellAbortRef.current = controller
    try {
      const result = await runSpellingCheck(doc, spellLang, ignoreRef.current, controller.signal)
      if (controller.signal.aborted || contentRef.current !== doc) return
      const view = viewRef.current
      if (view && cmReadyRef.current && view.state.doc.toString() === doc) {
        view.dispatch({ effects: setSpellMisspellings.of(result.issues.map((i) => ({ from: i.start, to: i.end }))) })
      }
      setSpellIssues(result.issues)
      setSpellSuggestions(result.suggestions)
      setSpellSource(result.source)
    } catch {
      // AbortError from a superseded scan — a newer run owns the state now.
    }
  }

  /** Debounced trigger so continuous typing re-checks the settled document. */
  const scheduleSpelling = (doc: string) => {
    if (!dictionaryActive) return
    window.clearTimeout(scanTimerRef.current)
    scanTimerRef.current = window.setTimeout(() => {
      void runSpelling(doc)
    }, 500)
  }

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
      if (dictionaryActive) {
        scheduleSpelling(doc)
      } else {
        // Non-dictionary language: clear any squiggles left from a previous pass.
        view.dispatch({ effects: setSpellMisspellings.of([]) })
        setSpellIssues([])
        setSpellSuggestions(new Map())
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

  // Re-sync spelling when the value changes externally (e.g. the parent
  // modal switches to another article). Echoes of our own keystrokes already
  // match contentRef and are skipped.
  useEffect(() => {
    const doc = unwrapRichDslTokens(parseDocumentStyle(value).content)
    if (doc === contentRef.current) return
    const view = viewRef.current
    contentRef.current = doc
    if (view && cmReadyRef.current && dictionaryActive) scheduleSpelling(doc)
    // scheduleSpelling is recreated each render; the effect only needs the version from its own render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dictionaryActive, spellLang])

  // Cancel any in-flight online dictionary request and pending rescan on unmount.
  useEffect(() => {
    return () => {
      spellAbortRef.current?.abort()
      window.clearTimeout(scanTimerRef.current)
    }
  }, [])

  // Track whether the author currently has a text selection in the editor —
  // drives the enabled state of the color / highlight / clear-formatting
  // buttons and whether the size picker applies to the selection or the
  // whole document. Synced from the document selection each time it moves.
  useEffect(() => {
    const sync = () => {
      const view = viewRef.current
      setSelectionActive(!!view && !view.state.selection.main.empty)
    }
    window.addEventListener('selectionchange', sync)
    return () => window.removeEventListener('selectionchange', sync)
  }, [])

  const applyStyle = (next: Partial<DocumentStyle>) => {
    const style = { fontFamily, fontSize, align, lineHeight, ...next }
    setFontFamily(style.fontFamily ?? '')
    setFontSize(style.fontSize ?? '')
    setAlign(style.align ?? 'left')
    setLineHeight(style.lineHeight ?? '')
    onChange(encodeDocumentStyle(value, style))
  }

  const previewStyle = [
    fontFamily ? `font-family: ${fontFamily} !important;` : '',
    fontSize ? `font-size: ${fontSize} !important;` : '',
    lineHeight ? `line-height: ${lineHeight} !important;` : '',
  ].filter(Boolean).join(' ')

  const handleEditorChange = (next: string) => {
    contentRef.current = next
    scheduleSpelling(next)
    onChange(encodeDocumentStyle(next, { fontFamily, fontSize, align, lineHeight }))
  }

  /**
   * Pushes a rewritten markdown document into CodeMirror and moves the
   * selection to the offsets the pure span helper computed (the formatted
   * inner text, tags excluded).
   */
  const dispatchSpanResult = (result: SpanEditResult) => {
    const view = viewRef.current
    if (!view || !cmReadyRef.current || !result.applied) return false
    view.dispatch({
      changes: [{ from: 0, to: view.state.doc.length, insert: result.text }],
      selection: { anchor: result.from, head: result.to },
    })
    setSelectionActive(true)
    return true
  }

  /**
   * Selection-aware styling shared by the size picker, color and
   * highlight popovers, and the clear-formatting button. `css` wraps the
   * selection in a styled span; null strips the given properties instead.
   * Returns false when there is no usable selection (the caller then falls
   * back to document-level behavior or stays untouched).
   */
  const applyInlineStyle = (css: string | null, props: ReadonlySet<InlineStyleProp>): boolean => {
    const view = viewRef.current
    if (!view || !cmReadyRef.current || view.state.selection.main.empty) return false
    const { from, to } = view.state.selection.main
    const doc = view.state.doc.toString()
    const result = css
      ? wrapSelectionInSpan(doc, from, to, css)
      : stripSelectionStyles(doc, from, to, props)
    if (result.applied) dispatchSpanResult(result)
    // Selection mode owns this call even when nothing needed to change
    // (already styled identically / nothing to strip) — never fall back to
    // document-level formatting from inside a selection.
    return true
  }

  /** Inserts plain markdown text at the caret (used by HR and the drawing tool). */
  const insertAtCursor = (text: string) => {
    const view = viewRef.current
    if (!view || !cmReadyRef.current) return
    const { from, to } = view.state.selection.main
    const insert = '\n\n' + text + '\n\n'
    view.dispatch({
      changes: [{ from, to, insert }],
      selection: { anchor: from + insert.length },
    })
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
    // Drop the word locally for instant feedback, then let the online/offline
    // rescan confirm (the running check excludes ignored words anyway).
    const remaining = spellIssues.filter((i) => normalizeWord(i.word) !== word)
    const nextSuggestions = new Map(spellSuggestions)
    nextSuggestions.delete(word)
    setSpellIssues(remaining)
    setSpellSuggestions(nextSuggestions)
    const view = viewRef.current
    if (view && cmReadyRef.current) {
      view.dispatch({ effects: setSpellMisspellings.of(remaining.map((i) => ({ from: i.start, to: i.end }))) })
    }
    scheduleSpelling(view ? view.state.doc.toString() : contentRef.current)
    persistIgnore(next)
  }

  const replaceAll = (word: string, replacement: string) => {
    const view = viewRef.current
    const doc = view ? view.state.doc.toString() : contentRef.current
    const positions = occurrencesOfRawWord(doc, word)
      // Replace in reverse order so earlier offsets stay valid.
      .sort((a, b) => b.start - a.start)
      .map((p) => ({ from: p.start, to: p.end, insert: replacement }))
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
    if (!dictionaryActive || !spellOpen) return map
    for (const [word] of groups.slice(0, 40)) map.set(word, spellSuggestions.get(word) ?? suggestFor(word, 4, spellLang))
    return map
  }, [groups, spellOpen, dictionaryActive, spellLang, spellSuggestions])

  return (
    <>
      <style>{`
        .md-editor-preview { word-break: normal !important; overflow-wrap: break-word !important; hyphens: none !important; }
        .md-editor-preview .kcs-img { max-width: 100%; border-radius: 8px; display: block; margin: 14px 0; }
        .md-editor-preview .kcs-img-center { margin-left: auto; margin-right: auto; }
        .md-editor-preview .kcs-img-wrap { box-sizing: border-box; }
        .md-editor-preview .kcs-img-wrap .kcs-img { width: 100%; height: auto; margin: 0; }
        .md-editor-preview :is(h1,h2,h3,h4,h5,table,blockquote,pre,ul,ol,hr) { clear: both; }
        /* Tailwind's preflight sets \`list-style: none\` on ol/ul/menu, which erases the
           bullets and numbers; restore them (outside markers sit in the padding). */
        .md-editor-preview ul { list-style: disc outside; padding-left: 22px; }
        .md-editor-preview ol { list-style: decimal outside; padding-left: 22px; }
        .md-editor-preview ul ul { list-style: circle outside; }
        .md-editor-preview ul ul ul { list-style: square outside; }
        .md-editor-preview li::marker { color: var(--gold); }
        .md-editor-preview img:not(.kcs-img) { max-width: 100%; }
        /* Keep the editor readable while the browser draws its native spelling underline. */
        .md-editor .cm-content { text-decoration: none; }
        .md-editor .cm-line .kcs-spell-error { text-decoration: underline wavy #e11d48; text-decoration-skip-ink: none; text-underline-offset: 2px; }
        ${previewStyle ? `.md-editor-preview { ${previewStyle} }` : ''}
      `}</style>

      {/* Document-level font family + size toolbar row */}
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
            onChange={(e) => {
              const size = e.target.value
              const applied = size
                ? applyInlineStyle(`font-size:${size}`, new Set<InlineStyleProp>(['font-size']))
                : applyInlineStyle(null, new Set<InlineStyleProp>(['font-size']))
              if (!applied) applyStyle({ fontSize: size })
            }}
            title="Applies to the selected text; with no selection it changes the whole document"
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
        {dictionaryActive && (
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
          {dictionaryActive
            ? `Spellcheck + ${spellSource === 'online'
              ? `online professional ${spellLang === 'FR' ? 'French' : 'English'} dictionary (LanguageTool)`
              : `offline ${spellLang === 'FR' ? 'French' : 'English'} dictionary (online unavailable)`}`
            : 'Native spellcheck for the selected language'}
        </span>
      </div>

      {spellOpen && dictionaryActive && (
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
              ? 'Online professional French dictionary (LanguageTool) with the browser’s own spellcheck; falls back to the offline dictionary when the online service is unreachable. Click a suggestion to replace every occurrence; Ignore silences a word for this session.'
              : 'Online professional English dictionary (LanguageTool) with the browser’s own spellcheck; falls back to the offline dictionary when the online service is unreachable. Click a suggestion to replace every occurrence; Ignore silences a word for this session.'}
          </p>
        </div>
      )}

      <div ref={editorRef}>
        <MdEditor
          ref={mdEditorRef}
          modelValue={unwrapRichDslTokens(parseDocumentStyle(value).content)}
          onChange={handleEditorChange}
          language={locale}
          style={{ height }}
          sanitize={sanitizeRichHtml}
          defToolbars={[
          <StyleDropButton
            key="kcs-color"
            kind="color"
            disabled={!selectionActive}
            onPick={(c) => applyInlineStyle(`color:${c}`, new Set<InlineStyleProp>(['color']))}
            onRemove={() => applyInlineStyle(null, new Set<InlineStyleProp>(['color']))}
          />,
          <StyleDropButton
            key="kcs-highlight"
            kind="highlight"
            disabled={!selectionActive}
            onPick={(c) => applyInlineStyle(`background-color:${c}`, new Set<InlineStyleProp>(['background-color']))}
            onRemove={() => applyInlineStyle(null, new Set<InlineStyleProp>(['background-color']))}
          />,
          <button
            key="kcs-clear-format"
            type="button"
            title={selectionActive ? 'Remove color, highlight, font size and font family from the selected text' : 'Clear formatting — select text in the editor first'}
            disabled={!selectionActive}
            aria-label="Clear formatting from the selected text"
            onClick={() => applyInlineStyle(null, CLEAR_FORMAT_PROPS)}
            className={`flex h-full items-center px-2 transition ${selectionActive ? 'cursor-pointer hover:opacity-75' : 'opacity-35 cursor-not-allowed'}`}
          >
            <Eraser size={16} />
          </button>,
          <button
            key="kcs-hr"
            type="button"
            title="Insert a horizontal rule"
            aria-label="Insert a horizontal rule"
            onClick={() => insertAtCursor('---')}
            className="flex h-full items-center px-2 cursor-pointer hover:opacity-75"
          >
            <Minus size={16} />
          </button>,
          <button
            key="kcs-draw"
            type="button"
            title="Draw a picture and insert it"
            aria-label="Open the drawing tool"
            onClick={() => setDrawingOpen(true)}
            className="flex h-full items-center px-2 cursor-pointer hover:opacity-75"
          >
            <Pencil size={16} />
          </button>,
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
      {drawingOpen && (
        <DrawingDialog
          open
          onClose={() => setDrawingOpen(false)}
          onInsertUrl={(url) => {
            insertAtCursor(`![Drawing](${url})`)
            setDrawingOpen(false)
          }}
        />
      )}
    </>
  )
}